import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSettings, isBlockedId, isThreadBlocked, setSetting, type SwivvSettings } from "@/lib/swivv-store";
import { CHAT_CD, LIKE_WINDOW, MATCH_WIN, REACT_CD, validLink, VIEW_CD, windowElapsed } from "./swivv-notify.logic";
import { reactionOf } from "./swivv-reactions";
import { queueEventEmail } from "./notify.functions";

// ponytail: recipient-scoped creation only (live realtime handler + login catch-up server fn — senders can never write someone else's inbox) — a push/cron worker replaces the realtime channels if they ever prove flaky
export type NotifType = "message" | "like" | "match" | "view" | "reaction" | "account" | "security" | "info";

export async function pingSelf(type: NotifType, title: string, message: string, link?: string): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return false;
    const safeLink = link && validLink(link) ? link : null;
    const { error } = await (supabase as any).from("swivv_notifications").insert({ user_id: uid, type, title, message, link: safeLink });
    return !error;
  } catch {
    return false;
  }
}

// --- server prefs (localStorage stays as offline fallback) ---
export async function loadServerPrefs(): Promise<{ settings: SwivvSettings; marketing: boolean; digest: string }> {
  const local = getSettings();
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return { settings: local, marketing: false, digest: "daily" };
    const row = await (supabase as any).from("swivv_notif_prefs").select("prefs,marketing,digest").eq("user_id", uid).maybeSingle();
    if (!row.data) return { settings: local, marketing: false, digest: "daily" };
    return { settings: { ...local, ...(row.data.prefs ?? {}) }, marketing: !!row.data.marketing, digest: String(row.data.digest ?? "daily") };
  } catch {
    return { settings: local, marketing: false, digest: "daily" };
  }
}

export async function saveServerPrefs(settings: SwivvSettings, marketing: boolean, digest: string): Promise<void> {
  for (const [k, v] of Object.entries(settings)) setSetting(k as keyof SwivvSettings, v as boolean);
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return;
    await (supabase as any).from("swivv_notif_prefs").upsert(
      { user_id: uid, prefs: settings, marketing, marketing_at: marketing ? new Date().toISOString() : null, digest, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  } catch {}
}

async function peerName(id: string): Promise<string> {
  try {
    const r = await (supabase as any).from("swivv_profiles").select("data").eq("user_id", id).maybeSingle();
    return (r.data?.data?.name as string) || "Quelqu'un";
  } catch {
    return "Quelqu'un";
  }
}

// --- event entry points (recipient context; pref-off = no row for that category) ---
// ponytail: links carry the actor id (?peer/?match/?react or /member/uuid) so live and catch-up rows dedupe on (type, link) — pre-upgrade rows without it may duplicate once
async function recentNotif(type: string, frag: string, winMs: number): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return true;
    const r = await (supabase as any).from("swivv_notifications").select("id").eq("user_id", uid).eq("type", type).gte("created_at", new Date(Date.now() - winMs).toISOString()).like("link", `%${frag}%`).limit(1);
    return (r.data ?? []).length > 0;
  } catch {
    return true;
  }
}
const cd = (k: string, win: number): boolean => {
  try {
    const now = Date.now();
    const all = JSON.parse(localStorage.getItem("swivv:notif-cd") ?? "{}") as Record<string, number>;
    if (!windowElapsed(all[k], now, win)) return false;
    all[k] = now;
    localStorage.setItem("swivv:notif-cd", JSON.stringify(all));
    return true;
  } catch {
    return true;
  }
};

export async function onIncomingChat(uid: string, peerId: string, kind?: "vocal" | "photo" | null): Promise<void> {
  if (!getSettings().rtMessages) return;
  if (isThreadBlocked(peerId)) return;
  if (!cd(`chat:${peerId}`, CHAT_CD)) return;
  const bare = peerId.replace(/^u:/, "");
  if (await recentNotif("message", bare, CHAT_CD)) return; // catch-up may have beaten us here
  const name = await peerName(bare);
  // ponytail: kind rides the realtime row (text is the default) — email keeps the fixed neutral preview by design
  const title = kind === "vocal" ? "Nouveau message vocal" : kind === "photo" ? "Nouvelle photo" : "Nouveau message";
  const body = kind === "vocal" ? `${name} t'a envoyé un message vocal.` : kind === "photo" ? `${name} t'a envoyé une photo.` : `${name} t'a écrit.`;
  await pingSelf("message", title, body, `/messagerie?peer=${peerId}`);
  void queueEventEmail({ data: { kind: "message", ref: peerId } }).catch(() => {});
}

/** Media kind of a chat row for bell copy: vocal wins over photo, text otherwise. */
export function chatMediaKind(row: { audio_url?: unknown; image_url?: unknown } | null | undefined): "vocal" | "photo" | null {
  if (!row) return null;
  if (row.audio_url) return "vocal";
  if (row.image_url) return "photo";
  return null;
}

export async function onLikeReceived(uid: string, likerId: string): Promise<void> {
  if (!getSettings().rtLiked) return;
  if (likerId === uid || isThreadBlocked(likerId)) return;
  if (await recentNotif("like", likerId, LIKE_WINDOW)) return;
  const name = await peerName(likerId);
  await pingSelf("like", "Nouveau like", `${name} s'intéresse à ton profil.`, `/member/${likerId}`);
  void queueEventEmail({ data: { kind: "like", ref: likerId } }).catch(() => {});
}

export async function onMatchFound(uid: string, otherId: string): Promise<void> {
  if (!getSettings().rtLiked) return; // ponytail: no separate match toggle — likes cover matches until one is asked for
  if (await recentNotif("match", otherId, MATCH_WIN)) return;
  const name = await peerName(otherId);
  await pingSelf("match", "C'est un match !", `Toi et ${name} vous êtes plu.`, `/messagerie?match=${otherId}`);
  void queueEventEmail({ data: { kind: "match", ref: otherId } }).catch(() => {});
}

export async function onViewReceived(uid: string, viewerId: string): Promise<void> {
  if (!getSettings().rtViewed) return;
  if (viewerId === uid || isBlockedId(viewerId)) return;
  try {
    const since = new Date(Date.now() - VIEW_CD).toISOString();
    const r = await (supabase as any).from("swivv_notifications").select("id").eq("user_id", uid).eq("type", "view").gte("created_at", since).like("link", `%${viewerId}%`).limit(1);
    if ((r.data ?? []).length > 0) return;
  } catch {}
  const name = await peerName(viewerId);
  await pingSelf("view", "Visite de profil", `${name} a consulté ton profil.`, `/member/${viewerId}`);
}

export async function onReactionReceived(uid: string, reactorId: string, photo: string, emoji: string): Promise<void> {
  // ponytail: anonymous by design (names stay out of reaction pings) + ownership re-verified (forged owner_id never notifies) — no email, in-app only
  if (!getSettings().rtReactions) return;
  if (reactorId === uid || isBlockedId(reactorId)) return;
  if (!cd(`react:${reactorId}`, REACT_CD)) return;
  if (await recentNotif("reaction", reactorId, REACT_CD)) return;
  try {
    const r = await (supabase as any).from("swivv_profiles").select("data").eq("user_id", uid).maybeSingle();
    const photos = (r.data?.data?.photos ?? []) as string[];
    if (!photos.includes(photo)) return;
  } catch {
    return;
  }
  await pingSelf("reaction", "Réaction à ta photo", `${emoji} Un membre a réagi à l'une de tes photos.`, `/statistiques?tab=likes`);
}

export async function onVerified(): Promise<void> {  await pingSelf("account", "Profil vérifié", "Ton profil a été vérifié. Bravo !", "/mon-profil");
}

export async function onSecurityEvent(label: string): Promise<void> {
  await pingSelf("security", "Sécurité du compte", label, "/parametres");
}

/** One profile-completeness nudge per 7 days while the profile is unfinished (login hook, not a cron). */
export async function maybeRemindIncomplete(): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return;
    // ponytail: dynamic imports (swivv-auth never imports this module back) — static import would cycle via swivv-store
    const [{ profileCompleteness, getMyRawProfile }] = [await import("@/lib/swivv-auth")];
    const prof = await getMyRawProfile();
    if (profileCompleteness(prof) >= 100) return;
    const since = new Date(Date.now() - 7 * 86400e3).toISOString();
    const r = await (supabase as any).from("swivv_notifications").select("id").eq("user_id", uid).eq("type", "info").like("link", "%/mon-profil%").gte("created_at", since).limit(1);
    if ((r.data ?? []).length > 0) return;
    await (supabase as any).from("swivv_notifications").insert({ user_id: uid, type: "info", title: "Complète ton profil", message: "Un profil complet reçoit plus de visites. Ajoute ce qui manque.", link: "/mon-profil" });
  } catch {}
}

// --- realtime wiring (one call per session, next to startChatSync in __root) ---
export function initNotifyListeners(): () => void {
  let channels: { unsubscribe: () => void }[] = [];
  let stopped = false;
  void supabase.auth.getSession().then(({ data }) => {
    const uid = data.session?.user.id;
    if (!uid || stopped) return;
    const mk = (table: string, filter: string | undefined, cb: (row: any) => void) => {
      try {
        const ch = (supabase as any).channel(`swivv-notify-${table}:${uid}`).on(
          "postgres_changes",
          filter ? { event: "INSERT", schema: "public", table, filter } : { event: "INSERT", schema: "public", table },
          (p: { new: unknown }) => {
            try {
              void Promise.resolve(cb(p.new as any)).catch(() => {});
            } catch {}
          },
          // ponytail: quiet retry on channel errors (unpublished table pre-migration, blips) — loud alerts if realtime ever becomes critical path
        ).subscribe((status: string) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            try {
              console.debug(`[swivv] notify channel ${table}: ${status}`);
            } catch {}
          }
        });
        channels.push({ unsubscribe: () => void (supabase as any).removeChannel(ch) });
      } catch {}
    };
    mk("swivv_chats", `user_id=eq.${uid}`, (row) => {
      if (row?.sender === "them" && row?.peer_id) void onIncomingChat(uid, String(row.peer_id), chatMediaKind(row));
    });
    mk("swivv_likes", `liked_id=eq.${uid}`, (row) => {
      if (row?.liker_id && row.liker_id !== uid) void onLikeReceived(uid, String(row.liker_id));
    });
    // ponytail: RLS already limits match/view rows to mine, so unfiltered channels stay correct — add eq filters if realtime ever delivers beyond RLS
    mk("swivv_matches", undefined, (row) => {
      if (!row) return;
      const other = row.user_a === uid ? row.user_b : row.user_a;
      if (other) void onMatchFound(uid, String(other));
    });
    mk("swivv_profile_views", `viewed_id=eq.${uid}`, (row) => {
      if (row?.viewer_id && row.viewer_id !== uid) void onViewReceived(uid, String(row.viewer_id));
    });
    mk("swivv_photo_reactions", `owner_id=eq.${uid}`, (row) => {
      if (row?.reactor_id && row.reactor_id !== uid && row?.photo)
        void onReactionReceived(uid, String(row.reactor_id), String(row.photo), reactionOf(String(row.reaction))?.emoji ?? "❤️");
    });
    // ponytail: service rows (block events, admin, security) toast on arrival — social rows stay badge-only or every like would ping
    mk("swivv_notifications", `user_id=eq.${uid}`, (row) => {
      if (row && ["info", "account", "security"].includes(String(row.type)) && row.title) toast(String(row.title));
    });
  });
  return () => {
    stopped = true;
    channels.forEach((c) => c.unsubscribe());
    channels = [];
  };
}
