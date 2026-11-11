import { expect, test } from "@playwright/test";
import { sendEmail } from "../src/lib/email";
import { deleteMail, waitForMail } from "./helpers/mail";
import { MAIL_USER } from "./helpers/env";

test.skip(process.env.E2E_MAIL !== "1", "set E2E_MAIL=1 to exercise real IONOS delivery");

test("@mail app SMTP reaches the inbox", async () => {
  test.setTimeout(180_000);
  const token = `MAIL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const r = await sendEmail({
    to: MAIL_USER,
    subject: `[E2E] ${token}`,
    html: `<p>${token}</p>`,
  });
  expect(r.ok, r.ok ? "" : r.error).toBe(true);

  const mail = await waitForMail({ bodyIncludes: token, timeoutMs: 120_000 });
  expect(mail.subject).toContain(token);
  expect(mail.text).toContain(token);
  await deleteMail([mail.uid]);
});
