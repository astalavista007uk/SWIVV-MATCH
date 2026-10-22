/**
 * Safe local Resend delivery test — sends ONE SWIVV welcome email, nothing else.
 *
 * Usage:  bun run scripts/send-swivv-test-email.ts you@example.com
 *
 * Safety rules (no public endpoint, no relay value):
 * - Runs only from your terminal (never deployed, never callable over HTTP).
 * - FROM is always Resend's test sender (onboarding@resend.dev).
 * - TO must equal the recipient you pass AND Resend test mode only delivers
 *   to your own Resend account email — anything else fails provider-side.
 * - Prints the Resend id on acceptance, or status + message on failure.
 * - Never prints RESEND_API_KEY.
 */
import { swivvWelcome } from "../src/lib/swivv-email-templates";
import { RESEND_TEST_FROM } from "../src/lib/email";

const TO = process.argv[2];
const RESEND_KEY = process.env.RESEND_API_KEY;

if (!TO || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(TO)) {
  console.error("Usage: bun run scripts/send-swivv-test-email.ts you@example.com");
  console.error("(Use your Resend account email — test mode only delivers to it.)");
  process.exit(1);
}
if (!RESEND_KEY) {
  console.error("ERROR: RESEND_API_KEY not set in environment.");
  console.error("Add it to .env (server-only, never commit the value):  RESEND_API_KEY=re_xxxxxxxx");
  process.exit(1);
}

const tpl = swivvWelcome({ name: "Test" });
const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: RESEND_TEST_FROM, to: [TO], subject: `[TEST] ${tpl.subject}`, html: tpl.html }),
});
let body: any = null;
try {
  body = await res.json();
} catch {
  body = null;
}
if (res.ok && body?.id) {
  console.log(`Accepted — Resend id: ${body.id} (accepted ≠ delivered; check the inbox + Resend dashboard)`);
} else {
  console.error(`Rejected — status ${res.status}: ${JSON.stringify(body)?.slice(0, 300)}`);
  process.exit(1);
}
