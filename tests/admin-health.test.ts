import { describe, expect, test } from "bun:test";
import { evaluate } from "../src/lib/admin-health";

describe("evaluate", () => {
  test("never green without data", () => {
    expect(evaluate({ ok: null, ms: null })).toBe("unmonitored");
    expect(evaluate({ ok: false, ms: 10 })).toBe("unavailable");
    expect(evaluate({ ok: true, ms: 2500 })).toBe("degraded");
    expect(evaluate({ ok: true, ms: 120 })).toBe("healthy");
    expect(evaluate({ ok: true, ms: null })).toBe("healthy");
  });
});
