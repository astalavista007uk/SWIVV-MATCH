// ponytail: pure notification rules (no supabase/react) so bun test covers them with zero deps — keep every rule here, components only call in
export const MSG_WINDOW = 6 * 3600e3; // one batched email per peer per 6h
export const LIKE_WINDOW = 24 * 3600e3; // one like-email per liker per day
export const VIEW_CD = 24 * 3600e3; // one view alert per viewer per day
export const CHAT_CD = 10 * 60e3; // one in-app ping per conversation per 10min
export const REACT_CD = 24 * 3600e3; // one photo-reaction ping per reactor per day (batching, not per-photo spam)

/** Generic window check: true when no prior event or the window has elapsed. */
export function windowElapsed(lastAt: number | null | undefined, now: number, windowMs: number): boolean {
  if (lastAt == null) return true;
  return now - lastAt >= windowMs;
}

/** Digest cadence: activity-triggered (no cron in this stack) — at most one per interval. */
export function digestDue(lastSent: number | null | undefined, now: number, freq: string): boolean {
  if (freq === "off") return false;
  const interval = freq === "weekly" ? 7 * 86400e3 : 86400e3;
  return windowElapsed(lastSent, now, interval);
}

/** Open-redirect guard: only known internal destinations. member ids must be uuids. */
const UUID = /^[0-9a-f-]{36}$/i;
export function validLink(link: string | null | undefined): boolean {
  if (!link || !link.startsWith("/")) return false;
  if (link.startsWith("//")) return false;
  const [path] = link.split("?");
  if (["/messagerie", "/matches", "/mon-profil", "/verification", "/parametres", "/notifications", "/browse", "/swipe", "/statistiques"].includes(path)) return true;
  const m = path.match(/^\/member\/([^/]+)$/);
  return !!m && UUID.test(m[1]);
}

/** Email gate: prefs key per category, security bypasses prefs, marketing stands alone. */
export function emailAllowed(prefs: Record<string, boolean>, category: "messages" | "liked" | "matches" | "interactions" | "security"): boolean {
  if (category === "security") return true;
  const map = { messages: "emailMessages", liked: "emailLiked", matches: "emailMatches", interactions: "emailInteractions" } as const;
  return prefs[map[category]] !== false;
}

/** Fixed neutral stand-in: message bodies never reach the email template (which would otherwise quote them). */
export const SAFE_MSG_PREVIEW = "Un nouveau message t'attend";
export function previewForEmail(_body: string): string {
  return SAFE_MSG_PREVIEW;
}

/** Idempotency keys: match = once ever; like = daily per liker; message = 6h window per peer. */
export function emailKey(kind: "message" | "like" | "match" | "digest" | "security", counterparty: string, now: number): string {
  if (kind === "match") return `match:${counterparty}`;
  const bucket = kind === "like" || kind === "digest" ? new Date(now).toISOString().slice(0, 10) : `${Math.floor(now / MSG_WINDOW)}`;
  return `${kind}:${counterparty}:${bucket}`;
}

/** Badge text with the existing 9+ cap. */
export function badgeText(n: number): string {
  return n > 9 ? "9+" : String(Math.max(0, n));
}
