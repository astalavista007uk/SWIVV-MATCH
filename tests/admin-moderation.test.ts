import { describe, expect, test } from "bun:test";
import { aiAvailable, flagReasons, flagText, requestAiSummary } from "../src/lib/admin-moderation";

describe("flagText", () => {
  test("finds links, phones, handles, spam — and nothing in clean text", () => {
    expect(flagText("Salut, j'aime la rando")).toEqual({ url: false, phone: false, handle: false, spam: false });
    expect(flagText("Voir mon site www.example.com")).toMatchObject({ url: true });
    expect(flagText("Appelle-moi au 06 12 34 56 78")).toMatchObject({ phone: true });
    expect(flagText("Mon insta : @marie")).toMatchObject({ handle: true });
    expect(flagText("Gagne de l'argent vite, crypto")).toMatchObject({ spam: true });
    expect(flagText(null)).toEqual({ url: false, phone: false, handle: false, spam: false });
  });
  test("reasons list what fired", () => {
    expect(flagReasons({ url: true, phone: false, handle: true, spam: false })).toEqual(["lien externe", "réseau social"]);
  });
});

describe("AI stub", () => {
  test("reports unavailable, never fakes a summary", async () => {
    expect(aiAvailable()).toBe(false);
    await expect(requestAiSummary("x")).rejects.toThrow("IA non configurée");
  });
});
