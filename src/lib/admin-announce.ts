// Campaign helpers (queries live in admin.announcements).
// ponytail: 7-day per-user suppression as the frequency cap (no server opt-out store exists) —
// replace with preference checks when a server-side consent table lands
export const SUPPRESS_DAYS = 7;

export function applySuppression(candidateIds: string[], recentIds: string[]): { send: string[]; skipped: string[] } {
  const recent = new Set(recentIds);
  const send: string[] = [];
  const skipped: string[] = [];
  for (const id of candidateIds) (recent.has(id) ? skipped : send).push(id);
  return { send, skipped };
}

export type CampaignState = "draft" | "scheduled" | "sending_due" | "sent" | "cancelled";

export function campaignState(r: { sent_at: string | null; cancelled_at?: string | null; scheduled_at?: string | null }, nowMs = Date.now()): CampaignState {
  if (r.sent_at) return "sent";
  if (r.cancelled_at) return "cancelled";
  if (r.scheduled_at) return new Date(r.scheduled_at).getTime() <= nowMs ? "sending_due" : "scheduled";
  return "draft";
}
