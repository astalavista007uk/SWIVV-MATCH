import { describe, expect, test } from "bun:test";
import { recommend } from "../src/lib/admin-engage";

const healthy = {
  completionRate: 90, photoRate: 95, bioRate: 90, regToCompleteH: 5,
  msgPerActive: 4, announceReadRate: 60, failMail: 0, failRuns: 0, scanned: 100,
};

describe("recommend", () => {
  test("healthy base yields only the structural prefs note", () => {
    const out = recommend(healthy);
    expect(out).toHaveLength(1);
    expect(out[0].title).toMatch(/notification/i);
  });
  test("weak signals each raise one recommendation with numbers", () => {
    const out = recommend({ ...healthy, completionRate: 40, bioRate: 20, photoRate: 50, regToCompleteH: 100, failMail: 2 });
    const titles = out.map((r) => r.title);
    expect(titles).toContain("Simplifier la complétion du profil");
    expect(titles).toContain("Aider à écrire la bio");
    expect(titles).toContain("Encourager les photos");
    expect(titles).toContain("Réduire la friction d'inscription");
    expect(titles).toContain("Corriger les échecs techniques");
    expect(out[0].why).toMatch(/40 %/);
  });
  test("nulls never fire", () => {
    const out = recommend({ ...healthy, completionRate: null, bioRate: null, photoRate: null, regToCompleteH: null });
    expect(out).toHaveLength(1);
  });
});
