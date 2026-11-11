// Age assurance helpers — pure, shared by the signup UI and the tests.
// The server (supabase/migrations/20261104000000_swivv_age_assurance.sql) recomputes the
// same thing from the stored birthdate; this module is never the authority.

export const MIN_AGE = 18;
// ponytail: one constant stamped on each declaration — bump it when the terms change, no versioning table
export const TERMS_VERSION = "2026-11";

export const AGE_STATUSES = [
  "SELF_DECLARED",
  "VERIFICATION_PENDING",
  "AGE_VERIFIED",
  "UNDER_18",
  "VERIFICATION_FAILED",
  "MANUAL_REVIEW",
] as const;
export type AgeStatus = (typeof AGE_STATUSES)[number];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parts(birthdate: string): [number, number, number] | null {
  const m = ISO_DATE.exec(birthdate.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  // round-trip catches 2026-02-30, 2025-13-01, ...
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return [y, mo, d];
}

/** Completed years on `today`; null for malformed, impossible or future dates. */
export function ageOn(birthdate: string, today: Date = new Date()): number | null {
  const p = parts(birthdate);
  if (!p) return null;
  const [y, mo, d] = p;
  if (Date.UTC(y, mo - 1, d) > Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) return null;
  let age = today.getUTCFullYear() - y;
  const beforeBirthday = today.getUTCMonth() < mo - 1 || (today.getUTCMonth() === mo - 1 && today.getUTCDate() < d);
  return beforeBirthday ? age - 1 : age;
}

/** Same contract as ageOn but as NaN — kept for the many existing call sites. */
export function ageFromBirthdate(birthdate: string, today: Date = new Date()): number {
  return ageOn(birthdate, today) ?? NaN;
}

export type AgeCheck =
  | { ok: true; age: number }
  | { ok: false; reason: "invalid" | "future" | "underage" };

export function ageCheck(birthdate: string, today: Date = new Date()): AgeCheck {
  if (!parts(birthdate)) return { ok: false, reason: "invalid" };
  const age = ageOn(birthdate, today);
  if (age === null) return { ok: false, reason: "future" };
  if (age < MIN_AGE) return { ok: false, reason: "underage" };
  return { ok: true, age };
}
