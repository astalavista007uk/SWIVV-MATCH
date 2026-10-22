import { describe, expect, test } from "bun:test";
import { repeatCounts, sortQueue, timeSince, type ReportRow } from "../src/lib/admin-reports";

const now = new Date("2026-10-12T12:00:00Z").getTime();
const r = (o: Partial<ReportRow>): ReportRow => ({
  id: "x", created_at: "2026-10-12T11:00:00Z", reporter_id: null, reported_user_id: null,
  category: "spam", priority: "normal", status: "new", assigned_to: null, ...o,
});

describe("timeSince", () => {
  test("French relative labels", () => {
    expect(timeSince("2026-10-12T11:59:30Z", now)).toBe("à l'instant");
    expect(timeSince("2026-10-12T11:30:00Z", now)).toBe("il y a 30 min");
    expect(timeSince("2026-10-12T09:00:00Z", now)).toBe("il y a 3 h");
    expect(timeSince("2026-10-09T12:00:00Z", now)).toBe("il y a 3 j");
    expect(timeSince("bogus", now)).toBe("—");
  });
});

describe("sortQueue", () => {
  test("critical, then repeats, then newest", () => {
    const rows = [
      r({ id: "a", priority: "normal", reported_user_id: "u1", created_at: "2026-10-12T11:00:00Z" }),
      r({ id: "b", priority: "critical", reported_user_id: "u2", created_at: "2026-10-10T11:00:00Z" }),
      r({ id: "c", priority: "normal", reported_user_id: "u3", created_at: "2026-10-12T10:00:00Z" }),
      r({ id: "d", priority: "normal", reported_user_id: "u1", created_at: "2026-10-12T09:00:00Z" }),
    ];
    const out = sortQueue(rows, repeatCounts(rows)).map((x) => x.id);
    expect(out).toEqual(["b", "a", "d", "c"]);
  });
});
