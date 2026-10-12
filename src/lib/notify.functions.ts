import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getUserEmail, getUserName, sendEmail } from "@/lib/email";
import { swivvActivityDigest, swivvNewLike, swivvNewMatch, swivvNewMessage } from "@/lib/swivv-email-templates";
import { digestDue, emailAllowed, emailKey, previewForEmail } from "@/lib/swivv-notify.logic";

// ponytail: caller == recipient always (recipient's realtime handler triggers) — the event row is re-verified service-side so a forged call sends nothing; Resend missing = logged failed, inbox row already persisted
async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;
}

async function loadPrefs(userId: string): Promise<{ settings: Record<string, boolean>; digest: string }> {
  try {
    const db = await admin();
    const r = await db.from("swivv_notif_prefs").select("prefs,digest").eq("user_id", userId).maybeSingle();
    return { settings: (r.data?.prefs ?? {}) as Record<string, boolean>, digest: String(r.data?.digest ?? "daily") };
  } catch {
    return { settings: {}, digest: "daily" };
  }
}

async function claimSlot(key: string, userId: string, template: string): Promise<boolean> {
  try {
    const db = await admin();
    const r = await db.from("swivv_email_log").insert({ key, user_id: userId, template, status: "queued", attempts: 1 });
    return !r.error;
  } catch {
    return false;
  }
}

async function settle(key: string, ok: boolean): Promise<void> {
  try {
    const db = await admin();
    await db.from("swivv_email_log").update({ status: ok ? "sent" : "failed", sent_at: ok ? new Date().toISOString() : null }).eq("key", key);
  } catch {}
}

export const queueEventEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ kind: z.enum(["message", "like", "match"]), ref: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }: any) => {
    const uid: string = context.userId;
    const db = await admin();
    const cat = data.kind === "like" ? "liked" : data.kind === "match" ? "matches" : "messages";
    const prefs = await loadPrefs(uid);
    if (!emailAllowed(prefs.settings, cat as "messages" | "liked" | "matches")) return { sent: false, reason: "pref-off" };
    // Verify the event really involves the caller (no forged sends).
    let other = "";
    if (data.kind === "message") {
      const r = await db.from("swivv_chats").select("peer_id").eq("user_id", uid).eq("sender", "them").order("created_at", { ascending: false }).limit(50);
      const hit = (r.data ?? []).find((m: any) => String(m.peer_id) === data.ref || String(m.peer_id) === `u:${data.ref}` || data.ref === `u:${m.peer_id}`);
      if (!hit) return { sent: false, reason: "no-event" };
      other = String(hit.peer_id).replace(/^u:/, "");
    } else if (data.kind === "like") {
      const r = await db.from("swivv_likes").select("liker_id").eq("liker_id", data.ref).eq("liked_id", uid).maybeSingle();
      if (!r.data) return { sent: false, reason: "no-event" };
      other = data.ref;
    } else {
      const r = await db.from("swivv_matches").select("user_a,user_b").or(`user_a.eq.${uid},user_b.eq.${uid}`).limit(50);
      const hit = (r.data ?? []).find((m: any) => m.user_a === data.ref || m.user_b === data.ref);
      if (!hit) return { sent: false, reason: "no-event" };
      other = hit.user_a === uid ? hit.user_b : hit.user_a;
    }
    const key = emailKey(data.kind, other, Date.now());
    if (!(await claimSlot(key, uid, data.kind))) return { sent: false, reason: "duplicate" };
    const [to, name, otherName] = await Promise.all([getUserEmail(uid), getUserName(uid), getUserName(other)]);
    if (!to) {
      await settle(key, false);
      return { sent: false, reason: "no-email" };
    }
    const tpl =
      data.kind === "like"
        ? swivvNewLike({ name: name ?? "membre", likerName: otherName ?? "Quelqu'un" })
        : data.kind === "match"
          ? swivvNewMatch({ name: name ?? "membre", matchName: otherName ?? "Quelqu'un" })
          : swivvNewMessage({ name: name ?? "membre", senderName: otherName ?? "Quelqu'un", preview: previewForEmail("") });
    const ok = await sendEmail({ to, subject: tpl.subject, html: tpl.html });
    await settle(key, ok);
    return { sent: ok, reason: ok ? "sent" : "provider-failed" };
  });

export const queueDigestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({}).parse(d))
  .handler(async ({ context }: any) => {
    const uid: string = context.userId;
    const db = await admin();
    const prefs = await loadPrefs(uid);
    if (!emailAllowed(prefs.settings, "interactions")) return { sent: false, reason: "pref-off" };
    const last = await db.from("swivv_email_log").select("sent_at").eq("user_id", uid).eq("template", "digest").eq("status", "sent").order("sent_at", { ascending: false }).limit(1);
    const lastAt = last.data?.[0]?.sent_at ? Date.parse(last.data[0].sent_at) : null;
    if (!digestDue(lastAt, Date.now(), prefs.digest)) return { sent: false, reason: "too-soon" };
    const since = new Date(lastAt ?? Date.now() - 7 * 86400e3).toISOString();
    const likes = await db.from("swivv_likes").select("liker_id", { count: "exact", head: true }).eq("liked_id", uid).gte("created_at", since);
    const unread = await db.from("swivv_chats").select("msg_id", { count: "exact", head: true }).eq("user_id", uid).eq("sender", "them").gte("created_at", since);
    const nLikes: number = likes.count ?? 0;
    const nMsg: number = unread.count ?? 0;
    if (nLikes === 0 && nMsg === 0) return { sent: false, reason: "no-activity" };
    const key = emailKey("digest", uid, Date.now());
    if (!(await claimSlot(key, uid, "digest"))) return { sent: false, reason: "duplicate" };
    const [to, name] = await Promise.all([getUserEmail(uid), getUserName(uid)]);
    if (!to) {
      await settle(key, false);
      return { sent: false, reason: "no-email" };
    }
    const tpl = swivvActivityDigest({ name: name ?? "membre", likes: nLikes, messages: nMsg });
    const ok = await sendEmail({ to, subject: tpl.subject, html: tpl.html });
    await settle(key, ok);
    return { sent: ok, counts: { likes: nLikes, messages: nMsg } };
  });

export const sendSecurityEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ label: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }: any) => {
    const uid: string = context.userId;
    const key = emailKey("security", uid, Date.now());
    if (!(await claimSlot(key, uid, "security"))) return { sent: false, reason: "duplicate" };
    const [to, name] = await Promise.all([getUserEmail(uid), getUserName(uid)]);
    if (!to) {
      await settle(key, false);
      return { sent: false, reason: "no-email" };
    }
    const ok = await sendEmail({
      to,
      subject: "Sécurité de ton compte SWIVV MATCH",
      html: `<p>Bonjour ${name ?? "membre"},</p><p>${data.label}</p><p>Si ce n'était pas toi, contacte le support immédiatement depuis la page d'aide.</p>`,
    });
    await settle(key, ok);
    return { sent: ok };
  });
