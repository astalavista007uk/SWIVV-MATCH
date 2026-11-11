import { describe, expect, test } from "bun:test";
import { avatarUrl, sendEmail } from "../src/lib/email";
import { swivvNewMessage } from "../src/lib/swivv-email-templates";
import { SAFE_MSG_PREVIEW, previewForEmail } from "../src/lib/swivv-notify.logic";

describe("sendEmail", () => {
  test("missing config is an explicit error, not a silent false", async () => {
    const host = process.env.IONOS_SMTP_HOST;
    const user = process.env.IONOS_SMTP_USER;
    const pass = process.env.IONOS_SMTP_PASS;
    const from = process.env.SUPPORT_EMAIL_FROM;
    delete process.env.IONOS_SMTP_HOST;
    delete process.env.IONOS_SMTP_USER;
    delete process.env.IONOS_SMTP_PASS;
    delete process.env.SUPPORT_EMAIL_FROM;
    try {
      const r = await sendEmail({ to: "nobody@example.com", subject: "x", html: "<p>x</p>" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe("not-configured");
    } finally {
      if (host !== undefined) process.env.IONOS_SMTP_HOST = host;
      if (user !== undefined) process.env.IONOS_SMTP_USER = user;
      if (pass !== undefined) process.env.IONOS_SMTP_PASS = pass;
      if (from !== undefined) process.env.SUPPORT_EMAIL_FROM = from;
    }
  });
});

describe("message email", () => {
  test("greets the recipient and shows the sender name + photo", () => {
    const { subject, html } = swivvNewMessage({ name: "Emma", senderName: "Karim", senderPhoto: "https://cdn.example/p.jpg", preview: "" });
    expect(subject).toContain("Karim");
    expect(html).toContain("Salut Emma,");
    expect(html).toContain("<strong>Karim</strong>");
    expect(html).toContain("https://cdn.example/p.jpg");
  });

  test("omits the avatar cell when there is no public photo", () => {
    const { html } = swivvNewMessage({ name: "Emma", senderName: "Karim", preview: "" });
    expect(html).not.toContain("<img src=\"undefined\"");
  });

  test("shows the neutral preview, never the message body", () => {
    expect(previewForEmail("salut ça va ?")).toBe(SAFE_MSG_PREVIEW);
    const { html } = swivvNewMessage({ name: "Emma", senderName: "Karim", preview: previewForEmail("secret") });
    expect(html).toContain("Un nouveau message t&#039;attend");
  });
});

describe("avatarUrl", () => {
  test("asks for an exact 96px square crop so inbox clients can't stretch it", () => {
    expect(avatarUrl("https://q.supabase.co/storage/v1/object/public/avatars/u/a.jpg")).toBe(
      "https://q.supabase.co/storage/v1/render/image/public/avatars/u/a.jpg?width=96&height=96&resize=cover",
    );
    expect(avatarUrl("https://cdn.example/p.jpg")).toBe("https://cdn.example/p.jpg");
  });
});
