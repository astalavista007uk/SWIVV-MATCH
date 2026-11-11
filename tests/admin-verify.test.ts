import { describe, expect, test } from "bun:test";
import { displayKind, displayStatus, idAutoDecision, needsReason } from "../src/lib/admin-verify";

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

describe("displayKind", () => {
  test("identity gets a readable label, unknown kinds pass through", () => {
    expect(displayKind("identity")).toBe("Pièce d'identité");
    expect(displayKind("mystery")).toBe("mystery");
  });
});

describe("idAutoDecision", () => {
  test("matching portrait auto-approves and scores high", () => {
    const d = idAutoDecision(0.3);
    expect(d.status).toBe("approved");
    expect(d.score).toBe(50);
    expect(d.note).toContain("identique");
  });
  test("a different face goes to the human queue", () => {
    const d = idAutoDecision(0.9);
    expect(d.status).toBe("pending");
    expect(d.score).toBe(0);
    expect(d.note).toContain("différent");
  });
  test("no detected face is never approved", () => {
    expect(idAutoDecision(null)).toEqual({
      status: "pending",
      score: 0,
      note: "Aucun visage détecté sur la pièce",
    });
    expect(idAutoDecision(Number.NaN).status).toBe("pending");
  });
});
