import { supabase } from "@/integrations/supabase/client";
import { emailRequest } from "@/lib/notify.functions";

export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export type MessageRequest = {
  id: string;
  sender_id: string;
  recipient_id: string;
  initial_message: string;
  status: RequestStatus;
  text_allowed: boolean;
  voice_allowed: boolean;
  files_allowed: boolean;
  voice_requested: boolean;
  files_requested: boolean;
  conversation_key: string;
  sender_name: string;
  sender_photo: string;
  created_at: string;
  responded_at: string | null;
};

export type MediaKind = "voice" | "files";

export const REQUEST_COOLDOWN_MS = 7 * 24 * 3600 * 1000;
export const REQUEST_MAX = 500;

export function otherParty(r: MessageRequest, me: string): string {
  return r.sender_id === me ? r.recipient_id : r.sender_id;
}

/** Newest request between me and `peerId` (any status). */
export function latestRequest(
  requests: MessageRequest[],
  peerId: string,
  me: string,
): MessageRequest | undefined {
  const bare = peerId.replace(/^u:/, "");
  return requests.find((r) => otherParty(r, me).replace(/^u:/, "") === bare);
}

/** Accepted request between me and `peerId` (its initial message is the thread's first bubble). */
export function acceptedRequest(
  requests: MessageRequest[],
  peerId: string,
  me: string,
): MessageRequest | undefined {
  const bare = peerId.replace(/^u:/, "");
  return requests.find((r) => r.status === "accepted" && otherParty(r, me).replace(/^u:/, "") === bare);
}

export function canText(r: MessageRequest | undefined, blocked = false): boolean {
  if (blocked) return false;
  // ponytail: undefined = pre-migration rows (text was implicit); false = explicitly not granted yet
  return r?.status === "accepted" && r.text_allowed !== false;
}

export function canMedia(r: MessageRequest | undefined, kind: MediaKind): boolean {
  if (r?.status !== "accepted") return false;
  return kind === "voice" ? r.voice_allowed : r.files_allowed;
}

export function canRequest(
  r: MessageRequest | undefined,
  opts: { blocked: boolean; now?: number },
): boolean {
  if (opts.blocked) return false;
  if (!r) return true;
  if (r.status === "pending" || r.status === "accepted") return false;
  if (r.status === "declined" && r.responded_at) {
    return (opts.now ?? Date.now()) - new Date(r.responded_at).getTime() >= REQUEST_COOLDOWN_MS;
  }
  return true;
}

export function cooldownDaysLeft(r: MessageRequest | undefined, now = Date.now()): number {
  if (!r || r.status !== "declined" || !r.responded_at) return 0;
  const left = new Date(r.responded_at).getTime() + REQUEST_COOLDOWN_MS - now;
  return Math.max(0, Math.ceil(left / (24 * 3600 * 1000)));
}

export function matchesRequest(r: MessageRequest, kind: MediaKind): boolean {
  return kind === "voice" ? r.voice_allowed : r.files_allowed;
}

export function asksFor(r: MessageRequest, kind: MediaKind): boolean {
  return kind === "voice" ? r.voice_requested : r.files_requested;
}

async function uid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function listRequests(): Promise<MessageRequest[]> {
  const me = await uid();
  if (!me) return [];
  const { data, error } = await supabase
    .from("swivv_message_requests")
    .select("*")
    .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MessageRequest[];
}

export async function sendRequest(toUid: string, text: string): Promise<string | null> {
  const me = await uid();
  if (!me) return "Connecte-toi pour envoyer une demande.";
  const body = text.trim();
  if (!body) return "Écris un message avant d'envoyer.";
  if (body.length > REQUEST_MAX) return `Message trop long (${REQUEST_MAX} caractères max).`;
  const { data, error } = await supabase
    .from("swivv_message_requests")
    .insert({
      sender_id: me,
      recipient_id: toUid.replace(/^u:/, ""),
      initial_message: body,
    })
    .select("id")
    .single();
  if (error) {
    if (String(error.code) === "23505") return "Une demande est déjà en attente avec ce membre.";
    return "Envoi impossible. Réessaie plus tard.";
  }
  // ponytail: fire-and-forget — the in-app notification is already written by the DB trigger; the e-mail is best-effort
  void emailRequest({ data: { requestId: String(data.id) } }).catch(() => {});
  return null;
}

export async function respondRequest(
  id: string,
  accept: boolean,
  text: boolean,
  voice: boolean,
  files: boolean,
): Promise<string | null> {
  const patch = {
    status: accept ? "accepted" : "declined",
    text_allowed: accept && text,
    voice_allowed: accept && voice,
    files_allowed: accept && files,
    voice_requested: false,
    files_requested: false,
  };
  let { error } = await supabase.from("swivv_message_requests").update(patch).eq("id", id);
  if (error && /text_allowed/.test(error.message)) {
    // ponytail: DB without 20261103 — accept without the text flag (text stays implicit); remove once the migration is live
    const legacy = {
      status: patch.status,
      voice_allowed: patch.voice_allowed,
      files_allowed: patch.files_allowed,
      voice_requested: false,
      files_requested: false,
    };
    ({ error } = await supabase.from("swivv_message_requests").update(legacy).eq("id", id));
  }
  return error ? "Réponse impossible. Réessaie." : null;
}

/** Recipient grants/revokes text; either side may revoke it. */
export async function answerText(id: string, allow: boolean): Promise<string | null> {
  const { error } = await supabase.from("swivv_message_requests").update({ text_allowed: allow }).eq("id", id);
  return error ? "Réponse impossible. Réessaie." : null;
}

export async function cancelRequest(id: string): Promise<string | null> {
  const { error } = await supabase
    .from("swivv_message_requests")
    .update({ status: "cancelled" })
    .eq("id", id);
  return error ? "Annulation impossible. Réessaie." : null;
}

export async function askPermission(id: string, kind: MediaKind): Promise<string | null> {
  const { error } = await supabase
    .from("swivv_message_requests")
    .update(kind === "voice" ? { voice_requested: true } : { files_requested: true })
    .eq("id", id);
  return error ? "Demande impossible. Réessaie." : null;
}

export async function answerPermission(
  id: string,
  kind: MediaKind,
  accept: boolean,
): Promise<string | null> {
  const patch =
    kind === "voice"
      ? { voice_allowed: accept, voice_requested: false }
      : { files_allowed: accept, files_requested: false };
  const { error } = await supabase.from("swivv_message_requests").update(patch).eq("id", id);
  return error ? "Réponse impossible. Réessaie." : null;
}

export async function revokePermission(id: string, kind: MediaKind): Promise<string | null> {
  const { error } = await supabase
    .from("swivv_message_requests")
    .update(kind === "voice" ? { voice_allowed: false } : { files_allowed: false })
    .eq("id", id);
  return error ? "Modification impossible. Réessaie." : null;
}
