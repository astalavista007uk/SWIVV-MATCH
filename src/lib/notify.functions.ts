import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getUserEmail, getUserIdentity, getUserName, sendEmail, type EmailResult } from "@/lib/email";
import { swivvActivityDigest, swivvNewLike, swivvNewMatch, swivvNewMessage, swivvNewRequest } from "@/lib/swivv-email-templates";
import { CHAT_CD, LIKE_WINDOW, MATCH_WIN, REACT_CD, VIEW_CD, digestDue, emailAllowed, emailKey, latestBy, previewForEmail } from "@/lib/swivv-notify.logic";

// ponytail: caller == recipient always (recipient's realtime handler triggers) — the event row is re-verified service-side so a forged call sends nothing; SMTP missing = logged failed, inbox row already persisted
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
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
  // ponytail: same key + same window = no double-send (concurrent claims race on the PK, loser sees queued/sent and skips); a FAILED row may be reclaimed exactly once per retry (attempts counts it) — a delivery webhook if retries ever need exactly-once proof
  try {
    const db = await admin();
    const r = await db.from("swivv_email_log").insert({ key, user_id: userId, template, status: "queued", attempts: 1 });
    if (!r.error) return true;
    const cur = await db.from("swivv_email_log").select("status,attempts").eq("key", key).maybeSingle();
    if (cur.data?.status !== "failed") return false;
    const back = await db.from("swivv_email_log").update({ status: "queued", attempts: (cur.data.attempts ?? 1) + 1, error: null }).eq("key", key).eq("status", "failed");
    return !back.error;
  } catch {
    return false;
  }
}

async function settle(key: string, r: EmailResult): Promise<void> {
  try {
    const db = await admin();
    await db.from("swivv_email_log").update({
      status: r.ok ? "sent" : "failed",
      sent_at: r.ok ? new Date().toISOString() : null,
      provider_id: r.ok ? r.id : null,
      error: r.ok ? null : r.error,
    }).eq("key", key);
  } catch {}
}

export const queueEventEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ kind: z.enum(["message", "like", "match"]), ref: z.string().min(1).max(80) }).parse(d))
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
    const [to, name, sender] = await Promise.all([getUserEmail(uid), getUserName(uid), getUserIdentity(other)]);
    if (!to) {
      await settle(key, { ok: false, error: "no-email" });
      return { sent: false, reason: "no-email" };
    }
    const tpl =
      data.kind === "like"
        ? swivvNewLike({ name: name ?? "membre", likerName: sender.name })
        : data.kind === "match"
          ? swivvNewMatch({ name: name ?? "membre", matchName: sender.name })
          : swivvNewMessage({ name: name ?? "membre", senderName: sender.name, senderPhoto: sender.photo, preview: previewForEmail("") });
    const r = await sendEmail({ to, subject: tpl.subject, html: tpl.html });
    await settle(key, r);
    return { sent: r.ok, reason: r.ok ? "sent" : "provider-failed" };
  });

// ponytail: sender-triggered (unlike social events, the recipient may be offline) — the request row is re-verified service-side so a forged id sends nothing
export const emailRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }: any) => {
    const uid: string = context.userId;
    const db = await admin();
    const row = await db.from("swivv_message_requests").select("sender_id,recipient_id,status,created_at").eq("id", data.requestId).maybeSingle();
    if (!row.data || row.data.sender_id !== uid || row.data.status !== "pending") return { sent: false, reason: "no-event" };
    // ponytail: a stale replay must not email — one day is far beyond the send flow
    if (Date.now() - Date.parse(row.data.created_at) > 86400e3) return { sent: false, reason: "stale" };
    const recipient = String(row.data.recipient_id);
    const prefs = await loadPrefs(recipient);
    if (!emailAllowed(prefs.settings, "messages")) return { sent: false, reason: "pref-off" };
    const key = `request:${data.requestId}`;
    if (!(await claimSlot(key, recipient, "request"))) return { sent: false, reason: "duplicate" };
    const [to, name, sender] = await Promise.all([getUserEmail(recipient), getUserName(recipient), getUserIdentity(uid)]);
    if (!to) {
      await settle(key, { ok: false, error: "no-email" });
      return { sent: false, reason: "no-email" };
    }
    const tpl = swivvNewRequest({ name, senderName: sender.name, senderPhoto: sender.photo });
    const r = await sendEmail({ to, subject: tpl.subject, html: tpl.html });
    await settle(key, r);
    return { sent: r.ok, reason: r.ok ? "sent" : "provider-failed" };
  });

// ponytail: no cron in this stack — the digest goes out on the first login after the interval,
// and only when there was real activity. Upgrade: pg_cron/edge function for scheduled delivery.
export const sendDigestIfDue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({}).parse(d))
  .handler(async ({ context }: any) => {
    const uid: string = context.userId;
    const db = await admin();
    const prefs = await loadPrefs(uid);
    if (!emailAllowed(prefs.settings, "interactions")) return { sent: false, reason: "pref-off" };
    const now = Date.now();
    const last = await db.from("swivv_email_log").select("sent_at").eq("user_id", uid).eq("template", "digest").eq("status", "sent").order("sent_at", { ascending: false }).limit(1);
    const lastAt = last.data?.[0]?.sent_at ? Date.parse(last.data[0].sent_at) : null;
    if (!digestDue(lastAt, now, prefs.digest)) return { sent: false, reason: "not-due" };
    const winMs = prefs.digest === "weekly" ? 7 * 86400e3 : 86400e3;
    const since = new Date(now - winMs).toISOString();
    const [likes, messages] = await Promise.all([
      db.from("swivv_likes").select("*", { count: "exact", head: true }).eq("liked_id", uid).gte("created_at", since),
      db.from("swivv_chats").select("*", { count: "exact", head: true }).eq("user_id", uid).eq("sender", "them").gte("created_at", since),
    ]);
    const likesN = likes.count ?? 0;
    const messagesN = messages.count ?? 0;
    if (!likesN && !messagesN) return { sent: false, reason: "no-activity" };
    const key = emailKey("digest", uid, now);
    if (!(await claimSlot(key, uid, "digest"))) return { sent: false, reason: "duplicate" };
    const [to, name] = await Promise.all([getUserEmail(uid), getUserName(uid)]);
    if (!to) {
      await settle(key, { ok: false, error: "no-email" });
      return { sent: false, reason: "no-email" };
    }
    const tpl = swivvActivityDigest({ name, likes: likesN, messages: messagesN });
    const r = await sendEmail({ to, subject: tpl.subject, html: tpl.html });
    await settle(key, r);
    return { sent: r.ok, reason: r.ok ? "sent" : "provider-failed" };
  });

// ponytail: login catch-up for events missed while offline (realtime handlers only fire live) — bell rows only, no emails; one row per actor per window, same cooldowns as the live path
const CATCH_LOOKBACK = 7 * 86400e3;

export const catchUpNotifs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({}).parse(d))
  .handler(async ({ context }: any) => {
    const uid: string = context.userId;
    const db = await admin();
    const prefs = await loadPrefs(uid);
    const on = { messages: prefs.settings.rtMessages !== false, liked: prefs.settings.rtLiked !== false, viewed: prefs.settings.rtViewed !== false, reactions: prefs.settings.rtReactions !== false };
    const since = new Date(Date.now() - CATCH_LOOKBACK).toISOString();
    const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
    let blocked = new Set<string>();
    // ponytail: either direction suppresses catch-up rows (I blocked them or they blocked me) — same union the UI uses
    try {
      const b = await db.from("swivv_blocks").select("blocker_id,blocked_id").or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`);
      blocked = new Set(((b.data ?? []) as any[]).map((r: any) => String(r.blocker_id === uid ? r.blocked_id : r.blocker_id)));
    } catch {}
    const counts = { message: 0, like: 0, match: 0, view: 0, reaction: 0 };
    const recent = async (type: string, frag: string, winMs: number): Promise<boolean> => {
      try {
        const r = await db.from("swivv_notifications").select("id").eq("user_id", uid).eq("type", type).gte("created_at", ago(winMs)).like("link", `%${frag}%`).limit(1);
        return (r.data ?? []).length > 0;
      } catch {
        return true;
      }
    };
    const add = async (type: keyof typeof counts, title: string, message: string, link: string) => {
      try {
        const r = await db.from("swivv_notifications").insert({ user_id: uid, type, title, message, link });
        if (!r.error) counts[type]++;
      } catch {}
    };
    const nameOf = async (id: string): Promise<string> => {
      try {
        const r = await db.from("swivv_profiles").select("data").eq("user_id", id).maybeSingle();
        return (r.data?.data?.name as string) || "Quelqu'un";
      } catch {
        return "Quelqu'un";
      }
    };
    if (on.messages) {
      const r = await db.from("swivv_chats").select("peer_id,peer_name,audio_url,image_url,created_at").eq("user_id", uid).eq("sender", "them").gte("created_at", since).order("created_at", { ascending: false }).limit(200);
      for (const m of latestBy((r.data ?? []) as any[], (x) => String(x.peer_id), (x) => Date.parse(x.created_at))) {
        const bare = String(m.peer_id).replace(/^u:/, "");
        if (!bare || bare === uid || blocked.has(bare)) continue;
        if (await recent("message", bare, CHAT_CD)) continue;
        const kind = (m as any).audio_url ? "vocal" : (m as any).image_url ? "photo" : null;
        const title = kind === "vocal" ? "Nouveau message vocal" : kind === "photo" ? "Nouvelle photo" : "Nouveau message";
        const body = kind === "vocal" ? `${m.peer_name || "Quelqu'un"} t'a envoyé un message vocal.` : kind === "photo" ? `${m.peer_name || "Quelqu'un"} t'a envoyé une photo.` : `${m.peer_name || "Quelqu'un"} t'a écrit.`;
        await add("message", title, body, `/messagerie?peer=${m.peer_id}`);
      }
    }
    if (on.liked) {
      const like = await db.from("swivv_likes").select("liker_id,created_at").eq("liked_id", uid).gte("created_at", since).order("created_at", { ascending: false }).limit(200);
      const match = await db.from("swivv_matches").select("user_a,user_b,created_at").or(`user_a.eq.${uid},user_b.eq.${uid}`).gte("created_at", since).order("created_at", { ascending: false }).limit(200);
      for (const l of latestBy((like.data ?? []) as any[], (x) => String(x.liker_id), (x) => Date.parse(x.created_at))) {
        const id = String(l.liker_id);
        if (id === uid || blocked.has(id)) continue;
        if (await recent("like", id, LIKE_WINDOW)) continue;
        await add("like", "Nouveau like", `${await nameOf(id)} s'intéresse à ton profil.`, `/member/${id}`);
      }
      for (const m of latestBy((match.data ?? []) as any[], (x) => (x.user_a === uid ? String(x.user_b) : String(x.user_a)), (x) => Date.parse(x.created_at))) {
        const other = m.user_a === uid ? String(m.user_b) : String(m.user_a);
        if (!other || blocked.has(other)) continue;
        if (await recent("match", other, MATCH_WIN)) continue;
        await add("match", "C'est un match !", `Toi et ${await nameOf(other)} vous êtes plu.`, `/messagerie?match=${other}`);
      }
    }
    if (on.viewed) {
      const r = await db.from("swivv_profile_views").select("viewer_id,created_at").eq("viewed_id", uid).gte("created_at", since).order("created_at", { ascending: false }).limit(200);
      for (const v of latestBy((r.data ?? []) as any[], (x) => String(x.viewer_id), (x) => Date.parse(x.created_at))) {
        const id = String(v.viewer_id);
        if (id === uid || blocked.has(id)) continue;
        if (await recent("view", id, VIEW_CD)) continue;
        await add("view", "Visite de profil", `${await nameOf(id)} a consulté ton profil.`, `/member/${id}`);
      }
    }
    if (on.reactions) {
      const me = await db.from("swivv_profiles").select("data").eq("user_id", uid).maybeSingle();
      const photos = ((me.data?.data?.photos ?? []) as string[]);
      if (photos.length > 0) {
        const r = await db.from("swivv_photo_reactions").select("reactor_id,photo,created_at").eq("owner_id", uid).gte("created_at", since).order("created_at", { ascending: false }).limit(200);
        for (const x of latestBy((r.data ?? []) as any[], (y) => String(y.reactor_id), (y) => Date.parse(y.created_at))) {
          const id = String(x.reactor_id);
          if (id === uid || blocked.has(id) || !photos.includes(String(x.photo))) continue;
          if (await recent("reaction", id, REACT_CD)) continue;
          await add("reaction", "Réaction à ta photo", "Un membre a réagi à l'une de tes photos.", `/statistiques?tab=likes`);
        }
      }
    }
    return { caughtUp: counts };
  });

// ponytail: the BLOCKED member is never told (revealing it leaks the blocker's act); only the blocker gets a private confirmation — bell row only, no email
export const blockPing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ target: z.string().uuid(), action: z.enum(["blocked", "unblocked"]) }).parse(d))
  .handler(async ({ data, context }: any) => {
    const uid: string = context.userId;
    if (data.target === uid) return { sent: false, reason: "self" };
    const db = await admin();
    const row = await db.from("swivv_blocks").select("blocker_id").eq("blocker_id", uid).eq("blocked_id", data.target).maybeSingle();
    if (data.action === "blocked" && !row.data) return { sent: false, reason: "no-block" };
    if (data.action === "unblocked" && row.data) return { sent: false, reason: "still-blocked" };
    const t = await db.from("swivv_profiles").select("data").eq("user_id", data.target).maybeSingle();
    const name = (t.data?.data?.name as string) || "Ce membre";
    const done = data.action === "blocked"
      ? await db.from("swivv_notifications").insert({ user_id: uid, type: "info", title: "Membre bloqué", message: `${name} ne peut plus te contacter ni voir ton profil.` })
      : await db.from("swivv_notifications").insert({ user_id: uid, type: "info", title: "Blocage levé", message: `La communication avec ${name} est de nouveau possible.` });
    return { sent: !done.error };
  });

export const sendSecurityEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ label: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }: any) => {
    const uid: string = context.userId;
    const key = emailKey("security", uid, Date.now());
    if (!(await claimSlot(key, uid, "security"))) return { sent: false, reason: "duplicate" };
    const [to, name] = await Promise.all([getUserEmail(uid), getUserName(uid)]);
    if (!to) {
      await settle(key, { ok: false, error: "no-email" });
      return { sent: false, reason: "no-email" };
    }
    const r = await sendEmail({
      to,
      subject: "Sécurité de ton compte SWIVV MATCH",
      html: `<p>Bonjour ${esc(name ?? "membre")},</p><p>${esc(data.label)}</p><p>Si ce n'était pas toi, contacte le support immédiatement depuis la page d'aide.</p>`,
    });
    await settle(key, r);
    return { sent: r.ok };
  });
