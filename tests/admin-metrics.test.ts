import { describe, expect, test } from "bun:test";
import { bucketByDay, firstResponse, fmtDelta, pctChange } from "../src/lib/admin-metrics";

describe("pctChange", () => {
  test("relative change rounds", () => {
    expect(pctChange(110, 100)).toBe(10);
    expect(pctChange(90, 100)).toBe(-10);
    expect(pctChange(0, 0)).toBe(null);
    expect(pctChange(5, 0)).toBe(null);
  });
  test("labels", () => {
    expect(fmtDelta(110, 100)).toBe("+10 %");
    expect(fmtDelta(90, 100)).toBe("-10 %");
    expect(fmtDelta(5, 0)).toBe("—");
  });
});

describe("bucketByDay", () => {
  test("counts land on the right Paris day", () => {
    const now = new Date("2026-10-12T12:00:00+02:00").getTime();
    const out = bucketByDay(
      [
        { created_at: "2026-10-12T10:00:00+02:00" },
        { created_at: "2026-10-12T11:00:00+02:00" },
        { created_at: "2026-10-10T23:00:00+02:00" },
        { created_at: "bogus" },
      ],
      3,
      now,
    );
    expect(out.map((b) => b.n)).toEqual([1, 0, 2]);
    expect(out).toHaveLength(3);
  });
});

describe("firstResponse", () => {
  const tickets = [
    { id: "a", created_at: "2026-10-10T10:00:00Z" },
    { id: "b", created_at: "2026-10-10T10:00:00Z" },
    { id: "c", created_at: "2026-10-01T10:00:00Z" },
  ];
  const msgs = [
    { ticket_id: "a", created_at: "2026-10-10T12:00:00Z", is_staff: true },
    { ticket_id: "a", created_at: "2026-10-10T10:30:00Z", is_staff: false },
    { ticket_id: "b", created_at: "2026-10-10T09:00:00Z", is_staff: true }, // before ticket: ignored
  ];
  test("avg over genuine first staff replies, overdue counts the rest", () => {
    const r = firstResponse(tickets, msgs, 48, new Date("2026-10-12T12:00:00Z").getTime());
    expect(r.avgH).toBe(2);
    expect(r.responded).toBe(1);
    expect(r.overdue).toBe(2); // b (50 h, reply predates ticket) and c (11 days, no reply)
  });
});
