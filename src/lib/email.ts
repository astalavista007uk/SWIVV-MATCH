/** Shared email + notification helpers for server functions. */

/** Send an email via Resend. Returns true if sent, false if not configured or failed. */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  const supportFrom = process.env.SUPPORT_EMAIL_FROM;
  if (!resendKey || !supportFrom) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: supportFrom, to: [to], subject, html }),
    });
    return res.ok;
  } catch (e) {
    console.error("[email] sendEmail failed:", e);
    return false;
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

/** Look up a user's full name via the admin client. */
export async function getUserName(userId: string): Promise<string> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    return data?.full_name ?? "there";
  } catch {
    return "there";
  }
}

/** Insert an in-app notification + Web Push via the admin client (bypasses RLS). */
export async function insertNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("swivv_notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? "/bookings",
    });
    if (error) console.error("[email] insertNotification failed:", error);
  } catch (e) {
    console.error("[email] insertNotification failed:", e);
  }
}
