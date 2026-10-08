import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  at: string;
  audio?: string;
  dur?: number;
  image?: string;
  ts?: number;
  // ponytail: sender snapshot rides the cache so re-pushes never strip it (undefined keys drop out of the JSON payload)
  peerName?: string;
  peerPhoto?: string;
};

const LIKES_KEY = "swivv:likes:v1";
const MATCHES_KEY = "swivv:matches:v1";
const BLOCKED_KEY = "swivv:blocked:v1";
const REPORTED_KEY = "swivv:reported:v1";
const CHATS_KEY = "swivv:chats:v2";
const READ_KEY = "swivv:chats-read:v1";
const SETTINGS_KEY = "swivv:settings:v1";
const VIEWS_KEY = "swivv:profile-views:v1";
const FAVS_KEY = "swivv:favorites:v1";
const HIDDEN_KEY = "swivv:hidden:v1";
const MOD_KEY = "swivv:moderation:v1";
const PEERS_KEY = "swivv:peers:v2";

/** Minimal peer directory so real (non-seed) conversations survive in the inbox. */
export type PeerInfo = { id: string; name: string; photo: string };

export function rememberPeer(p: PeerInfo) {
  if (typeof localStorage === "undefined" || !p.id) return;
  const all = read<Record<string, PeerInfo>>(PEERS_KEY, {});
  if (all[p.id]?.name === p.name && all[p.id]?.photo === p.photo) return;
  write(PEERS_KEY, { ...all, [p.id]: p });
}

export function getPeer(id: string): PeerInfo | null {
  if (typeof localStorage === "undefined") return null;
  return read<Record<string, PeerInfo>>(PEERS_KEY, {})[id] ?? null;
}

// ponytail: a missing public row reads as deleted (hidden rows are RLS-invisible too) — server flag if the two ever need splitting
export function useDeletedIds(ids: string[]): Set<string> {
  const [del, setDel] = useState<Set<string>>(new Set());
  const key = ids.join(",");
  useEffect(() => {
    const uids = key.split(",").filter((i) => i.startsWith("u:"));
    if (!uids.length) {
      setDel(new Set());
      return;
    }
    let live = true;
    (supabase as any)
      .from("swivv_profiles")
      .select("user_id")
      .in("user_id", uids.map((i) => i.slice(2)))
      .then(({ data }: { data: { user_id: string }[] | null }) => {
        if (!live) return;
        const found = new Set((data ?? []).map((r) => `u:${r.user_id}`));
        setDel(new Set(uids.filter((u) => !found.has(u))));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key]);
  return del;
}

export type SwivvSettings = {
  msgBadge: boolean;
  emailMessages: boolean;
  emailLiked: boolean;
  emailMatches: boolean;
  emailInteractions: boolean;
  emailOffers: boolean;
  rtMessages: boolean;
  rtLiked: boolean;
  rtViewed: boolean;
  rtFavourite: boolean;
  rtPotential: boolean;
};
const DEFAULT_SETTINGS: SwivvSettings = {
  msgBadge: true,
  emailMessages: true,
  emailLiked: true,
  emailMatches: true,
  emailInteractions: true,
  emailOffers: false,
  rtMessages: true,
  rtLiked: true,
  rtViewed: true,
  rtFavourite: true,
  rtPotential: true,
};

export function getSettings(): SwivvSettings {
  if (typeof localStorage === "undefined") return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...read<Partial<SwivvSettings>>(SETTINGS_KEY, {}) };
}

export function setSetting<K extends keyof SwivvSettings>(k: K, v: SwivvSettings[K]) {
  write(SETTINGS_KEY, { ...getSettings(), [k]: v });
}

// ponytail: app language only picks the translation target for now (UI stays French) — full i18n if a 2nd locale ships
const APP_LANG_KEY = "swivv-lang";
export const APP_LANGS = ["fr", "en", "es", "de", "it", "pt"] as const;
export function getAppLang(): string {
  if (typeof localStorage === "undefined") return "fr";
  try {
    const v = localStorage.getItem(APP_LANG_KEY);
    return v && (APP_LANGS as readonly string[]).includes(v) ? v : "fr";
  } catch {
    return "fr";
  }
}
export function setAppLang(v: string) {
  try {
    localStorage.setItem(APP_LANG_KEY, v);
  } catch {}
}

export function clearSwivvLocal() {
  for (const k of [LIKES_KEY, MATCHES_KEY, BLOCKED_KEY, REPORTED_KEY, CHATS_KEY, READ_KEY, SETTINGS_KEY, HIDDEN_KEY, VIEWS_KEY, FAVS_KEY, MATCH_CRITERIA_KEY, MATCH_CRITERIA_AT_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
  notify();
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
  notify();
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function getLikes(): string[] {
  if (typeof localStorage === "undefined") return [];
  return read<string[]>(LIKES_KEY, []);
}

export function getMatches(): string[] {
  if (typeof localStorage === "undefined") return [];
  return read<string[]>(MATCHES_KEY, []);
}

export function toggleLike(id: string): { liked: boolean; matched: boolean } {
  const likes = new Set(getLikes());
  const matches = new Set(getMatches());
  let matched = false;
  if (likes.has(id)) {
    likes.delete(id);
  } else {
    likes.add(id);
    if (!matches.has(id) && autoReciprocates(id)) {
      matches.add(id);
      matched = true;
      write(MATCHES_KEY, [...matches]);
    }
  }
  write(LIKES_KEY, [...likes]);
  void pushLikes();
  const liked = likes.has(id);
  if (isUuid(id)) void mirrorSocial(liked ? "like" : "unlike", id);
  return { liked, matched };
}

/** Deterministic stand-in for "they liked/favourited me back": 1 id in 3 reciprocates. */
function autoReciprocates(id: string): boolean {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) % 997;
  return hash % 3 === 0;
}

// ponytail: likes+matches live in swivv_profiles.data (no new table); union-merge, last writer wins, unlikes don't delete server-side yet
async function pushLikes() {
  if (typeof localStorage === "undefined") return;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return; // logged out: local only, uploaded on next login via pullLikes
  const { data: row } = await (supabase as any)
    .from("swivv_profiles")
    .select("data")
    .eq("user_id", uid)
    .maybeSingle();
  await (supabase as any)
    .from("swivv_profiles")
    .upsert({ user_id: uid, data: { ...(row?.data ?? {}), likes: getLikes(), matches: getMatches() } });
}

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

// ponytail: server mirror for the admin graph (warn-only until the migration is applied — local stays source of truth); seed ids never leave the browser so server counts stay honest
async function mirrorSocial(kind: "like" | "unlike" | "block" | "unblock", target: string) {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return;
  const q = supabase as any;
  const { error } = await (kind === "like"
    ? q.from("swivv_likes").upsert({ liker_id: uid, liked_id: target }, { onConflict: "liker_id,liked_id" })
    : kind === "unlike"
      ? q.from("swivv_likes").delete().eq("liker_id", uid).eq("liked_id", target)
      : kind === "block"
        ? q.from("swivv_blocks").upsert({ blocker_id: uid, blocked_id: target }, { onConflict: "blocker_id,blocked_id" })
        : q.from("swivv_blocks").delete().eq("blocker_id", uid).eq("blocked_id", target));
  if (error) {
    console.warn("[swivv] social mirror skipped", error.message ?? error);
    return;
  }
  // ponytail: a match row means REAL mutual consent (reverse like exists) — the 1-in-3 auto-match stays a local UX stand-in and never reaches the server
  if (kind === "like") {
    const { data: back } = await q.from("swivv_likes").select("liker_id").eq("liker_id", target).eq("liked_id", uid).maybeSingle();
    if (back) {
      const [a, b] = [uid, target].sort();
      const { error: mErr } = await q.from("swivv_matches").upsert({ user_a: a, user_b: b }, { onConflict: "user_a,user_b" });
      if (mErr) console.warn("[swivv] match mirror skipped", mErr.message ?? mErr);
    }
  }
}

/** Pull server likes/matches into cache, then push local ones (first login uploads this browser's history). */
export async function pullLikes(uid: string) {
  if (typeof localStorage === "undefined") return;
  const { data: row } = await (supabase as any)
    .from("swivv_profiles")
    .select("data")
    .eq("user_id", uid)
    .maybeSingle();
  const d = (row?.data ?? {}) as { likes?: string[]; matches?: string[] };
  write(LIKES_KEY, [...new Set([...getLikes(), ...(d.likes ?? [])])]);
  write(MATCHES_KEY, [...new Set([...getMatches(), ...(d.matches ?? [])])]);
  await pushLikes();
}

// ponytail: local-only until a backend table exists — same read/write pattern as likes
function toggleId(key: string, id: string): boolean {
  const set = new Set<string>(typeof localStorage === "undefined" ? [] : read<string[]>(key, []));
  if (set.has(id)) set.delete(id);
  else set.add(id);
  write(key, [...set]);
  return set.has(id);
}

export function getFavorites(): string[] {
  if (typeof localStorage === "undefined") return [];
  return read<string[]>(FAVS_KEY, []);
}

export function toggleFavorite(id: string): boolean {
  return toggleId(FAVS_KEY, id);
}

// ponytail: hidden flag rides in swivv_profiles.data like likes — filter real user profiles out of browse/matches when they go public
export function isProfileHidden(): boolean {
  if (typeof localStorage === "undefined") return false;
  return read<boolean>(HIDDEN_KEY, false);
}

export async function setProfileHidden(hidden: boolean) {
  if (typeof localStorage !== "undefined") write(HIDDEN_KEY, hidden);
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return;
  const { data: row } = await (supabase as any)
    .from("swivv_profiles")
    .select("data")
    .eq("user_id", uid)
    .maybeSingle();
  await (supabase as any)
    .from("swivv_profiles")
    .upsert({ user_id: uid, data: { ...(row?.data ?? {}), profileHidden: hidden } });
}

/** Profiles that liked me back (incoming side), whether or not I still like them. */
export function isLikedBack(id: string): boolean {
  return getMatches().includes(id);
}

/** Full match (call + voice unlocked): mutual like. */
export function isMatch(id: string): boolean {
  return getMatches().includes(id);
}

export function getBlocked(): string[] {
  if (typeof localStorage === "undefined") return [];
  return read<string[]>(BLOCKED_KEY, []);
}

export function toggleBlock(id: string): boolean {
  const blocked = toggleId(BLOCKED_KEY, id);
  if (isUuid(id)) void mirrorSocial(blocked ? "block" : "unblock", id);
  return blocked;
}

export function isReported(id: string): boolean {
  if (typeof localStorage === "undefined") return false;
  return read<string[]>(REPORTED_KEY, []).includes(id);
}

export function reportMember(id: string, by?: string, reason?: string) {
  if (!isReported(id)) write(REPORTED_KEY, [...read<string[]>(REPORTED_KEY, []), id]);
  // ponytail: reports double as the moderation outbox (this device only) — server table + admin role when a real back-office lands
  logModReport({ target: id, by: by ?? "", at: new Date().toISOString(), detail: reason });
  // ponytail: real-user reports also land in the server queue (seed ids stay local-only) — reason comes from the profile dialog, free text lands verbatim in category
  if (id.startsWith("u:")) {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      void supabase.from("swivv_reports").insert({
        reporter_id: data.user.id,
        reported_user_id: id.slice(2),
        category: reason ?? "other",
        description: by ? `Signalé par ${by}` : null,
      });
    });
  }
}

export type ModReport = { target: string; by: string; at: string; detail?: string };

export function getModReports(): ModReport[] {
  if (typeof localStorage === "undefined") return [];
  return read<ModReport[]>(MOD_KEY, []);
}

export function logModReport(r: ModReport) {
  if (typeof localStorage === "undefined") return;
  const box = read<ModReport[]>(MOD_KEY, []);
  if (!box.some((x) => x.target === r.target && x.detail === r.detail)) {
    write(MOD_KEY, [...box, r]);
    notify();
  }
}

export function resolveModReport(target: string) {
  write(MOD_KEY, read<ModReport[]>(MOD_KEY, []).filter((r) => r.target !== target));
  notify();
}

export function getChat(id: string): ChatMessage[] {
  if (typeof localStorage === "undefined") return [];
  // ponytail: oldest first by send time (id embeds Date.now(), ts when present) — day separators if threads ever need them
  const list = read<Record<string, ChatMessage[]>>(CHATS_KEY, {})[id] ?? [];
  // ponytail: ts backfilled from the id for pre-timestamp rows, so every message gets a date — drop once caches turn over
  const withTs = list.map((m) => (m.ts ? m : { ...m, ts: parseInt(m.id, 10) || undefined }));
  return [...withTs].filter(isRecent).sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
}

/** Full date + time stamp, HH:MM fallback for legacy rows. */
export function fmtFull(ts: number | undefined, fallback: string): string {
  if (!ts) return fallback;
  return new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Ids with at least one sent or received message, most recent thread first. */
export function getChattedIds(): string[] {
  if (typeof localStorage === "undefined") return [];
  // ponytail: msg ids embed Date.now() so recency sorts without extra timestamps — real date field if ids ever stop being time-based
  const chats = read<Record<string, ChatMessage[]>>(CHATS_KEY, {});
  return Object.entries(chats)
    .map(([id, msgs]) => ({ id, msgs: msgs.filter(isRecent) }))
    .filter((x) => x.msgs.length > 0)
    .map(({ id, msgs }) => ({ id, at: Math.max(...msgs.map((m) => m.ts ?? parseInt(m.id, 10) ?? 0)) }))
    .sort((a, b) => b.at - a.at)
    .map((x) => x.id);
}

// ponytail: 3-month retention (storage diet, read or not) — own rows only; recipient copies age out on their devices, pg_cron when retention needs enforcing
const RETENTION_MS = 90 * 24 * 3600 * 1000;

function isRecent(m: ChatMessage): boolean {
  return (m.ts ?? parseInt(m.id, 10) ?? 0) > Date.now() - RETENTION_MS;
}

/** Drop expired threads locally + server-side. Runs on boot; readers also filter. */
export async function pruneOldChats(uid: string): Promise<void> {
  try {
    if (typeof localStorage !== "undefined") {
      const chats = read<Record<string, ChatMessage[]>>(CHATS_KEY, {});
      let changed = false;
      for (const [id, msgs] of Object.entries(chats)) {
        const kept = msgs.filter(isRecent);
        if (kept.length !== msgs.length) {
          changed = true;
          if (kept.length) chats[id] = kept;
          else delete chats[id];
        }
      }
      if (changed) write(CHATS_KEY, chats);
    }
    await (supabase as any).from("swivv_chats").delete().eq("user_id", uid).lt("created_at", new Date(Date.now() - RETENTION_MS).toISOString());
  } catch {}
}

/** Unread "them" messages since last mark-all-read. Subscribe via useUnreadCount. */
export function getUnreadCount(): number {
  if (typeof localStorage === "undefined" || !getSettings().msgBadge) return 0;
  const chats = read<Record<string, ChatMessage[]>>(CHATS_KEY, {});
  const seen = new Set(read<string[]>(READ_KEY, []));
  return Object.values(chats)
    .flat()
    .filter((m) => m.from === "them" && !seen.has(m.id)).length;
}

export function useUnreadCount(): number {
  useSyncExternalStore(subscribe, getUnreadCount, () => 0);
  return getUnreadCount();
}

/** All live messages across threads. Subscribe via useTotalCount. */
// ponytail: counts both directions (not just "them") — per-thread breakdown if the title ever needs it
export function useTotalCount(): number {
  useSyncExternalStore(subscribe, getTotalCount, () => 0);
  return getTotalCount();
}

function getTotalCount(): number {
  if (typeof localStorage === "undefined") return 0;
  return Object.values(read<Record<string, ChatMessage[]>>(CHATS_KEY, {})).flat().filter(isRecent).length;
}

export function markAllRead() {
  if (typeof localStorage === "undefined") return;
  const ids = Object.values(read<Record<string, ChatMessage[]>>(CHATS_KEY, {}))
    .flat()
    .filter((m) => m.from === "them")
    .map((m) => m.id);
  write(READ_KEY, ids);
}

/** Received likes, as shown by the "recus" view: matches minus blocked. Subscribe via useRecusCount. */
export function getRecusCount(): number {
  if (typeof localStorage === "undefined") return 0;
  const blocked = new Set(getBlocked());
  return getMatches().filter((id) => !blocked.has(id)).length;
}

/** Match criteria sync (My Matches page): newer side wins via savedAt. */
export const MATCH_CRITERIA_KEY = "swivv-match-criteria";
const MATCH_CRITERIA_AT_KEY = "swivv-match-criteria:at";
// ponytail: explicit-save flag (signup seeds criteria without it) — server savedAt if the flag ever needs to cross devices
const MATCH_CRITERIA_SAVED_KEY = "swivv-match-criteria:saved";

export function markMatchCriteriaSaved() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(MATCH_CRITERIA_SAVED_KEY, "1");
  } catch {}
}

export function hasSavedMatchCriteria(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(MATCH_CRITERIA_SAVED_KEY) === "1";
  } catch {
    return false;
  }
}

// ponytail: visit flag beside the save flag — one combined "onboarded" helper if a third state ever joins
const MATCH_CRITERIA_VISITED_KEY = "swivv-match-criteria:visited";

export function markMatchCriteriaVisited() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(MATCH_CRITERIA_VISITED_KEY, "1");
  } catch {}
}

export function hasVisitedMatchCriteria(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(MATCH_CRITERIA_VISITED_KEY) === "1";
  } catch {
    return false;
  }
}

export async function pushMatchCriteria(form: Record<string, string>) {
  if (typeof localStorage === "undefined") return;
  const at = Date.now();
  try {
    localStorage.setItem(MATCH_CRITERIA_AT_KEY, String(at));
  } catch {}
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return;
  const { data: row } = await (supabase as any)
    .from("swivv_profiles")
    .select("data")
    .eq("user_id", uid)
    .maybeSingle();
  await (supabase as any)
    .from("swivv_profiles")
    .upsert({ user_id: uid, data: { ...(row?.data ?? {}), matchCriteria: { form, savedAt: at } } });
}

/** Returns server criteria if strictly newer than this browser's, else null. Uploads local first-saves that predate sync. */
export async function pullMatchCriteria(): Promise<Record<string, string> | null> {
  if (typeof localStorage === "undefined") return null;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return null;
  const { data: row } = await (supabase as any)
    .from("swivv_profiles")
    .select("data")
    .eq("user_id", uid)
    .maybeSingle();
  const server = (row?.data as { matchCriteria?: { form: Record<string, string>; savedAt: number } } | null)?.matchCriteria;
  const localRaw = (() => {
    try {
      return localStorage.getItem(MATCH_CRITERIA_KEY);
    } catch {
      return null;
    }
  })();
  const atRaw = (() => {
    try {
      return localStorage.getItem(MATCH_CRITERIA_AT_KEY);
    } catch {
      return null;
    }
  })();
  // ponytail: legacy saves have no stamp — treat this browser's copy as now and upload it
  if (localRaw && atRaw == null) {
    try {
      await pushMatchCriteria(JSON.parse(localRaw) as Record<string, string>);
    } catch {}
    return null;
  }
  if (server?.form) {
    const localAt = Number(atRaw ?? 0) || 0;
    if (server.savedAt > localAt || !localRaw) {
      try {
        localStorage.setItem(MATCH_CRITERIA_KEY, JSON.stringify(server.form));
        localStorage.setItem(MATCH_CRITERIA_AT_KEY, String(server.savedAt));
      } catch {}
      return server.form;
    }
    return null;
  }
  // ponytail: first-login upload — local saves made before sync existed have no server copy yet
  if (localRaw) {
    try {
      await pushMatchCriteria(JSON.parse(localRaw) as Record<string, string>);
    } catch {}
  }
  return null;
}
// ponytail: local-only counters, no PII — server-side view analytics if popularity ever needs to be global
export function getProfileViews(): Record<string, number> {
  if (typeof localStorage === "undefined") return {};
  return read<Record<string, number>>(VIEWS_KEY, {});
}

export function bumpProfileView(id: string) {
  if (typeof localStorage === "undefined" || !id) return;
  const v = read<Record<string, number>>(VIEWS_KEY, {});
  write(VIEWS_KEY, { ...v, [id]: (v[id] ?? 0) + 1 });
  // ponytail: one server row per viewer→viewed per session (caps write volume; drop the guard if per-view history ever matters) — seeds skipped, honest counts only
  if (!isUuid(id)) return;
  const k = `pv:${id}`;
  try {
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {}
  void (async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid || !isUuid(uid)) return;
    const { error } = await (supabase as any).from("swivv_profile_views").insert({ viewer_id: uid, viewed_id: id });
    if (error) console.warn("[swivv] view mirror skipped", error.message ?? error);
  })();
}

export function useProfileViews(): Record<string, number> {
  useSyncExternalStore(subscribe, getProfileViews, () => ({}));
  return getProfileViews();
}

export function useRecusCount(): number {
  useSyncExternalStore(subscribe, getRecusCount, () => 0);
  return getRecusCount();
}

export function sendChat(id: string, text: string) {
  // ponytail: no fake replies or greetings — only real senders write "them" rows (server realtime); demo liveliness if empty inboxes ever need staging
  saveMessage(id, {
    id: `${Date.now()}`,
    from: "me",
    text,
    at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ts: Date.now(),
  });
}

// ponytail: localStorage stays the read cache (sync render path) with server as source of truth —
// full async chat API if offline-first/pending states ever matter
function saveMessage(peerId: string, msg: ChatMessage) {
  if (typeof localStorage === "undefined") return;
  const chats = read<Record<string, ChatMessage[]>>(CHATS_KEY, {});
  const list = chats[peerId] ?? [];
  if (!list.some((m) => m.id === msg.id)) list.push(msg);
  chats[peerId] = list;
  write(CHATS_KEY, chats);
  void pushMessage(peerId, msg);
}

async function pushMessage(peerId: string, msg: ChatMessage) {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return; // logged out: local only, uploaded on next login via pullAndPush
  // ponytail: warn (don't throw — offline-first) so the console shows which half failed; recipient shape also enforced by the "deliver to peer" policy
  await (supabase as any).from("swivv_chats").upsert(
    { user_id: uid, peer_id: peerId, msg_id: msg.id, sender: msg.from, body: msg.text, audio_url: msg.audio ?? null, duration_s: msg.dur ?? null, image_url: msg.image ?? null },
    { onConflict: "user_id,msg_id" },
  ).then((r: { error: unknown }) => { if (r.error) throw r.error; }).catch((e: unknown) => console.warn("[swivv] own chat copy failed", e));
  // ponytail: recipient copies use plain INSERT (upsert would demand SELECT on their row, which must stay private) — messages are immutable so no-update is correct
  if (!peerId.startsWith("u:")) return;
  const toUid = peerId.slice(2);
  if (!toUid || toUid === uid) return;
  const snap = await senderSnapshot(uid);
  await (supabase as any).from("swivv_chats").insert(
    { user_id: toUid, peer_id: `u:${uid}`, msg_id: msg.id, sender: msg.from === "me" ? "them" : "me", body: msg.text, audio_url: msg.audio ?? null, duration_s: msg.dur ?? null, image_url: msg.image ?? null, peer_name: snap.name, peer_photo: snap.photo },
  ).then((r: { error: unknown }) => { if (r.error) throw r.error; }).catch((e: unknown) => console.warn("[swivv] recipient chat copy failed", e));
}

/** Upload a voice blob, returns its public URL. */
export async function uploadVoice(peerId: string, msgId: string, blob: Blob): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return null;
  const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
  const path = `${uid}/${peerId}/${msgId}.${ext}`;
  const { error } = await supabase.storage.from("swivv-voice").upload(path, blob, { upsert: true });
  if (error) return null;
  return supabase.storage.from("swivv-voice").getPublicUrl(path).data.publicUrl;
}

type ChatRow = { peer_id: string; msg_id: string; sender: "me" | "them"; body: string; audio_url: string | null; duration_s: number | null; image_url: string | null; peer_name: string; peer_photo: string; created_at: string };

function rowToMessage(r: ChatRow): ChatMessage {
  // ponytail: incoming copies carry the sender snapshot — feeds the peer directory so real threads render with name + photo
  if (r.sender === "them" && r.peer_name) rememberPeer({ id: r.peer_id, name: r.peer_name, photo: r.peer_photo });
  return {
    id: r.msg_id,
    from: r.sender,
    text: r.body,
    at: new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ts: new Date(r.created_at).getTime(),
    ...(r.audio_url ? { audio: r.audio_url, dur: r.duration_s ?? undefined } : {}),
    ...(r.image_url ? { image: r.image_url } : {}),
    ...(r.sender === "them" && r.peer_name ? { peerName: r.peer_name, peerPhoto: r.peer_photo } : {}),
  };
}

// ponytail: module-cached sender snapshot for recipient copies — refetch on account switch, never on every message
let snapUid = "";
let snapName = "";
let snapPhoto = "";

async function senderSnapshot(uid: string): Promise<{ name: string; photo: string }> {
  if (uid === snapUid && (snapName || snapPhoto)) return { name: snapName, photo: snapPhoto };
  snapUid = uid;
  snapName = "";
  snapPhoto = "";
  try {
    const { data: row } = await (supabase as any).from("swivv_profiles").select("data").eq("user_id", uid).maybeSingle();
    const d = (row?.data ?? {}) as { name?: string; photos?: string[] };
    if (typeof d.name === "string") snapName = d.name;
    if (Array.isArray(d.photos) && typeof d.photos[0] === "string") snapPhoto = d.photos[0];
  } catch {}
  if (!snapName) {
    try {
      const { data } = await supabase.auth.getSession();
      snapName = data.session?.user.email?.split("@")[0] ?? "";
    } catch {}
  }
  return { name: snapName, photo: snapPhoto };
}

/** Pull server chats into cache, then push local ones (first login uploads this browser's history). */
async function pullAndPush(uid: string) {
  const { data: rows } = await (supabase as any)
    .from("swivv_chats")
    .select("peer_id,msg_id,sender,body,audio_url,duration_s,image_url,peer_name,peer_photo,created_at")
    .eq("user_id", uid);
  if (rows) {
    const chats = read<Record<string, ChatMessage[]>>(CHATS_KEY, {});
    for (const r of rows as ChatRow[]) {
      const list = chats[r.peer_id] ?? [];
      if (!list.some((m) => m.id === r.msg_id)) list.push(rowToMessage(r));
      chats[r.peer_id] = list;
    }
    write(CHATS_KEY, chats);
  }
  const cache = read<Record<string, ChatMessage[]>>(CHATS_KEY, {});
  const all = Object.entries(cache).flatMap(([peerId, msgs]) =>
    // ponytail: '' not null (peer_name/photo are NOT NULL server-side) — undefined would 400 the whole bulk upsert and strand every message local-only
    msgs.map((m) => ({ user_id: uid, peer_id: peerId, msg_id: m.id, sender: m.from, body: m.text, audio_url: m.audio ?? null, duration_s: m.dur ?? null, image_url: m.image ?? null, peer_name: m.peerName ?? "", peer_photo: m.peerPhoto ?? "" })),
  );
  if (all.length > 0) {
    await (supabase as any).from("swivv_chats").upsert(all, { onConflict: "user_id,msg_id" });
  }
}

/** Record-then-send voice note. Returns an error message, or null on success. */
export async function sendVoice(peerId: string, blob: Blob, dur: number): Promise<string | null> {
  const msgId = `${Date.now()}-v`;
  const url = await uploadVoice(peerId, msgId, blob);
  if (!url) return "Envoi impossible. Réessaie.";
  saveMessage(peerId, {
    id: msgId,
    from: "me",
    text: "",
    at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ts: Date.now(),
    audio: url,
    dur,
  });
  return null;
}

/** Send an image (mutual matches only — caller gates). Returns an error message, or null on success. */
export async function sendImage(peerId: string, file: File): Promise<string | null> {
  // ponytail: same voice-note pipeline + bucket, images under images/ — dedicated bucket + client resize if 5 Mo ever blocks real photos
  if (file.size > 5_000_000) return "Image trop lourde (5 Mo max).";
  const msgId = `${Date.now()}-i`;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return "Connecte-toi pour envoyer une image.";
  const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : file.type.includes("gif") ? "gif" : "jpg";
  const path = `${uid}/${peerId}/images/${msgId}.${ext}`;
  const { error } = await supabase.storage.from("swivv-voice").upload(path, file, { upsert: true });
  if (error) return "Envoi impossible. Réessaie.";
  const url = supabase.storage.from("swivv-voice").getPublicUrl(path).data.publicUrl;
  saveMessage(peerId, {
    id: msgId,
    from: "me",
    text: "",
    at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ts: Date.now(),
    image: url,
  });
  return null;
}

/** Photo feedback (reactions/reports/downloads) keyed by message id. */
export type ChatFeedback = { msg_id: string; kind: "reaction" | "report" | "download"; detail: string; reactor: string };

export async function sendFeedback(f: Omit<ChatFeedback, "reactor"> & { reactor?: string }): Promise<void> {
  try {
    await (supabase as any).from("swivv_chat_feedback").insert({
      msg_id: f.msg_id,
      kind: f.kind,
      detail: f.detail,
      reactor: f.reactor ?? "",
    });
  } catch {}
}

export async function getFeedback(msgIds: string[]): Promise<ChatFeedback[]> {
  if (!msgIds.length) return [];
  try {
    const { data } = await (supabase as any)
      .from("swivv_chat_feedback")
      .select("msg_id,kind,detail,reactor")
      .in("msg_id", msgIds);
    return (data ?? []) as ChatFeedback[];
  } catch {
    return [];
  }
}

// ponytail: storage URLs are minted for localhost — swap to the page host so LAN phones load them too; absolute CDN URLs if this ever leaves dev proxying
export function mediaUrl(url: string | undefined): string | undefined {
  if (!url || typeof window === "undefined") return url;
  try {
    const u = new URL(url);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") u.hostname = window.location.hostname;
    return u.toString();
  } catch {
    return url;
  }
}

/** Manual resync for screens that need fresh data on mount. True when the server round-trip worked. */
// ponytail: explicit pull on top of boot sync — one failed boot left an empty inbox with zero signal; drop if boot proves reliable
export async function syncChatsNow(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return true;
    await pullAndPush(uid);
    return true;
  } catch (e) {
    console.warn("[swivv] chat pull failed", e);
    return false;
  }
}

/** Global chat sync: initial pull/push on login + live inserts. Mount once (see __root). */
export function startChatSync(): () => void {
  let channel: { unsubscribe: () => void } | null = null;
  const boot = async (uid: string) => {
    channel?.unsubscribe();
    // ponytail: warn like pushMessage — a swallowed pull leaves an empty inbox with zero signal
    await pullAndPush(uid).catch((e: unknown) => console.warn("[swivv] chat pull failed", e));
    await pullLikes(uid).catch((e: unknown) => console.warn("[swivv] likes pull failed", e));
    await pruneOldChats(uid).catch(() => {});
    channel = supabase
      .channel(`swivv-chats:${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "swivv_chats", filter: `user_id=eq.${uid}` },
        (payload) => {
          const r = payload.new as ChatRow;
          saveMessage(r.peer_id, rowToMessage(r));
        },
      )
      .subscribe() as unknown as { unsubscribe: () => void };
  };
  const { data } = supabase.auth.onAuthStateChange((_e, s) => {
    if (s?.user) void boot(s.user.id);
    else channel?.unsubscribe();
  });
  supabase.auth.getSession().then(({ data: d }) => {
    if (d.session?.user) void boot(d.session.user.id);
  });
  return () => {
    data.subscription.unsubscribe();
    channel?.unsubscribe();
  };
}

export function useSwivvStore() {
  useSyncExternalStore(subscribe, () => 0);
  return {
    likes: getLikes(),
    matches: getMatches(),
  };
}
