// ponytail: pure reaction rules only (no supabase/react) — same zero-dep pattern as notify.logic.test.ts
import { describe, expect, test } from "bun:test";
import { breakdown, creationsByDay, isReactionId, modeReaction, REACTIONS, resolveToggle, topPhoto, type ActiveReaction } from "../src/lib/swivv-reactions";

describe("reaction ids", () => {
  test("exactly the six permitted types", () => {
    expect(REACTIONS.map((r) => r.id)).toEqual(["craquant", "jadore", "charmant", "canon", "clin-doeil", "original"]);
    for (const r of REACTIONS) expect(isReactionId(r.id)).toBe(true);
  });
  test("rejects emoji, labels, unknowns", () => {
    for (const v of ["😍", "J'adore", "like", "", null, undefined, 42]) expect(isReactionId(v)).toBe(false);
  });
});

describe("toggle state machine", () => {
  test("none -> create", () => {
    expect(resolveToggle(null, "canon")).toEqual({ next: "canon", event: "created" });
  });
  test("different -> change", () => {
    expect(resolveToggle("canon", "jadore")).toEqual({ next: "jadore", event: "changed" });
  });
  test("same -> remove (like-toggle twin)", () => {
    expect(resolveToggle("canon", "canon")).toEqual({ next: null, event: "removed" });
  });
  test("invalid pick keeps state, no event", () => {
    expect(resolveToggle("canon", "like" as any)).toEqual({ next: "canon", event: null });
  });
});

const rows = (rs: [string, string, string][]): ActiveReaction[] =>
  rs.map(([photo, reaction, reactor], i) => ({ photo, reaction: reaction as any, reactor, at: 1000 + i, updated: 1000 + i }));

describe("breakdown", () => {
  test("counts + zero-safe percentages", () => {
    const b = breakdown(rows([["p1", "canon", "a"], ["p1", "canon", "b"], ["p2", "jadore", "c"]]));
    expect(b.find((x) => x.id === "canon")).toMatchObject({ n: 2, pct: 67 });
    expect(b.find((x) => x.id === "jadore")).toMatchObject({ n: 1, pct: 33 });
    expect(b.find((x) => x.id === "original")).toMatchObject({ n: 0, pct: 0 });
  });
  test("empty stays 0/0, never NaN", () => {
    for (const b of breakdown([])) {
      expect(b.n).toBe(0);
      expect(b.pct).toBe(0);
    }
  });
});

describe("history", () => {
  const DAY = 864e5;
  const now = 50 * DAY;
  test("creations bucketed per day, zero days stay 0", () => {
    const evs = [
      { photo: "p", event: "created" as const, reaction: "canon" as const, reactor: "a", at: now - 1 * DAY },
      { photo: "p", event: "created" as const, reaction: "canon" as const, reactor: "b", at: now - 1 * DAY - 1000 },
      { photo: "p", event: "changed" as const, reaction: "jadore" as const, reactor: "a", at: now - 2 * DAY },
      { photo: "p", event: "removed" as const, reaction: null, reactor: "b", at: now - 3 * DAY },
    ];
    const out = creationsByDay(evs, 3, now);
    expect(out).toEqual([0, 2, 0]); // oldest -> newest; only creations count, never fabricated
  });
});

describe("top photo", () => {
  test("null when empty", () => {
    expect(topPhoto([], {})).toBeNull();
    expect(modeReaction([])).toBeNull();
  });
  test("ties break by earliest first reaction, deterministically", () => {
    const r = rows([["p1", "canon", "a"], ["p2", "canon", "b"]]);
    expect(topPhoto(r, { p1: 2000, p2: 1000 })).toBe("p2");
    expect(topPhoto(r, { p1: 1000, p2: 2000 })).toBe("p1");
  });
  test("mode follows REACTIONS order on ties", () => {
    const r = rows([["p", "canon", "a"], ["p", "jadore", "b"]]);
    expect(modeReaction(r)).toBe("jadore"); // jadore precedes canon in REACTIONS
  });
});
