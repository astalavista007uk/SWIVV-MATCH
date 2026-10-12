import { supabase } from "@/integrations/supabase/client";

// ponytail: ids are the stable DB contract (emoji/labels are UI only); labels stay French-first here — move to i18n resources if a 2nd locale ships
export const REACTIONS = [
  { id: "craquant", emoji: "😍", label: "Craquant(e)" },
  { id: "jadore", emoji: "❤️", label: "J'adore" },
  { id: "charmant", emoji: "😊", label: "Charmant(e)" },
  { id: "canon", emoji: "🔥", label: "Canon" },
  { id: "clin-doeil", emoji: "😉", label: "Petit clin d'œil" },
  { id: "original", emoji: "✨", label: "Original(e)" },
] as const;
export type ReactionId = (typeof REACTIONS)[number]["id"];
export const isReactionId = (v: unknown): v is ReactionId =>
  typeof v === "string" && (REACTIONS as readonly { id: string }[]).some((r) => r.id === v);
export const reactionOf = (id: string | null | undefined) => REACTIONS.find((r) => r.id === id);

/** Next state for a tap: same = remove (matches the like toggle), different = change, none = create. */
export function resolveToggle(current: ReactionId | null, picked: ReactionId): { next: ReactionId | null; event: "created" | "changed" | "removed" | null } {
  if (!isReactionId(picked)) return { next: current, event: null };
  if (current === picked) return { next: null, event: "removed" };
  return { next: picked, event: current ? "changed" : "created" };
}

const CACHE_KEY = "swivv:photo-reactions:v1";
const UUID = /^[0-9a-f-]{36}$/i;
export const isMemberUuid = (s: string) => UUID.test(s.replace(/^u:/, ""));

function readCache(): Record<string, ReactionId> {
  try {
    return (JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") ?? {}) as Record<string, ReactionId>;
  } catch {
    return {};
  }
}
export function getPhotoReaction(photo: string): ReactionId | null {
  if (typeof localStorage === "undefined") return null;
  const v = readCache()[photo];
  return isReactionId(v) ? v : null;
}
function setCached(photo: string, next: ReactionId | null) {
  try {
    const all = readCache();
    if (next) all[photo] = next;
    else delete all[photo];
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {}
}

/** Public per-type counts for a batch of photos (one RPC, no N+1, no reactor identities). */
export async function fetchReactionCounts(photos: string[]): Promise<Record<string, Partial<Record<ReactionId, number>>>> {
  const out: Record<string, Partial<Record<ReactionId, number>>> = {};
  const uniq = [...new Set(photos.filter(Boolean))].slice(0, 300);
  if (!uniq.length) return out;
  // ponytail: byte-capped batches — member photos are 50-750KB data URLs and one fat call would push tens of MB; smaller cap if galleries ever grow past 300
  const batches: string[][] = [];
  let cur: string[] = [];
  let bytes = 0;
  for (const p of uniq) {
    if (cur.length && bytes + p.length > 400_000) {
      batches.push(cur);
      cur = [];
      bytes = 0;
    }
    cur.push(p);
    bytes += p.length;
  }
  if (cur.length) batches.push(cur);
  try {
    const all = await Promise.all(batches.map((b) => (supabase as any).rpc("photo_reaction_counts", { photos: b })));
    for (const { data } of all) {
      for (const row of (data ?? []) as { photo: string; reaction: string; n: number }[]) {
        if (!isReactionId(row.reaction)) continue;
        (out[row.photo] ??= {})[row.reaction] = Number(row.n) || 0;
      }
    }
  } catch {}
  return out;
}

export type ToggleResult = { ok: boolean; reaction: ReactionId | null; error?: string };

/**
 * Like-toggle twin: optimistic local cache (seed photos stay local-only, like likes),
 * idempotent server upsert for real-member photos, event row for history.
 * ponytail: server is best-effort (warn-only) so gallery taps never hang on RLS/network; the UNIQUE key + rate trigger are the real dedup — a confirm-then-retry flow if silent drops ever matter
 */
export async function togglePhotoReaction(ownerUid: string | null, photo: string, kind: ReactionId): Promise<ToggleResult> {
  if (!photo || !isReactionId(kind)) return { ok: false, reaction: getPhotoReaction(photo), error: "invalid" };
  const prev = getPhotoReaction(photo);
  const { next, event } = resolveToggle(prev, kind);
  if (!event) return { ok: false, reaction: prev, error: "invalid" };
  setCached(photo, next);
  if (!ownerUid || !isMemberUuid(ownerUid)) return { ok: true, reaction: next };
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return { ok: true, reaction: next };
    if (uid === ownerUid.replace(/^u:/, "")) {
      setCached(photo, prev); // ponytail: own-photo taps roll back (server CHECK would reject anyway) — a disabled toolbar state if self-taps ever need hiding
      return { ok: false, reaction: prev, error: "own" };
    }
    const db = supabase as any;
    const owner = ownerUid.replace(/^u:/, "");
    // ponytail: event first (rate trigger gates before state changes); a failed second write leaves a phantom event — atomic RPC if phantoms ever skew stats
    const push = async () => {
      const { error: evErr } = await db.from("swivv_photo_reaction_events").insert({
        photo, owner_id: owner, reactor_id: uid, event, reaction: next,
      });
      if (evErr) throw evErr;
      if (next) {
        const { error } = await db.from("swivv_photo_reactions").upsert(
          { photo, owner_id: owner, reactor_id: uid, reaction: next },
          // ponytail: conflict target is the (photo_hash, reactor_id) unique key — raw photos exceed the btree size limit, so the photo text itself can't be indexed
          { onConflict: "photo_hash,reactor_id" },
        );
        if (error) throw error;
      } else {
        const { error } = await db.from("swivv_photo_reactions").delete().eq("photo", photo).eq("reactor_id", uid);
        if (error) throw error;
      }
    };
    try {
      await push();
    } catch (e) {
      const msg = String((e as { message?: unknown })?.message ?? "");
      // ponytail: stale tab sessions 401 every write (JWTs expire hourly, tabs live for days) — one refresh + retry, then honest failure; app-wide session watchdog if likes/chats start showing it too
      if ((e as { status?: unknown })?.status === 401 || /invalid|expired|jwt/i.test(msg)) {
        await supabase.auth.refreshSession().catch(() => {});
        await push();
      } else throw e;
    }
    return { ok: true, reaction: next };
  } catch (e) {
    // ponytail: warn-only like mirrorSocial (gallery stays usable offline/pre-migration) — the toast carries the user message, this carries the cause
    console.warn("[swivv] reaction mirror skipped", (e as Error)?.message ?? e);
    setCached(photo, prev);
    return { ok: false, reaction: prev, error: "network" };
  }
}

// --- pure analytics helpers (stats page + bun tests) ---
export type ActiveReaction = { photo: string; reaction: ReactionId; reactor: string; at: number; updated: number };
export type ReactionEvent = { photo: string; event: "created" | "changed" | "removed"; reaction: ReactionId | null; reactor: string; at: number };

/** Per-type counts + share of the active total; zero total stays 0/0 (no NaN). */
export function breakdown(rows: ActiveReaction[]): { id: ReactionId; emoji: string; label: string; n: number; pct: number }[] {
  const total = rows.length;
  return REACTIONS.map((r) => {
    const n = rows.filter((x) => x.reaction === r.id).length;
    return { ...r, n, pct: total === 0 ? 0 : Math.round((n / total) * 100) };
  });
}

/** Day buckets (oldest→newest) of creations; zero days stay 0, never fabricated. */
export function creationsByDay(events: ReactionEvent[], days: number, now = Date.now()): number[] {
  const out = new Array(days).fill(0);
  const DAY = 864e5;
  for (const e of events) {
    if (e.event !== "created") continue;
    const d = Math.floor((now - e.at) / DAY);
    if (d >= 0 && d < days) out[days - 1 - d]++;
  }
  return out;
}

/** Top photo by active reactions; ties break by earliest first reaction (stable, documented). */
export function topPhoto(rows: ActiveReaction[], firstSeen: Record<string, number>): string | null {
  if (!rows.length) return null;
  const byPhoto = new Map<string, number>();
  for (const r of rows) byPhoto.set(r.photo, (byPhoto.get(r.photo) ?? 0) + 1);
  return [...byPhoto.entries()].sort((a, b) => b[1] - a[1] || (firstSeen[a[0]] ?? 0) - (firstSeen[b[0]] ?? 0))[0][0];
}

/** Mode reaction of a photo's active rows; ties follow REACTIONS order. */
export function modeReaction(rows: ActiveReaction[]): ReactionId | null {
  if (!rows.length) return null;
  let best: ReactionId | null = null;
  let bestN = 0;
  for (const r of REACTIONS) {
    const n = rows.filter((x) => x.reaction === r.id).length;
    if (n > bestN) { bestN = n; best = r.id; }
  }
  return best;
}
