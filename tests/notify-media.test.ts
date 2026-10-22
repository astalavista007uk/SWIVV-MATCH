import { describe, expect, test } from "bun:test";
import { chatMediaKind } from "../src/lib/swivv-notify";

// ponytail: pure mapping only (titles/dedupe need a session) — live send paths stay on the manual checklist
describe("chatMediaKind", () => {
  test("vocal wins over photo", () => {
    expect(chatMediaKind({ audio_url: "a.webm", image_url: "b.jpg" })).toBe("vocal");
    expect(chatMediaKind({ audio_url: "a.webm" })).toBe("vocal");
  });
  test("photo without audio", () => {
    expect(chatMediaKind({ image_url: "b.jpg" })).toBe("photo");
  });
  test("text and empty", () => {
    expect(chatMediaKind({})).toBeNull();
    expect(chatMediaKind(null)).toBeNull();
    expect(chatMediaKind(undefined)).toBeNull();
    expect(chatMediaKind({ audio_url: null, image_url: null })).toBeNull();
  });
});
