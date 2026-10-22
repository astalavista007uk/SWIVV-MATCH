import { describe, expect, test } from "bun:test";
import { burstRegs, pairVolume, repeatTargets } from "../src/lib/admin-fraud";

describe("burstRegs", () => {
  test("flags N+ signups inside the window, once per cluster", () => {
    const base = new Date("2026-10-12T10:00:00Z").getTime();
    const ats = [0, 10, 20, 30, 40].map((m) => new Date(base + m * 6e4).toISOString());
    ats.push(new Date(base + 5 * 36e5).toISOString());
    const out = burstRegs(ats, 5, 1);
    expect(out).toHaveLength(1);
    expect(out[0].detail).toMatch(/jamais une preuve/);
    expect(burstRegs(ats.slice(0, 4), 5, 1)).toHaveLength(0);
  });
});

describe("repeatTargets", () => {
  test("counts independent reporters, not reports", () => {
    const out = repeatTargets([
      { reported_user_id: "u", reporter_id: "a" },
      { reported_user_id: "u", reporter_id: "a" },
      { reported_user_id: "u", reporter_id: "b" },
      { reported_user_id: "u", reporter_id: "c" },
    ], 3);
    expect(out).toHaveLength(1);
    expect(out[0].ref).toBe("u");
  });
});

describe("pairVolume", () => {
  test("dedupes copies, flags heavy pairs", () => {
    const msgs = Array.from({ length: 4 }, (_, i) => ({ user_id: "a", peer_id: "b", msg_id: `m${i}` }));
    msgs.push({ user_id: "b", peer_id: "a", msg_id: "m0" }); // copy, same msg_id
    expect(pairVolume(msgs, 4)).toHaveLength(1);
    expect(pairVolume(msgs, 5)).toHaveLength(0);
  });
});
