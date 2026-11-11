// Upload limits shared by the composer, the store and the validate-upload Edge Function.
// ponytail: one attachment per message is structural (single file_url column + one input),
// not a counter. The Edge Function re-checks all of this server-side.

export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
export const MAX_VOICE_BYTES = 5 * 1024 * 1024;
export const STORAGE_QUOTA_BYTES = 100 * 1024 * 1024;

export const ATTACHMENT_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "text/plain": "txt",
};

const EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf", "txt"];
const VOICE_MIME = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"];

export type AttachmentKind = "image" | "file";

export function attachmentKind(type: string): AttachmentKind {
  return type.startsWith("image/") ? "image" : "file";
}

function normalizeMime(file: { name: string; type: string }): string {
  const declared = file.type.toLowerCase().split(";")[0].trim();
  if (declared === "image/jpg") return "image/jpeg";
  if (declared) return declared;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (
    Object.keys(ATTACHMENT_MIME).find(
      (m) => ATTACHMENT_MIME[m] === ext || (ext === "jpeg" && m === "image/jpeg"),
    ) ?? ""
  );
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
      return true; // checked on the whole payload below
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

export async function validateAttachment(file: File): Promise<string | null> {
  if (file.size === 0) return "Fichier vide.";
  if (file.size > MAX_ATTACHMENT_BYTES) return "Fichier trop lourd (2 Mo max par pièce jointe).";
  const mime = normalizeMime(file);
  if (!ATTACHMENT_MIME[mime]) return "Format non autorisé. Autorisés : JPG, PNG, WebP, PDF et TXT.";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSIONS.includes(ext))
    return "Extension non autorisée. Autorisées : JPG, JPEG, PNG, WebP, PDF et TXT.";
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!signatureOk(mime, head))
    return "Fichier invalide : son contenu ne correspond pas au format annoncé.";
  if (mime === "text/plain") {
    const all = new Uint8Array(await file.arrayBuffer());
    if (!textOk(all)) return "Fichier TXT invalide : contenu binaire ou encodage non UTF-8.";
  }
  return null;
}

export async function validateVoice(blob: Blob): Promise<string | null> {
  if (blob.size === 0) return "Enregistrement vide.";
  if (blob.size > MAX_VOICE_BYTES) return "Vocal trop lourd (5 Mo max).";
  const type = (blob.type || "audio/webm").toLowerCase();
  if (!VOICE_MIME.includes(type.split(";")[0])) return "Format audio non autorisé.";
  return null;
}

export function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
    : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}
