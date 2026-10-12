import { describe, expect, test } from "bun:test";
import { badgeText, digestDue, emailAllowed, emailKey, previewForEmail, validLink, windowElapsed } from "../src/lib/swivv-notify.logic";

const H = 3600e3;
describe("windows", () => {
  test("first event always passes", () => {
    expect(windowElapsed(null, 1000, H)).toBe(true);
    expect(windowElapsed(undefined, 1000, H)).toBe(true);
  });
  test("cooldown suppresses then releases", () => {
    expect(windowElapsed(1000, 1000 + H - 1, H)).toBe(false);
    expect(windowElapsed(1000, 1000 + H, H)).toBe(true);
  });
  test("digest cadence", () => {
    expect(digestDue(null, 1e12, "daily")).toBe(true);
    expect(digestDue(1e12 - 1000, 1e12, "daily")).toBe(false);
    expect(digestDue(1e12 - 8 * 86400e3, 1e12, "weekly")).toBe(true);
    expect(digestDue(null, 1e12, "off")).toBe(false);
    expect(digestDue(null, 1e12, "bogus")).toBe(true); // unknown = daily default
  });
});
describe("links", () => {
  test("allows known pages", () => {
    for (const l of ["/messagerie", "/matches", "/member/428fb1ac-64eb-427a-8983-647cd4618d7d", "/verification"]) expect(validLink(l)).toBe(true);
  });
  test("blocks externals, open redirects, seed ids", () => {
    for (const l of [null, "", "https://evil.com", "//evil.com/x", "/member/seed-12", "/admin/users", "/member/x?a=b", "javascript:alert(1)"]) expect(validLink(l as any)).toBe(false);
  });
});
describe("email gating", () => {
  test("prefs gate optionals, never security", () => {
    expect(emailAllowed({ emailMessages: false }, "messages")).toBe(false);
    expect(emailAllowed({ emailMessages: false }, "security")).toBe(true);
    expect(emailAllowed({}, "liked")).toBe(true); // unset = default on
  });
  test("body never travels: constant preview only", () => {
    expect(previewForEmail("salut ça va, mon adresse est 1 rue X")).toBe("Un nouveau message t'attend");
  });
  test("idempotency keys", () => {
    expect(emailKey("match", "u1", 1000)).toBe(emailKey("match", "u1", 9999999999)); // once ever
    expect(emailKey("like", "u1", 1000)).toBe(emailKey("like", "u1", 2000)); // same day bucket
    expect(emailKey("message", "u1", 1000)).not.toBe(emailKey("message", "u2", 1000)); // per peer
  });
  test("badge cap", () => {
    expect(badgeText(0)).toBe("0"); expect(badgeText(9)).toBe("9"); expect(badgeText(10)).toBe("9+"); expect(badgeText(-3)).toBe("0");
  });
});
