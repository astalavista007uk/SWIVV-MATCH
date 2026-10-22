// Pure report-queue logic (queries live in admin.reports).
// ponytail: deterministic triage (critical → repeat accounts → newest), no AI — add model scores when a provider is wired
export type ReportRow = {
  id: string;
  created_at: string;
  reporter_id?: string | null;
  reported_user_id?: string | null;
  category: string;
  priority: string;
  status: string;
  assigned_to?: string | null;
  [k: string]: any;
};

export function timeSince(iso: string, nowMs = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const m = Math.max(0, Math.floor((nowMs - t) / 6e4));
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

const PRI = { critical: 0, high: 1, normal: 2, low: 3 } as Record<string, number>;

/** Critical first, then repeatedly-reported accounts, then newest. */
export function sortQueue(rows: ReportRow[], repeats: Record<string, number>): ReportRow[] {
  return [...rows].sort((a, b) => {
    const p = (PRI[a.priority] ?? 9) - (PRI[b.priority] ?? 9);
    if (p) return p;
    const r = (repeats[b.reported_user_id ?? ""] ?? 0) - (repeats[a.reported_user_id ?? ""] ?? 0);
    if (r) return r;
    return +new Date(b.created_at) - +new Date(a.created_at);
  });
}

export function repeatCounts(rows: ReportRow[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const r of rows) if (r.reported_user_id) c[r.reported_user_id] = (c[r.reported_user_id] ?? 0) + 1;
  return c;
}
