import { describe, expect, test } from "bun:test";
import { displayStatus, needsReason } from "../src/lib/admin-verify";

describe("displayStatus", () => {
  test("French labels, assigned pending reads as in-progress", () => {
    expect(displayStatus({ status: "pending", assigned_to: null })).toBe("En attente");
    expect(displayStatus({ status: "pending", assigned_to: "u1" })).toBe("En cours");
    expect(displayStatus({ status: "approved" })).toBe("Vérifiée");
    expect(displayStatus({ status: "rejected" })).toBe("Refusée");
    expect(displayStatus({ status: "expired" })).toBe("Expirée");
  });
  test("decisions require a reason", () => {
    expect(needsReason("approved", "")).toBe(false);
    expect(needsReason("rejected", "  ")).toBe(false);
    expect(needsReason("approved", "Pièce conforme")).toBe(true);
  });
});
