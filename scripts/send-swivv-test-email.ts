/**
 * Safe local IONOS SMTP delivery test — sends ONE SWIVV welcome email, nothing else.
 *
 * Usage:  bun run scripts/send-swivv-test-email.ts you@example.com
 *
 * - Runs only from your terminal (never deployed, never callable over HTTP).
 * - Uses the same sendEmail() path as the app, including the configured From.
 */
import { swivvWelcome } from "../src/lib/swivv-email-templates";
import { sendEmail } from "../src/lib/email";

const TO = process.argv[2];
if (!TO || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(TO)) {
  console.error("Usage: bun run scripts/send-swivv-test-email.ts you@example.com");
  process.exit(1);
}

const tpl = swivvWelcome({ name: "Test" });
const r = await sendEmail({ to: TO, subject: `[TEST] ${tpl.subject}`, html: tpl.html });
if (r.ok) console.log(`Accepted — message id: ${r.id || "(none)"} (check the inbox)`);
else {
  console.error(`Rejected — ${r.error}${r.status ? ` (status ${r.status})` : ""}`);
  process.exit(1);
}
