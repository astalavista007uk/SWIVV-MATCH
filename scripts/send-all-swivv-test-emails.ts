/**
 * Safe local preview — sends all 44 SWIVV templates to ONE address, nothing else.
 *
 * Usage:  bun run scripts/send-all-swivv-test-emails.ts you@example.com
 *         bun run scripts/send-all-swivv-test-emails.ts you@example.com DailyMatches,WeeklyMatches
 *
 * Same safety rule as send-swivv-test-email.ts (terminal-only, same sendEmail() path).
 * ponytail: 700ms pacing protects the IONOS mailbox from a 44-message burst; tune if its limit says otherwise
 */
import { sendEmail } from "../src/lib/email";
import * as T from "../src/lib/swivv-email-templates";

const TO = process.argv[2];
if (!TO || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(TO)) {
  console.error("Usage: bun run scripts/send-all-swivv-test-emails.ts you@example.com");
  process.exit(1);
}

// ponytail: same sample data as the /emails preview page — one source per template, no fixtures file until the lists diverge
const ALL: { label: string; subject: string; html: string }[] = [
  { label: "VerifyEmail", ...T.swivvVerifyEmail({ name: "Emma", verifyUrl: "https://swivvmatch.com/verifier?token=exemple" }) },
  { label: "Welcome", ...T.swivvWelcome({ name: "Emma" }) },
  { label: "ProfileIncomplete", ...T.swivvProfileIncomplete({ name: "Emma", percent: 65 }) },
  { label: "NewLike", ...T.swivvNewLike({ name: "Emma", likerName: "Karim" }) },
  { label: "NewMatch", ...T.swivvNewMatch({ name: "Emma", matchName: "Karim" }) },
  { label: "NewMessage", ...T.swivvNewMessage({ name: "Emma", senderName: "Karim", preview: "Salut Emma ! J'ai vu que tu aimes la randonnée, tu as un coin préféré ?" }) },
  { label: "ActivityDigest", ...T.swivvActivityDigest({ name: "Emma", likes: 3, messages: 2 }) },
  { label: "NewNearby", ...T.swivvNewNearby({ name: "Emma", city: "Paris", count: 5 }) },
  { label: "TestimonialInvite", ...T.swivvTestimonialInvite({ name: "Emma" }) },
  { label: "SafetyTips", ...T.swivvSafetyTips({ name: "Emma" }) },
  { label: "WeMissYou", ...T.swivvWeMissYou({ name: "Emma", likes: 2 }) },
  { label: "PasswordReset", ...T.swivvPasswordReset({ name: "Emma", resetUrl: "https://swivvmatch.com/reset?token=exemple" }) },
  { label: "ReportReceived", ...T.swivvReportReceived({ name: "Emma" }) },
  { label: "AccountDeleted", ...T.swivvAccountDeleted({ name: "Emma" }) },
  { label: "Promo", ...T.swivvPromo({ name: "Emma", headline: "Nouveau : les appels vidéo arrivent", detail: "Discute en vidéo avec tes matches, directement depuis SWIVV.", cta: "Découvrir", url: "/browse" }) },
  { label: "DailyMatches", ...T.swivvDailyMatches({ name: "Emma", matches: T.picksFor("man", 4) }) },
  { label: "WeeklyMatches", ...T.swivvWeeklyMatches({ name: "Emma", matches: T.picksFor("man", 12) }) },
  { label: "AddPhoto", ...T.swivvAddPhoto({ name: "Emma" }) },
  { label: "PhotoApproved", ...T.swivvPhotoApproved({ name: "Emma" }) },
  { label: "PhotoRejected", ...T.swivvPhotoRejected({ name: "Emma" }) },
  { label: "ProfileHidden", ...T.swivvProfileHidden({ name: "Emma" }) },
  { label: "ProfileVisibleAgain", ...T.swivvProfileVisibleAgain({ name: "Emma" }) },
  { label: "Referral", ...T.swivvReferral({ name: "Emma" }) },
  { label: "ReferralSuccess", ...T.swivvReferralSuccess({ name: "Emma", friendName: "Karim" }) },
  { label: "ProfileReported", ...T.swivvProfileReported({ name: "Emma" }) },
  { label: "ContentRemoved", ...T.swivvContentRemoved({ name: "Emma" }) },
  { label: "SuspendedTemp", ...T.swivvSuspendedTemp({ name: "Emma" }) },
  { label: "SuspendedPerm", ...T.swivvSuspendedPerm({ name: "Emma" }) },
  { label: "AccountRestored", ...T.swivvAccountRestored({ name: "Emma" }) },
  { label: "TermsUpdated", ...T.swivvTermsUpdated({ name: "Emma" }) },
  { label: "PrivacyUpdated", ...T.swivvPrivacyUpdated({ name: "Emma" }) },
  { label: "CookiesUpdated", ...T.swivvCookiesUpdated({ name: "Emma" }) },
  { label: "AppAvailable", ...T.swivvAppAvailable({ name: "Emma" }) },
  { label: "PushDisabled", ...T.swivvPushDisabled({ name: "Emma" }) },
  { label: "EnableNotifications", ...T.swivvEnableNotifications({ name: "Emma" }) },
  { label: "NewDevice", ...T.swivvNewDevice({ name: "Emma", device: "iPhone 15 · Paris" }) },
  { label: "WelcomeSurvey", ...T.swivvWelcomeSurvey({ name: "Emma" }) },
  { label: "Feedback", ...T.swivvFeedback({ name: "Emma" }) },
  { label: "ProductSurvey", ...T.swivvProductSurvey({ name: "Emma" }) },
  { label: "FeatureFeedback", ...T.swivvFeatureFeedback({ name: "Emma", feature: "les appels vidéo" }) },
  { label: "FeatureRequestThanks", ...T.swivvFeatureRequestThanks({ name: "Emma" }) },
  { label: "ContactReceived", ...T.swivvContactReceived({ name: "Emma" }) },
  { label: "SupportReply", ...T.swivvSupportReply({ name: "Emma" }) },
  { label: "ReportResolved", ...T.swivvReportResolved({ name: "Emma" }) },
];

let ok = 0;
// ponytail: optional 2nd arg filters by label (comma-separated) — a dedicated per-template script if filtering ever needs more than this
const only = (process.argv[3] ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const queue = only.length ? ALL.filter((t) => only.includes(t.label.toLowerCase())) : ALL;
if (!queue.length) {
  console.error(`No template matches: ${process.argv[3]} (labels: ${ALL.map((t) => t.label).join(", ")})`);
  process.exit(1);
}
for (const t of queue) {
  const r = await sendEmail({ to: TO, subject: `[TEST ${t.label}] ${t.subject}`, html: t.html });
  if (r.ok) {
    ok++;
    console.log(`ok   ${t.label} (${r.id || "accepted"})`);
  } else {
    console.error(`FAIL ${t.label} — ${r.error}${r.status ? ` (status ${r.status})` : ""}`);
  }
  await new Promise((r) => setTimeout(r, 700));
}
console.log(`\n${ok}/${queue.length} accepted (accepted ≠ delivered; check the inbox)`);
if (ok !== queue.length) process.exit(1);
