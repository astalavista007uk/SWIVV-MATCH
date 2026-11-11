import { describe, expect, test } from "bun:test";
import { AGE_STATUSES, MIN_AGE, ageCheck, ageFromBirthdate, ageOn } from "@/lib/swivv-age";
import { PROFILE_REPORT_REASONS } from "@/lib/swivv-moderation";

const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("ageOn", () => {
  test("counts completed years", () => {
    expect(ageOn("2000-06-15", at("2026-11-06"))).toBe(26);
  });

  test("birthday today still counts", () => {
    expect(ageOn("2008-11-06", at("2026-11-06"))).toBe(18);
  });

  test("the day before the 18th birthday is still 17", () => {
    expect(ageOn("2008-11-07", at("2026-11-06"))).toBe(17);
  });

  test("handles a 29 February birthday", () => {
    expect(ageOn("2008-02-29", at("2026-02-28"))).toBe(17);
    expect(ageOn("2008-02-29", at("2026-03-01"))).toBe(18);
  });

  test("rejects impossible, malformed and future dates", () => {
    expect(ageOn("2026-02-30", at("2026-11-06"))).toBeNull();
    expect(ageOn("2026-13-01", at("2026-11-06"))).toBeNull();
    expect(ageOn("06/11/2000", at("2026-11-06"))).toBeNull();
    expect(ageOn("", at("2026-11-06"))).toBeNull();
    expect(ageOn("2027-01-01", at("2026-11-06"))).toBeNull();
  });

  test("ageFromBirthdate keeps the NaN contract", () => {
    expect(ageFromBirthdate("2000-06-15", at("2026-11-06"))).toBe(26);
    expect(Number.isNaN(ageFromBirthdate("nope", at("2026-11-06")))).toBe(true);
  });
});

describe("ageCheck", () => {
  test("accepts an adult", () => {
    expect(ageCheck("1990-01-01", at("2026-11-06"))).toEqual({ ok: true, age: 36 });
  });

  test("flags underage", () => {
    expect(ageCheck("2010-01-01", at("2026-11-06"))).toEqual({ ok: false, reason: "underage" });
  });

  test("flags future and invalid separately", () => {
    expect(ageCheck("2027-01-01", at("2026-11-06"))).toEqual({ ok: false, reason: "future" });
    expect(ageCheck("2026-02-30", at("2026-11-06"))).toEqual({ ok: false, reason: "invalid" });
  });

  test("exactly 18 on the day is accepted", () => {
    expect(ageCheck("2008-11-06", at("2026-11-06"))).toEqual({ ok: true, age: 18 });
  });
});

describe("age assurance surface", () => {
  test("every required status exists", () => {
    for (const s of ["SELF_DECLARED", "VERIFICATION_PENDING", "AGE_VERIFIED", "UNDER_18", "VERIFICATION_FAILED", "MANUAL_REVIEW"]) {
      expect(AGE_STATUSES).toContain(s as never);
    }
  });

  test("minimum age is 18", () => {
    expect(MIN_AGE).toBe(18);
  });

  test("underage is a reportable profile reason", () => {
    expect(PROFILE_REPORT_REASONS).toContain("Utilisateur suspecté d'être mineur");
  });
});
