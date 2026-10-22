// Health status evaluation (probes live in admin.health).
// ponytail: fixed thresholds (slow > 2s, fail = unavailable) — a thresholds table when alerting needs tuning;
// never green without data: unmeasurable services read "non surveillé", never "sain"
export const SLOW_MS = 2000;

export type Probe = { ok: boolean | null; ms: number | null };
export type Status = "healthy" | "degraded" | "unavailable" | "unmonitored";

export function evaluate(probe: Probe): Status {
  if (probe.ok == null) return "unmonitored";
  if (!probe.ok) return "unavailable";
  if (probe.ms != null && probe.ms > SLOW_MS) return "degraded";
  return "healthy";
}

export const STATUS_FR: Record<Status, string> = {
  healthy: "Sain",
  degraded: "Dégradé",
  unavailable: "Indisponible",
  unmonitored: "Non surveillé",
};
