import { describe, expect, test } from "bun:test";
import { actorType, rowSeverity, targetLink } from "../src/lib/admin-audit";

describe("actorType", () => {
  test("actor id means human admin; triggers read as system", () => {
    expect(actorType({ actor_id: "u1", action: "admin.user.banned" })).toBe("administrateur");
    expect(actorType({ actor_id: null, action: "user_status.suspended" })).toBe("système (trigger)");
    expect(actorType({ actor_id: null, action: "admin.unknown" })).toBe("système");
  });
});

describe("rowSeverity", () => {
  test("derived from action when column is default", () => {
    expect(rowSeverity({ action: "admin.user.banned", severity: "info" })).toBe("critical");
    expect(rowSeverity({ action: "admin.user.warn", severity: "info" })).toBe("warning");
    expect(rowSeverity({ action: "admin.users.view", severity: "info" })).toBe("info");
    expect(rowSeverity({ action: "admin.users.view", severity: "critical" })).toBe("critical");
  });
});

describe("targetLink", () => {
  test("known kinds deep-link, unknown don't", () => {
    expect(targetLink("user", "u1")?.to).toBe("/admin/users/$userId");
    expect(targetLink("ticket", "t1")?.to).toBe("/admin/support");
    expect(targetLink("alerts", "a1")?.to).toBe("/admin/alerts");
    expect(targetLink("bogus", "x")).toBe(null);
    expect(targetLink(null, "x")).toBe(null);
  });
});
