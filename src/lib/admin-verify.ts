// Verification display logic (queries live in admin.verification).
// ponytail: display states derived from status + assignment — no new status column until a provider needs one
export const STATUS_FR: Record<string, string> = {
  pending: "En attente",
  approved: "Vérifiée",
  rejected: "Refusée",
  expired: "Expirée",
};

/** Pending + assigned reads as En cours; a decision reason is mandatory for approve/reject. */
export function displayStatus(r: { status: string; assigned_to?: string | null }): string {
  if (r.status === "pending" && r.assigned_to) return "En cours";
  return STATUS_FR[r.status] ?? r.status;
}

export function needsReason(status: "approved" | "rejected", reason: string): boolean {
  void status;
  return reason.trim().length > 0;
}
