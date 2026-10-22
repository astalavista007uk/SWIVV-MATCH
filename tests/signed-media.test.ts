import { describe, expect, test } from "bun:test";
import { storagePathOf } from "../src/lib/swivv-store";

// ponytail: pure parsing only (signing needs a live session) — a live createSignedUrl probe belongs in the manual migration checklist, not here
describe("storagePathOf", () => {
  test("extracts path from cloud public URL", () => {
    expect(storagePathOf("https://qofjdhnljeabztlcawmv.supabase.co/storage/v1/object/public/swivv-voice/uid1/u:uid2/123-i.jpg")).toBe("uid1/u:uid2/123-i.jpg");
  });
  test("strips signed query tokens", () => {
    expect(storagePathOf("https://xyz.supabase.co/storage/v1/object/sign/swivv-voice/a/b/c.webm?token=abc")).toBe("a/b/c.webm");
  });
  test("ignores non-storage URLs", () => {
    expect(storagePathOf("https://images.unsplash.com/photo-123")).toBeNull();
    expect(storagePathOf("data:image/jpeg;base64,/9j/")).toBeNull();
    expect(storagePathOf(null)).toBeNull();
    expect(storagePathOf("")).toBeNull();
  });
});
