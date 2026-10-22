import { describe, expect, test } from "bun:test";
import { mergeFeed, severityFor, UNSUPPORTED } from "../src/lib/admin-live";

describe("severityFor", () => {
  test("critical reports, warning matches, info signup", () => {
    expect(severityFor("report", "critical")).toBe("critical");
    expect(severityFor("report", "normal")).toBe("critical");
    expect(severityFor("match")).toBe("warning");
    expect(severityFor("signup")).toBe("info");
    expect(UNSUPPORTED).toContain("login");
  });
});

describe("mergeFeed", () => {
  test("dedupes, sorts newest first, caps", () => {
    const a = { key: "a", type: "x", label: "a", at: "2026-10-12T10:00:00Z", severity: "info" as const };
    const b = { key: "b", type: "x", label: "b", at: "2026-10-12T11:00:00Z", severity: "info" as const };
    expect(mergeFeed([a], [a, b]).map((r) => r.key)).toEqual(["b", "a"]);
    const many = Array.from({ length: 150 }, (_, i) => ({ ...a, key: `k${i}`, at: "2026-10-12T11:00:00Z" }));
    expect(mergeFeed([], many)).toHaveLength(100);
  });
});
