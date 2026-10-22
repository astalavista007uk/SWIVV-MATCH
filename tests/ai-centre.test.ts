import { describe, expect, test } from "bun:test";
import { providerStatus, callModel, redactForModel } from "../src/lib/ai-provider";
import {
  classifyReports, failedNotify, incompleteProfiles, onboardingHelp,
  repeatMessages, spamBios, summarizeCase, urgentSafety,
} from "../src/lib/ai-rules";

describe("provider", () => {
  test("unconfigured, never simulates", async () => {
    expect(providerStatus().configured).toBe(false);
    expect(providerStatus().steps.length).toBeGreaterThan(0);
    await expect(callModel("x")).rejects.toThrow("IA non configurée");
  });
  test("redaction drops sensitive keys", () => {
    expect(redactForModel({ name: "A", email: "a@b.c", body: "secret", city: "Paris", age: 30 }))
      .toEqual({ name: "A", age: 30 });
  });
});

describe("rules", () => {
  test("classify escalates keyword + repeat accounts only", () => {
    const out = classifyReports(
      [
        { id: "1", category: "menace", description: "il menace", priority: "normal" },
        { id: "2", category: "spam", priority: "normal", reported_user_id: "u9" },
        { id: "3", category: "spam", priority: "normal", reported_user_id: "u1" },
      ],
      { u9: 3 },
    );
    expect(out.map((s) => s.ref).sort()).toEqual(["1", "2"]);
  });
  test("spamBios flags link bios", () => {
    expect(spamBios([{ user_id: "u", data: { bio: "voir www.x.com" } }])).toHaveLength(1);
    expect(spamBios([{ user_id: "u", data: { bio: "J'aime lire" } }])).toHaveLength(0);
  });
  test("repeatMessages groups identical bodies, multi-sender is critical", () => {
    const msgs = [
      { body: "Super promo, cliquez ici vite !", sender: "a", created_at: "2026-10-12T10:00:00Z" },
      { body: "Super promo, cliquez ici vite !", sender: "b", created_at: "2026-10-12T10:01:00Z" },
      { body: "Super promo, cliquez ici vite !", sender: "c", created_at: "2026-10-12T10:02:00Z" },
      { body: "ok", sender: "a", created_at: "2026-10-12T10:03:00Z" },
    ];
    const out = repeatMessages(msgs);
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe("critical");
  });
  test("urgentSafety keeps criticals and high-repeat, drops the rest", () => {
    const out = urgentSafety(
      [
        { id: "1", category: "x", priority: "critical", status: "new" },
        { id: "2", category: "x", priority: "high", status: "new", reported_user_id: "u" },
        { id: "3", category: "x", priority: "high", status: "resolved", reported_user_id: "u" },
      ],
      { u: 2 },
    );
    expect(out.map((s) => s.ref).sort()).toEqual(["1", "2"]);
  });
  test("summarizeCase is a labelled template", () => {
    const s = summarizeCase({ id: "abcdef01", status: "open", priority: "high", created_at: "2026-10-01T00:00:00Z" }, [{ body: "n" }], 2);
    expect(s).toContain("gabarit");
    expect(s).toContain("humain");
  });
  test("incomplete + onboarding lists", () => {
    const profs = [{ user_id: "u", data: { name: "A", joinedAt: "2026-10-11", photos: [] } }];
    expect(incompleteProfiles(profs as any).length).toBeGreaterThan(0);
    expect(onboardingHelp(profs as any, 7, 50, new Date("2026-10-12T12:00:00Z").getTime())).toHaveLength(1);
    expect(onboardingHelp(profs as any, 7, 50, new Date("2026-11-12T12:00:00Z").getTime())).toHaveLength(0);
  });
  test("failedNotify keeps failures only", () => {
    const out = failedNotify([
      { status: "failed", to: "a@b.c", created_at: "2026-10-12T10:00:00Z" },
      { status: "sent", created_at: "2026-10-12T10:00:00Z" },
    ]);
    expect(out).toHaveLength(1);
  });
});
