import { describe, expect, test } from "bun:test";
import { applySuppression, campaignState } from "../src/lib/admin-announce";

describe("applySuppression", () => {
  test("recent recipients are skipped, order kept", () => {
    expect(applySuppression(["a", "b", "c"], ["b"])).toEqual({ send: ["a", "c"], skipped: ["b"] });
    expect(applySuppression(["a"], [])).toEqual({ send: ["a"], skipped: [] });
  });
});

describe("campaignState", () => {
  const now = new Date("2026-10-12T12:00:00Z").getTime();
  test("draft → scheduled → due → sent / cancelled", () => {
    expect(campaignState({ sent_at: null }, now)).toBe("draft");
    expect(campaignState({ sent_at: null, scheduled_at: "2026-10-13T12:00:00Z" }, now)).toBe("scheduled");
    expect(campaignState({ sent_at: null, scheduled_at: "2026-10-12T11:00:00Z" }, now)).toBe("sending_due");
    expect(campaignState({ sent_at: "2026-10-12T11:00:00Z" }, now)).toBe("sent");
    expect(campaignState({ sent_at: null, cancelled_at: "2026-10-12T11:00:00Z" }, now)).toBe("cancelled");
  });
});
