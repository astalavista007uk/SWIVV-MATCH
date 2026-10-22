import type { SwivvProfile } from "@/lib/swivv-data";
import { nextProfileStep, profileCompleteness } from "@/lib/swivv-profile-fields";

/**
 * SWIVV Progress calculations.
 *
 * Everything is derived from rows the member already produced (matches, messages,
 * profile visits, profile content) — no progress-event table, so no client can
 * forge a qualification and repeated renders can never award twice.
 *
 * ponytail: derived state means a badge can't remember "new" server-side —
 * a dedicated swivv_progress_events table only if cross-device unlock pushes are ever needed.
 */

export type ChatRow = { peer: string; sender: "me" | "them"; at: number };
export type MatchRow = { other: string; at: number };

const DAY_MS = 864e5;

/** Local calendar day as an integer ordinal — DST-safe because it never divides a timestamp by 24h. */
export function dayOrdinal(ts: number): number {
  const d = new Date(ts);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}

/** Local midnight of the timestamp's calendar day. */
export function dayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Start of a "last N calendar days" window (day N-1 ago, local midnight). */
export function windowStart(now: number, days: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d.getTime();
}

/** Ordinals of the last N calendar days, oldest first. */
export function lastDays(now: number, days: number): number[] {
  const today = dayOrdinal(now);
  return Array.from({ length: days }, (_, i) => today - (days - 1 - i));
}

/**
 * Days with genuine two-way activity → the timestamp of the earliest qualifying
 * event that day. Matches always qualify; a message qualifies only when I send it
 * in a conversation the other member has written in (never one-way blasts).
 */
export function qualifyingDays(chats: ChatRow[], matches: MatchRow[]): Map<number, number> {
  const peersWhoWrote = new Set(chats.filter((c) => c.sender === "them").map((c) => c.peer));
  const days = new Map<number, number>();
  const add = (at: number) => {
    if (!Number.isFinite(at) || at <= 0) return;
    const day = dayOrdinal(at);
    const prev = days.get(day);
    if (prev == null || at < prev) days.set(day, at);
  };
  for (const m of matches) add(m.at);
  for (const c of chats) if (c.sender === "me" && peersWhoWrote.has(c.peer)) add(c.at);
  return days;
}

export type Streak = { current: number; best: number; activeToday: boolean };

/**
 * Current streak counts back from today; an unopened today falls back to
 * yesterday so a member who last engaged yesterday hasn't "lost" anything.
 */
export function streak(days: Iterable<number> | Map<number, number>, now: number): Streak {
  const set = new Set<number>(days instanceof Map ? days.keys() : days);
  const today = dayOrdinal(now);
  let current = 0;
  for (let d = set.has(today) ? today : today - 1; set.has(d); d--) current++;
  let best = 0;
  let run = 0;
  let prev = -Infinity;
  for (const d of [...set].sort((a, b) => a - b)) {
    if (d > today) continue;
    run = d === prev + 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return { current, best, activeToday: set.has(today) };
}

/** Distinct conversations I replied to in the last 7 calendar days (a reply follows their message). */
export function weeklyReplies(chats: ChatRow[], now: number): number {
  const firstThem = new Map<string, number>();
  for (const c of chats) {
    if (c.sender !== "them") continue;
    firstThem.set(c.peer, Math.min(firstThem.get(c.peer) ?? Infinity, c.at));
  }
  const start = windowStart(now, 7);
  const peers = new Set<string>();
  for (const c of chats) {
    if (c.sender !== "me" || c.at < start) continue;
    const theirs = firstThem.get(c.peer);
    if (theirs != null && theirs < c.at) peers.add(c.peer);
  }
  return peers.size;
}

export type AchievementId = "ready" | "spark" | "starter" | "twoWay" | "connector" | "champion";

export type Achievement = {
  id: AchievementId;
  name: string;
  description: string;
  condition: string;
  unlocked: boolean;
  /** Earliest data timestamp that satisfied the condition, when one exists. */
  at: number | null;
  /** false = the underlying module doesn't exist yet (never faked as unlocked). */
  available: boolean;
};

const first = (list: number[]): number | null => (list.length ? Math.min(...list) : null);

export function achievements(input: {
  profile: SwivvProfile | null;
  chats: ChatRow[];
  matches: MatchRow[];
  now: number;
}): Achievement[] {
  const { profile, chats, matches, now } = input;
  const completion = profileCompleteness(profile);
  const days = qualifyingDays(chats, matches);
  const sortedDays = [...days.keys()].sort((a, b) => a - b);

  const firstMe = new Map<string, number>();
  const firstThem = new Map<string, number>();
  for (const c of chats) {
    const map = c.sender === "me" ? firstMe : firstThem;
    map.set(c.peer, Math.min(map.get(c.peer) ?? Infinity, c.at));
  }
  let twoWayAt: number | null = null;
  for (const [peer, theirs] of firstThem) {
    const mine = firstMe.get(peer);
    if (mine == null) continue;
    const at = Math.max(mine, theirs);
    if (twoWayAt == null || at < twoWayAt) twoWayAt = at;
  }

  return [
    {
      id: "ready",
      name: "Prêt à rencontrer",
      description: "Ton profil est complet : les autres membres voient qui tu es.",
      condition: "Compléter 100 % de ton profil",
      unlocked: completion >= 100,
      // ponytail: swivv_profiles.updated_at is row-creation time, not "reached 100%" — no honest date, so none shown
      at: null,
      available: true,
    },
    {
      id: "spark",
      name: "Première étincelle",
      description: "Un premier match réciproque, validé des deux côtés.",
      condition: "Recevoir ton premier match mutuel",
      unlocked: matches.length > 0,
      at: first(matches.map((m) => m.at).filter((at) => at > 0)),
      available: true,
    },
    {
      id: "starter",
      name: "Premier message",
      description: "Tu as ouvert la conversation : c'est souvent le pas le plus difficile.",
      condition: "Envoyer ton premier message",
      unlocked: firstMe.size > 0,
      at: first([...firstMe.values()]),
      available: true,
    },
    {
      id: "twoWay",
      name: "Échange à deux",
      description: "Une conversation nourrie par vos deux voix.",
      condition: "Avoir une conversation avec des messages des deux côtés",
      unlocked: twoWayAt != null,
      at: twoWayAt,
      available: true,
    },
    {
      id: "connector",
      name: "Présence régulière",
      description: "Cinq jours d'activité sincère, sans course au volume.",
      condition: "5 jours d'activité qualifiante",
      unlocked: sortedDays.length >= 5,
      at: sortedDays.length >= 5 ? (days.get(sortedDays[4]) ?? null) : null,
      available: true,
    },
    {
      id: "champion",
      name: "Ambassadeur bienveillant",
      description:
        "Le module de sensibilisation au respect et à la sécurité en ligne arrive bientôt.",
      condition: "Terminer le parcours respect et sécurité en ligne",
      unlocked: false,
      // ponytail: no safety tutorial exists in the app — stays locked rather than awarding a completion nobody did
      at: null,
      available: false,
    },
  ];
}

export type PeriodStats = {
  matches: number;
  started: number;
  twoWay: number;
  visits: number;
  activeDays: number;
};

export function periodStats(input: {
  chats: ChatRow[];
  matches: MatchRow[];
  visits: number[];
  now: number;
  days: number;
}): PeriodStats {
  const { chats, matches, visits, now, days } = input;
  const start = windowStart(now, days);
  const firstMe = new Map<string, number>();
  const firstThem = new Map<string, number>();
  for (const c of chats) {
    const map = c.sender === "me" ? firstMe : firstThem;
    map.set(c.peer, Math.min(map.get(c.peer) ?? Infinity, c.at));
  }
  let started = 0;
  for (const at of firstMe.values()) if (at >= start) started++;
  let twoWay = 0;
  for (const [peer, theirs] of firstThem) {
    const mine = firstMe.get(peer);
    if (mine != null && Math.max(mine, theirs) >= start) twoWay++;
  }
  return {
    matches: matches.filter((m) => m.at >= start).length,
    started,
    twoWay,
    visits: visits.filter((at) => at >= start).length,
    activeDays: [...qualifyingDays(chats, matches).keys()].filter(
      (d) => d >= dayOrdinal(start) && d <= dayOrdinal(now),
    ).length,
  };
}

export { nextProfileStep, profileCompleteness };
