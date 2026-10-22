import { describe, expect, test } from "bun:test";
import { dupBios, normalizeEvasion, postBlockContact, screenText } from "../src/lib/moderation-engine";

describe("normalizeEvasion", () => {
  test("leet + spacing tricks collapse", () => {
    expect(normalizeEvasion("Tu v4s m0ur1r").norm).toBe("tu vas mourir");
    expect(normalizeEvasion("a r n a q u e").compact).toBe("arnaque");
  });
});

describe("screenText", () => {
  test("severe FR/EN patterns hit critical", () => {
    expect(screenText("Je vais te tuer").map((h) => h.category)).toContain("threat");
    expect(screenText("I will kill you").map((h) => h.category)).toContain("threat");
    expect(screenText("Envoie de l'argent par virement").map((h) => h.category)).toContain("scam-money");
  });
  test("scam combo needs channel + money together", () => {
    expect(screenText("Parlons sur whatsapp, envoie de l'argent").map((h) => h.category)).toContain("scam-combo");
    expect(screenText("Parlons sur whatsapp demain ?")).toHaveLength(0);
    expect(screenText("On parle d'argent en général").map((h) => h.category)).not.toContain("scam-money");
  });
  test("false-positive guards: benign profanity, consensual, quoted", () => {
    expect(screenText("Merde, j'ai oublié les clés")).toHaveLength(0);
    expect(screenText("Salut ça va ?")).toHaveLength(0);
    const quoted = screenText("Il m'a dit « je vais te tuer » hier");
    expect(quoted).toHaveLength(1);
    expect(quoted[0].severity).toBe("warning");
    const consent = screenText("Avec mon mari on s'envoie des photos explicites");
    expect(consent.every((h) => h.severity === "warning")).toBe(true);
  });
});

describe("dupBios", () => {
  test("identical long bios group, short ones ignored", () => {
    const out = dupBios([
      { user_id: "a", bio: "J'adore la randonnée et les couchers de soleil en montagne" },
      { user_id: "b", bio: "J'adore  la randonnée et les couchers de soleil en montagne" },
      { user_id: "c", bio: "Salut" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].users.sort()).toEqual(["a", "b"]);
  });
});

describe("postBlockContact", () => {
  test("only messages after the block flag", () => {
    const out = postBlockContact(
      [
        { senderId: "s", peerId: "r", created_at: "2026-10-10T10:00:00Z" },
        { senderId: "s", peerId: "r", created_at: "2026-10-12T10:00:00Z" },
        { senderId: "r", peerId: "s", created_at: "2026-10-12T11:00:00Z" },
      ],
      [{ blocker: "r", blocked: "s", created_at: "2026-10-11T10:00:00Z" }],
    );
    expect(out).toHaveLength(1);
    expect(out[0].sender).toBe("s");
  });
});
