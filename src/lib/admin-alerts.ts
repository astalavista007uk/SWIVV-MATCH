// Multi-source alert collectors feeding the Centre d'alertes.
// ponytail: stable dedupe_key per entity (partial unique index blocks live dupes) —
// thresholds inline; a thresholds table when tuning needs it (fraud/mod tables already have their own)
import { SUPPORT_SLA_H, VERIF_STALE_H } from "./admin-metrics";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertSpec = {
  dedupe: string;
  source: string;
  category: string;
  severity: AlertSeverity;
  title: string;
  detail: Record<string, unknown>;
  refKind?: string | null;
  refId?: string | null;
};

export type AlertInput = {
  reports: { id: string; category: string; priority: string; status: string; reported_user_id?: string | null; created_at: string }[];
  cases: { id: string; priority: string; status: string; subject_user_id?: string | null }[];
  fraudCases: { id: string; kind: string; status: string; subject_ref?: string | null }[];
  tickets: { id: string; subject: string; created_at: string; staffReplied: boolean }[];
  verifs: { id: string; kind: string; status: string; created_at: string }[];
  aiFailed: { rule_key: string; error?: string | null; created_at: string }[];
  mailFailed: { to?: string; created_at: string }[];
  nowMs?: number;
};

const H = 36e5;

/** Urgent user-safety: critical open reports, one alert per report. */
export function collectAlerts(d: AlertInput): AlertSpec[] {
  const now = d.nowMs ?? Date.now();
  const out: AlertSpec[] = [];
  for (const r of d.reports) {
    if (!["new", "investigating", "waiting"].includes(r.status)) continue;
    if (r.priority !== "critical") continue;
    out.push({
      dedupe: `report:${r.id}`, source: "reports", category: r.category, severity: "critical",
      title: `Signalement critique : ${r.category}`,
      detail: { report_id: r.id }, refKind: "report", refId: r.reported_user_id ?? r.id,
    });
  }
  for (const c of d.cases) {
    if (!["open", "investigating", "waiting"].includes(c.status)) continue;
    if (c.priority !== "high" && c.priority !== "critical") continue;
    out.push({
      dedupe: `case:${c.id}`, source: "moderation", category: "cas prioritaire",
      severity: c.priority === "critical" ? "critical" : "warning",
      title: `Cas modération ${c.priority} en cours`,
      detail: { case_id: c.id }, refKind: "case", refId: c.subject_user_id ?? c.id,
    });
  }
  for (const f of d.fraudCases) {
    if (!["open", "investigating"].includes(f.status)) continue;
    out.push({
      dedupe: `fraud:${f.id}`, source: "fraud", category: f.kind, severity: "warning",
      title: `Cas fraude ouvert (${f.kind})`, detail: { fraud_id: f.id }, refKind: "user", refId: f.subject_ref,
    });
  }
  for (const t of d.tickets) {
    if (!t.staffReplied && now - new Date(t.created_at).getTime() > SUPPORT_SLA_H * H)
      out.push({
        dedupe: `ticket:${t.id}`, source: "support", category: "dépassement SLA", severity: "warning",
        title: `Ticket sans réponse 48 h+ : ${t.subject.slice(0, 60)}`,
        detail: { ticket_id: t.id }, refKind: "ticket", refId: t.id,
      });
  }
  for (const v of d.verifs) {
    if (v.status !== "pending") continue;
    if (now - new Date(v.created_at).getTime() <= VERIF_STALE_H * H) continue;
    out.push({
      dedupe: `verif:${v.id}`, source: "verification", category: v.kind, severity: "warning",
      title: `Vérification ${v.kind} en attente 72 h+`,
      detail: { verif_id: v.id }, refKind: "verification", refId: v.id,
    });
  }
  for (const a of d.aiFailed)
    out.push({
      dedupe: `ai:${a.rule_key}:${a.created_at}`, source: "ai", category: "échec automation", severity: "warning",
      title: `Automation en échec : ${a.rule_key}`, detail: { error: a.error ?? null }, refKind: "rule", refId: a.rule_key,
    });
  for (const m of d.mailFailed)
    out.push({
      dedupe: `mail:${m.to ?? "?"}:${m.created_at}`, source: "notify", category: "échec envoi", severity: "warning",
      title: `E-mail en échec${m.to ? ` (${m.to})` : ""}`, detail: {}, refKind: null, refId: null,
    });
  return out;
}

/** Source → investigation route (params carry the ref where the page supports it). */
export function alertLink(a: { source?: string | null; kind?: string | null; refKind?: string | null; refId?: string | null }): { to: string; label: string } | null {
  const src = a.source ?? "";
  if (src === "reports") return { to: "/admin/reports", label: "Signalements" };
  if (src === "moderation") return { to: "/admin/moderation", label: "Modération" };
  if (src === "fraud") return { to: "/admin/fraud", label: "Fraude" };
  if (src === "support") return { to: "/admin/support", label: "Support" };
  if (src === "verification") return { to: "/admin/verification", label: "Vérification" };
  if (src === "ai") return { to: "/admin/ai", label: "Centre IA" };
  if (src === "notify") return { to: "/admin/health", label: "Santé" };
  if (a.refKind === "user" && a.refId) return { to: `/admin/users/${a.refId}`, label: "Fiche membre" };
  return null;
}
