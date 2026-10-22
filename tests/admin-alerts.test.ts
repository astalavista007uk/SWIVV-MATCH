import { describe, expect, test } from "bun:test";
import { alertLink, collectAlerts } from "../src/lib/admin-alerts";

const now = new Date("2026-10-12T12:00:00Z").getTime();
const old = "2026-10-08T12:00:00Z";
const fresh = "2026-10-12T11:00:00Z";

describe("collectAlerts", () => {
  test("fires per-entity with stable dedupe keys, skips healthy rows", () => {
    const out = collectAlerts({
      reports: [
        { id: "r1", category: "menace", priority: "critical", status: "new" },
        { id: "r2", category: "spam", priority: "normal", status: "new" },
        { id: "r3", category: "x", priority: "critical", status: "resolved" },
      ],
      cases: [{ id: "c1", priority: "high", status: "open" }],
      fraudCases: [{ id: "f1", kind: "burst-regs", status: "open", subject_ref: "u1" }],
      tickets: [
        { id: "t1", subject: "Aide", created_at: old, staffReplied: false },
        { id: "t2", subject: "Ok", created_at: old, staffReplied: true },
      ],
      verifs: [{ id: "v1", kind: "profile", status: "pending", created_at: old }],
      aiFailed: [{ rule_key: "spam-bios", created_at: fresh }],
      mailFailed: [{ to: "a@b.c", created_at: fresh }],
      nowMs: now,
    });
    expect(out.map((s) => s.dedupe).sort()).toEqual(
      ["ai:spam-bios:" + fresh, "case:c1", "fraud:f1", "mail:a@b.c:" + fresh, "report:r1", "ticket:t1", "verif:v1"].sort(),
    );
    expect(out.find((s) => s.dedupe === "report:r1")?.severity).toBe("critical");
    expect(new Set(out.map((s) => s.dedupe)).size).toBe(out.length);
  });
});

describe("alertLink", () => {
  test("every source resolves to a route", () => {
    for (const s of ["reports", "moderation", "fraud", "support", "verification", "ai", "notify"])
      expect(alertLink({ source: s })?.to).toMatch(/^\/admin\//);
    expect(alertLink({ refKind: "user", refId: "u1" })?.to).toBe("/admin/users/u1");
    expect(alertLink({})).toBe(null);
  });
});
