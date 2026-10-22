// Audit display logic (queries live in admin.audit).
// ponytail: severity derived from the action name for pre-migration rows (columns default info/success) —
// writers pass explicit opts going forward; no UPDATE/DELETE exists anywhere (append-only by RLS)

export type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  target_kind: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  outcome?: string | null;
  severity?: string | null;
  reason?: string | null;
  correlation?: string | null;
  created_at: string;
};

/** No AI workers or cron jobs exist — every row is a human admin or a DB trigger. */
export function actorType(r: Pick<AuditRow, "actor_id" | "action">): string {
  if (r.actor_id) return "administrateur";
  if (r.action.startsWith("user_status.") || r.action.startsWith("verification.")) return "système (trigger)";
  return "système";
}

const CRITICAL_RE = /banned|deleted|user\.suspended|report\.escalate|policy\.update|ticket\.escalate/;
const WARNING_RE = /suspended|warn|reject|dismiss|restrict|photo_remove|mod\.remove|verify\.rejected/;

export function rowSeverity(r: Pick<AuditRow, "action" | "severity">): string {
  if (r.severity && r.severity !== "info") return r.severity;
  if (CRITICAL_RE.test(r.action)) return "critical";
  if (WARNING_RE.test(r.action)) return "warning";
  return r.severity ?? "info";
}

/** Deep link per target kind; null when the target has no page. */
export function targetLink(kind: string | null, id: string | null): { to: string; search?: Record<string, string> } | null {
  if (!kind || !id) return null;
  if (kind === "user") return { to: "/admin/users/$userId", search: undefined };
  if (kind === "report") return { to: "/admin/reports", search: { status: "all" } };
  if (kind === "case") return { to: "/admin/moderation", search: { status: "all" } };
  if (kind === "ticket") return { to: "/admin/support", search: { status: "all" } };
  if (kind === "verification") return { to: "/admin/verification", search: { status: "all" } };
  if (kind === "alert" || kind === "alerts") return { to: "/admin/alerts" };
  if (kind === "announcement") return { to: "/admin/announcements" };
  if (kind === "policy") return { to: "/admin/moderation" };
  return null;
}
