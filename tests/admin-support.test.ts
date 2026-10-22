import { describe, expect, test } from "bun:test";
import { ticketFlags } from "../src/lib/admin-support";

const now = new Date("2026-10-12T12:00:00Z").getTime();

describe("ticketFlags", () => {
  test("no reply yet: awaiting, overdue past SLA", () => {
    expect(ticketFlags(null, "2026-10-12T11:00:00Z", now)).toEqual({ awaiting: true, overdue: false, deadline: now + 47 * 36e5 });
    expect(ticketFlags(null, "2026-10-10T11:00:00Z", now).overdue).toBe(true);
  });
  test("staff last: settled; member last: awaiting", () => {
    expect(ticketFlags({ at: "2026-10-12T11:00:00Z", staff: true }, "2026-10-10T11:00:00Z", now)).toEqual({
      awaiting: false, overdue: false, deadline: new Date("2026-10-10T11:00:00Z").getTime() + 48 * 36e5,
    });
    const r = ticketFlags({ at: "2026-10-12T11:00:00Z", staff: false }, "2026-10-10T11:00:00Z", now);
    expect(r.awaiting).toBe(true);
    expect(r.overdue).toBe(true);
  });
});
