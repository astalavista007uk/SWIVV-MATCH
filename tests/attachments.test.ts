import { describe, expect, test } from "bun:test";
import {
  formatBytes,
  MAX_ATTACHMENT_BYTES,
  MAX_VOICE_BYTES,
  validateAttachment,
  validateVoice,
} from "../src/lib/swivv-attachments";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

function file(bytes: Uint8Array, name: string, type: string): File {
  return new File([bytes], name, { type });
}

describe("attachment validation", () => {
  test("accepts the permitted formats when the signature matches", async () => {
    expect(await validateAttachment(file(PNG, "photo.png", "image/png"))).toBeNull();
    expect(await validateAttachment(file(JPG, "photo.jpg", "image/jpeg"))).toBeNull();
    expect(await validateAttachment(file(WEBP, "photo.webp", "image/webp"))).toBeNull();
    expect(await validateAttachment(file(PDF, "cv.pdf", "application/pdf"))).toBeNull();
    expect(
      await validateAttachment(file(new TextEncoder().encode("bonjour"), "note.txt", "text/plain")),
    ).toBeNull();
  });

  test("rejects files above 2 MB", async () => {
    const big = new Uint8Array(MAX_ATTACHMENT_BYTES + 1);
    big.set(PNG);
    expect(await validateAttachment(file(big, "photo.png", "image/png"))).toContain("2 Mo");
  });

  test("rejects executables, scripts, archives and unknown formats", async () => {
    expect(
      await validateAttachment(file(JPG, "setup.exe", "application/x-msdownload")),
    ).not.toBeNull();
    expect(await validateAttachment(file(JPG, "script.sh", "text/x-sh"))).not.toBeNull();
    expect(await validateAttachment(file(PDF, "archive.zip", "application/zip"))).not.toBeNull();
    expect(await validateAttachment(file(PNG, "anim.gif", "image/gif"))).not.toBeNull();
  });

  test("rejects a fake extension whose content is not that format", async () => {
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0, 0, 0, 0]);
    expect(await validateAttachment(file(exe, "photo.jpg", "image/jpeg"))).toContain("contenu");
    expect(await validateAttachment(file(exe, "facture.pdf", "application/pdf"))).toContain(
      "contenu",
    );
  });

  test("rejects binary TXT and empty files", async () => {
    expect(
      await validateAttachment(file(new Uint8Array([65, 0, 66]), "note.txt", "text/plain")),
    ).toContain("TXT");
    expect(await validateAttachment(file(new Uint8Array(), "note.txt", "text/plain"))).toContain(
      "vide",
    );
  });

  test("voice notes cap at 5 MB and only allow audio types", async () => {
    const ok = new Blob([new Uint8Array(1024)], { type: "audio/webm" });
    expect(await validateVoice(ok)).toBeNull();
    const big = new Blob([new Uint8Array(MAX_VOICE_BYTES + 1)], { type: "audio/webm" });
    expect(await validateVoice(big)).toContain("5 Mo");
    expect(
      await validateVoice(new Blob([new Uint8Array(10)], { type: "application/pdf" })),
    ).toContain("audio");
  });

  test("formats sizes for the UI", () => {
    expect(formatBytes(900)).toBe("1 Ko");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 Mo");
  });
});
