// Pure support-desk logic (queries live in admin.support).
// ponytail: single SLA source (admin-metrics) — support, alerts and dashboard share it
import { SUPPORT_SLA_H } from "./admin-metrics";
export const SLA_H = SUPPORT_SLA_H;

export type LastMsg = { at: string; staff: boolean } | null;

/** awaiting = last word is the member's; overdue = never answered by staff past SLA. */
export function ticketFlags(last: LastMsg, createdAt: string, nowMs = Date.now()): {
  awaiting: boolean;
  overdue: boolean;
  deadline: number | null;
} {
  const created = new Date(createdAt).getTime();
  const deadline = Number.isFinite(created) ? created + SLA_H * 36e5 : null;
  if (!last) return { awaiting: true, overdue: deadline != null && nowMs > deadline, deadline };
  return {
    awaiting: !last.staff,
    overdue: !last.staff && deadline != null && nowMs > deadline,
    deadline,
  };
}

export function deadlineLabel(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return "—";
  return new Date(created + SLA_H * 36e5).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
