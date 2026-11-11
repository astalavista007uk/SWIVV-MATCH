// SWIVV MATCH upload gateway: size, MIME, extension, magic-byte signature, permission,
// per-user quota, then a private-bucket write with the service role. The browser never
// writes to swivv-voice directly (storage insert policy removed in the attachment migration).
//
// Deploy: supabase functions deploy validate-upload
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (built-in on Supabase).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "swivv-voice";
const MAX_ATTACHMENT = 2 * 1024 * 1024;
const MAX_VOICE = 5 * 1024 * 1024;
const QUOTA = 100 * 1024 * 1024;
const ATTACHMENT_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "text/plain": "txt",
};
const VOICE_MIME = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "pdf", "txt"];

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function signatureOk(mime: string, head: Uint8Array): boolean {
  const at = (offset: number, bytes: number[]) => bytes.every((b, i) => head[offset + i] === b);
  switch (mime) {
    case "image/jpeg":
      return at(0, [0xff, 0xd8, 0xff]);
    case "image/png":
      return at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50]);
    case "application/pdf":
      return at(0, [0x25, 0x50, 0x44, 0x46]);
    case "text/plain":
      return true;
    default:
      return false;
  }
}

function textOk(bytes: Uint8Array): boolean {
  if (bytes.some((b) => b === 0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Non authentifié." }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userError || !user) return json({ error: "Non authentifié." }, 401);

    const form = await req.formData();
    const peerRaw = String(form.get("peer") ?? "");
    const peer = peerRaw.replace(/^u:/, "");
    const kind = String(form.get("kind") ?? "attachment");
    const msgId = String(form.get("msgId") ?? "");
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Fichier manquant." }, 400);
    if (!/^[\w.-]{1,64}$/.test(msgId)) return json({ error: "Identifiant de message invalide." }, 400);
    if (!["voice", "attachment"].includes(kind)) return json({ error: "Type d'envoi invalide." }, 400);

    const max = kind === "voice" ? MAX_VOICE : MAX_ATTACHMENT;
    if (file.size === 0) return json({ error: "Fichier vide." }, 400);
    if (file.size > max) {
      return json({ error: kind === "voice" ? "Vocal trop lourd (5 Mo max)." : "Fichier trop lourd (2 Mo max)." }, 413);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const head = bytes.slice(0, 16);
    const mime = (file.type || "").toLowerCase().split(";")[0];
    let ext = "";
    let objectKey = "";

    if (kind === "voice") {
      if (!VOICE_MIME.includes(mime)) return json({ error: "Format audio non autorisé." }, 415);
      ext = mime === "audio/mp4" ? "m4a" : mime === "audio/ogg" ? "ogg" : mime === "audio/mpeg" ? "mp3" : "webm";
      objectKey = `${user.id}/${peerRaw || "peer"}/${msgId}.${ext}`;
    } else {
      if (!ATTACHMENT_EXT[mime]) {
        return json({ error: "Format non autorisé. Autorisés : JPG, PNG, WebP, PDF et TXT." }, 415);
      }
      const fileExt = (file.name.split(".").pop() ?? "").toLowerCase();
      if (!ALLOWED_EXT.includes(fileExt)) {
        return json({ error: "Extension non autorisée. Autorisées : JPG, JPEG, PNG, WebP, PDF et TXT." }, 415);
      }
      if (!signatureOk(mime, head)) {
        return json({ error: "Fichier invalide : son contenu ne correspond pas au format annoncé." }, 415);
      }
      if (mime === "text/plain" && !textOk(bytes)) {
        return json({ error: "Fichier TXT invalide : contenu binaire ou encodage non UTF-8." }, 415);
      }
      ext = ATTACHMENT_EXT[mime];
      const folder = mime.startsWith("image/") ? "images" : "files";
      objectKey = `${user.id}/${peerRaw || "peer"}/${folder}/${msgId}.${ext}`;
    }

    // Reuse the DB permission function with the caller's JWT (RLS stays the source of truth).
    if (peer && /^[0-9a-f-]{36}$/i.test(peer)) {
      const mediaKind = kind === "voice" ? "voice" : "files";
      const { data: allowed, error: rpcError } = await userClient.rpc("swivv_media_allowed", {
        a: user.id,
        b: peer,
        kind: mediaKind,
      });
      if (rpcError) return json({ error: "Vérification impossible. Réessaie." }, 500);
      if (!allowed) return json({ error: "Envoi non autorisé pour cette conversation." }, 403);
    }

    const admin = createClient(url, service);
    const { data: usage } = await admin
      .from("swivv_storage_usage")
      .select("bytes")
      .eq("user_id", user.id)
      .maybeSingle();
    if ((usage?.bytes ?? 0) + file.size > QUOTA) {
      return json({ error: "Quota de stockage atteint (100 Mo). Supprime d'anciens médias." }, 413);
    }

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(objectKey, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (uploadError) return json({ error: "Envoi impossible. Réessaie." }, 500);

    return json({ path: objectKey, size: file.size, type: mime, ext });
  } catch (_e) {
    return json({ error: "Envoi impossible. Réessaie." }, 400);
  }
});
