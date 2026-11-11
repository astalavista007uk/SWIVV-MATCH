// Verification display logic (queries live in admin.verification).
// ponytail: display states derived from status + assignment — no new status column until a provider needs one
export const STATUS_FR: Record<string, string> = {
  pending: "En attente",
  approved: "Vérifiée",
  rejected: "Refusée",
  expired: "Expirée",
};

export const KIND_FR: Record<string, string> = {
  email: "E-mail",
  phone: "Téléphone",
  profile: "Photos",
  identity: "Pièce d'identité",
};

export function displayKind(kind: string): string {
  return KIND_FR[kind] ?? kind;
}

/** Pending + assigned reads as En cours; a decision reason is mandatory for approve/reject. */
export function displayStatus(r: { status: string; assigned_to?: string | null }): string {
  if (r.status === "pending" && r.assigned_to) return "En cours";
  return STATUS_FR[r.status] ?? r.status;
}

export function needsReason(status: "approved" | "rejected", reason: string): boolean {
  void status;
  return reason.trim().length > 0;
}

/**
 * Automatic ID pre-check: the distance between the document portrait and the closest
 * profile photo (same 0.6 face-api threshold as the photo badge).
 * ponytail: portrait similarity only — no document forensics, expiry or OCR; upgrade to a
 * hosted IDV provider (Stripe Identity) when a legal-grade identity proof is required.
 */
export const ID_MATCH_MAX = 0.6;

export type IdAutoDecision = {
  status: "approved" | "pending";
  score: number;
  note: string;
};

export function idAutoDecision(distance: number | null): IdAutoDecision {
  if (distance == null || !Number.isFinite(distance)) {
    return { status: "pending", score: 0, note: "Aucun visage détecté sur la pièce" };
  }
  const score = Math.max(0, Math.min(100, Math.round((1 - distance / ID_MATCH_MAX) * 100)));
  if (distance < ID_MATCH_MAX) {
    return { status: "approved", score, note: "Visage identique à la photo de profil" };
  }
  return { status: "pending", score, note: "Visage différent des photos de profil" };
}
