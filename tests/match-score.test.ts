import { describe, expect, test } from "bun:test";
import { displayPct, score, topMatches } from "../src/lib/match-score";

const p = {
  gender: "woman",
  age: 30,
  country: "France",
  city: "Paris",
  distanceKm: 10,
  compatibility: 77,
  interests: ["surf", "cuisine"],
} as any;

describe("score", () => {
  test("empty criteria scores 100", () => {
    expect(score(p, {})).toEqual({ pct: 100, hard: true });
  });
  test("hard gender mismatch zeroes", () => {
    expect(score(p, { gender: "Homme" })).toEqual({ pct: 0, hard: false });
  });
  test("soft country match scores 100", () => {
    expect(score(p, { country: "France" }).pct).toBe(100);
  });
  test("soft country mismatch floors at 1 but stays hard", () => {
    expect(score(p, { country: "Espagne" })).toEqual({ pct: 1, hard: true });
  });
  test("out-of-range age stays visible and non-zero", () => {
    const r = score(p, { ageMin: "18", ageMax: "25", city: "Paris" });
    expect(r.hard).toBe(false);
    expect(r.pct).toBeGreaterThan(0);
  });
});

describe("displayPct", () => {
  test("no soft criteria falls back to static compatibility", () => {
    expect(displayPct(p, {})).toBe(77);
    expect(displayPct(p, { gender: "Femme", ageMin: "18", ageMax: "99" })).toBe(77);
  });
  test("soft criteria uses the score", () => {
    expect(displayPct(p, { country: "France" })).toBe(100);
  });
});

describe("topMatches", () => {
  test("unset lines drop", () => {
    expect(topMatches(p, {})).toEqual(["Age: 30"]);
    expect(topMatches(p, { country: "France" })).toEqual(["Country: France", "Age: 30"]);
  });
});
