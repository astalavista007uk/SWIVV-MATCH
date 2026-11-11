/** Shared email + notification helpers for server functions. */

/** Resend test-mode sender: works without a verified domain, but only to the account's own address. */
export const RESEND_TEST_FROM = "SWIVV MATCH <onboarding@resend.dev>";

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; status?: number };

/**
 * Send an email via Resend. Returns the provider id on acceptance.
 * ponytail: Resend accepts async — ok:true means ACCEPTED (queued provider-side), not delivered; true delivery status needs the Resend webhook, which isn't wired yet
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const supportFrom = process.env.SUPPORT_EMAIL_FROM;
  // ponytail: explicit not-configured error (was a silent false) — callers log it to the outbox row instead of swallowing
  if (!resendKey || !supportFrom) return { ok: false, error: "not-configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: supportFrom, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    // ponytail: parse defensively (non-JSON error pages exist) and log status + provider message only — the key and html body never enter logs
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (res.ok && body?.id) return { ok: true, id: String(body.id) };
    const msg = typeof body?.message === "string" ? body.message : typeof body === "string" ? body : `http-${res.status}`;
    console.error("[email] resend rejected", { status: res.status, error: msg.slice(0, 300), to });
    return { ok: false, error: msg.slice(0, 300), status: res.status };
  } catch (e) {
    // ponytail: network/DNS failure is distinct from provider rejection — different retry posture (safe to retry vs fix the payload)
    const msg = (e as Error)?.message ?? "network-error";
    console.error("[email] sendEmail failed", { error: String(msg).slice(0, 300), to });
    return { ok: false, error: String(msg).slice(0, 300) };
  }
}

/** Look up a user's email address via the admin client. */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Square 96px avatar for the 48px inbox slot. Inbox clients ignore `object-fit` (Yahoo), so a
 * wide source photo gets squashed at 48px; the render endpoint serves an exact 2x square crop.
 * ponytail: needs Storage image transforms enabled (Pro) — if that ever 400s, drop the rewrite
 * and accept the stretch, or pre-crop on upload.
 */
export function avatarUrl(url: string): string {
  if (!url.includes("/storage/v1/object/public/")) return url;
  const u = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  return `${u}${u.includes("?") ? "&" : "?"}width=96&height=96&resize=cover`;
}

/** Look up a member's display name + first photo via the admin client. */
export async function getUserIdentity(userId: string): Promise<{ name: string; photo?: string }> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // ponytail: names/photos live in swivv_profiles.data (the legacy profiles table is empty) — read auth metadata only as a fallback
    const { data } = await supabaseAdmin.from("swivv_profiles").select("data").eq("user_id", userId).maybeSingle();
    const d = (data?.data ?? {}) as { name?: string; photos?: string[] };
    let name = d.name?.trim() ?? "";
    let photo = d.photos?.[0];
    if (!name || !photo) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
      name ||= (u?.user?.user_metadata as { name?: string } | undefined)?.name?.trim() ?? "";
      name ||= u?.user?.email?.split("@")[0] ?? "";
    }
    // ponytail: only public https photos — data: URLs are stripped/blocked by inboxes, so send no avatar rather than a broken image
    return { name: name || "membre", photo: photo && /^https:\/\//i.test(photo) ? avatarUrl(photo) : undefined };
  } catch {
    return { name: "membre" };
  }
}

/** Look up a user's display name via the admin client. */
export async function getUserName(userId: string): Promise<string> {
  return (await getUserIdentity(userId)).name;
}
