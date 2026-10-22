// Pure dashboard math (queries live in admin.index).
// ponytail: client-side buckets over capped scans (20k) — server-side aggregation if the caps ever bind
export const SCAN_CAP = 20000;
// ponytail: the "configured support policy" — first staff reply due within 48h; make it a table when it needs per-priority SLAs
export const SUPPORT_SLA_H = 48;
export const VERIF_STALE_H = 72;

export function pctChange(cur: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round((100 * (cur - prev)) / prev);
}

export function fmtDelta(cur: number, prev: number): string {
  const d = pctChange(cur, prev);
  if (d == null) return "—";
  return `${d > 0 ? "+" : ""}${d} %`;
}

const parisDayFmt = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const parisLabelFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "numeric",
  month: "short",
});

export function parisDay(ms: number): string {
  return parisDayFmt.format(new Date(ms));
}

/** Last `days` Paris-calendar days, oldest first: [{ day: "12 oct.", n }]. */
export function bucketByDay(items: { created_at: string }[], days: number, nowMs = Date.now()): { day: string; n: number }[] {
  const counts = new Map<string, number>();
  for (const r of items) {
    const t = new Date(r.created_at).getTime();
    if (!Number.isFinite(t)) continue;
    const k = parisDay(t);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const out: { day: string; n: number }[] = [];
  const base = new Date(nowMs);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 864e5);
    const k = parisDay(d.getTime());
    out.push({ day: parisLabelFmt.format(d).replace(".", ""), n: counts.get(k) ?? 0 });
  }
  return out;
}

export type Ticket = { id: string; created_at: string };
export type TicketMsg = { ticket_id: string; created_at: string; is_staff: boolean };

export function firstResponse(tickets: Ticket[], msgs: TicketMsg[], slaH = SUPPORT_SLA_H, nowMs = Date.now()): {
  avgH: number | null;
  responded: number;
  overdue: number;
} {
  const firstStaff = new Map<string, number>();
  for (const m of msgs) {
    if (!m.is_staff) continue;
    const t = new Date(m.created_at).getTime();
    if (!Number.isFinite(t)) continue;
    const prev = firstStaff.get(m.ticket_id);
    if (prev == null || t < prev) firstStaff.set(m.ticket_id, t);
  }
  let sum = 0;
  let responded = 0;
  let overdue = 0;
  for (const t of tickets) {
    const created = new Date(t.created_at).getTime();
    if (!Number.isFinite(created)) continue;
    const reply = firstStaff.get(t.id);
    if (reply != null && reply >= created) {
      sum += (reply - created) / 36e5;
      responded++;
    } else if ((nowMs - created) / 36e5 > slaH) {
      overdue++;
    }
  }
  return { avgH: responded ? Math.round((10 * sum) / responded) / 10 : null, responded, overdue };
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Minimal CSV for aggregated exports (quotes + escaping, no dependency). */
export function toCsv(header: string[], rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))].join("\n");
}
