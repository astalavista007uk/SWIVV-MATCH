/**
 * Test script — sends all PET BASE email templates to a test address.
 * Usage: bun run scripts/send-test-emails.ts <email-address>
 */
import {
  buildContactEmailHtml,
  buildContactConfirmationEmailHtml,
  buildSupportEmailHtml,
  buildWelcomeEmailHtml,
  buildBookingSentEmailHtml,
  buildMessageReceivedEmailHtml,
} from "../src/lib/email-templates";

const TO = process.argv[2] || "astalavista007uk@yahoo.o.uk";
const FROM = process.env.SUPPORT_EMAIL_FROM || "PET BASE <noreply@petbase.app>";
const RESEND_KEY = process.env.RESEND_API_KEY;

if (!RESEND_KEY) {
  console.error("ERROR: RESEND_API_KEY not set in environment.");
  console.error("Add it to .env:  RESEND_API_KEY=re_xxxxxxxx");
  process.exit(1);
}

async function send(subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [TO], subject, html }),
  });
  const data = await res.json();
  if (res.ok) console.log(`✓ ${subject}`);
  else console.error(`✗ ${subject}: ${JSON.stringify(data)}`);
}

const emails: { subject: string; html: string }[] = [
  {
    subject: "Welcome to PET BASE!",
    html: buildWelcomeEmailHtml({ firstName: "Test" }),
  },
  {
    subject: "Contact request from John Doe — General Inquiry",
    html: buildContactEmailHtml({
      firstName: "John", lastName: "Doe", email: "john@example.com",
      town: "Paris", country: "France", phone: "+33 6 12 34 56 78",
      subject: "General Inquiry",
      message: "Hello! I'd like to know more about your pet sitting services in the 15th arrondissement. Do you have providers available this weekend?",
      attachmentUrls: [],
    }),
  },
  {
    subject: "We received your message — PET BASE",
    html: buildContactConfirmationEmailHtml({
      firstName: "John",
      subject: "General Inquiry",
      message: "Hello! I'd like to know more about your pet sitting services in the 15th arrondissement.",
    }),
  },
  {
    subject: "Support request from Jane Smith",
    html: buildSupportEmailHtml({
      name: "Jane Smith", email: "jane@example.com",
      message: "I'm having trouble uploading photos to my service listing. The upload seems to hang at 80%.",
      transcript: [
        { role: "assistant", content: "Hi! How can I help you today?" },
        { role: "user", content: "I can't upload photos — it keeps getting stuck." },
        { role: "assistant", content: "Let me connect you with our support team." },
      ],
    }),
  },
  {
    subject: "Booking request sent — PET BASE",
    html: buildBookingSentEmailHtml({
      customerName: "John",
      providerName: "Manon C.",
      serviceType: "Drop-in Visit (30 min)",
      startDate: "Mon, 28 Jul 2026 · 10:00 AM",
      totalPrice: "€19.80",
    }),
  },
  {
    subject: "New message from Manon C. — PET BASE",
    html: buildMessageReceivedEmailHtml({
      recipientName: "John",
      senderName: "Manon C.",
      preview: "Hi John! I'd be happy to take care of your dog this weekend. I'm available Saturday and Sunday morning...",
    }),
  },
];

(async () => {
  console.log(`Sending ${emails.length} test emails to ${TO}...`);
  for (const e of emails) {
    await send(e.subject, e.html);
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log("Done.");
})();
