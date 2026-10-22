// Live activity feed logic (polling + one realtime channel live in admin.live).
// ponytail: metadata-only rows (no bodies, no locations, no tokens) — bounded buffer (100) over
// per-table "latest N" polls; a server fan-out table if sources ever exceed ~12
export type FeedRow = {
  key: string;
  type: string;
  label: string;
  at: string;
  actorId?: string | null;
  targetId?: string | null;
  targetKind?: string | null;
  severity: "info" | "warning" | "critical";
};

const CRIT = new Set(["report", "restrict", "ai-fail"]);
const WARN = new Set(["verify", "ticket", "case", "block", "match"]);

export function severityFor(type: string, extra?: string): FeedRow["severity"] {
  if (type === "report" && extra === "critical") return "critical";
  if (CRIT.has(type)) return "critical";
  if (WARN.has(type)) return "warning";
  return "info";
}

/** Merge source rows into the buffer: dedupe by key, newest first, cap 100. */
export function mergeFeed(buffer: FeedRow[], incoming: FeedRow[], cap = 100): FeedRow[] {
  const seen = new Set(buffer.map((r) => r.key));
  const fresh = incoming.filter((r) => !seen.has(r.key));
  return [...buffer, ...fresh]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, cap);
}

/** Login/auth failures are NOT tracked (Supabase Auth dashboard only) — listed here so the UI states it honestly. */
export const UNSUPPORTED = ["login", "auth-failure", "sessions"];
