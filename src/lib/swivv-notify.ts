import { supabase } from "@/integrations/supabase/client";
import { getBlocked, getSettings, setSetting, type SwivvSettings } from "@/lib/swivv-store";
import { CHAT_CD, REACT_CD, validLink, VIEW_CD, windowElapsed } from "./swivv-notify.logic";
import { reactionOf } from "./swivv-reactions";
import { queueEventEmail } from "./notify.functions";

// ponytail: recipient-side creation only (senders can never write someone else's inbox — RLS own-INSERT) — a push/cron worker replaces the realtime channels if they ever prove flaky
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

export async function onIncomingChat(uid: string, peerId: string): Promise<void> {
  if (!getSettings().rtMessages) return;
  if (!cd(`chat:${peerId}`, CHAT_CD)) return;
  const name = await peerName(peerId.replace(/^u:/, ""));
  await pingSelf("message", "Nouveau message", `${name} t'a écrit.`, "/messagerie");
  void queueEventEmail({ data: { kind: "message", ref: peerId } }).catch(() => {});
}

export async function onLikeReceived(uid: string, likerId: string): Promise<void> {
  if (!getSettings().rtLiked) return;
  if (likerId === uid) return;
  const name = await peerName(likerId);
  await pingSelf("like", "Nouveau like", `${name} s'intéresse à ton profil.`, `/member/${likerId}`);
  void queueEventEmail({ data: { kind: "like", ref: likerId } }).catch(() => {});
}

export async function onMatchFound(uid: string, otherId: string): Promise<void> {
  if (!getSettings().rtLiked) return; // ponytail: no separate match toggle — likes cover matches until one is asked for
  const name = await peerName(otherId);
  await pingSelf("match", "C'est un match !", `Toi et ${name} vous êtes plu.`, "/messagerie");
  void queueEventEmail({ data: { kind: "match", ref: otherId } }).catch(() => {});
}

export async function onViewReceived(uid: string, viewerId: string): Promise<void> {
  if (!getSettings().rtViewed) return;
  if (viewerId === uid || getBlocked().includes(viewerId)) return;
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
  if (reactorId === uid || getBlocked().includes(reactorId)) return;
  if (!cd(`react:${reactorId}`, REACT_CD)) return;
  try {
    const r = await (supabase as any).from("swivv_profiles").select("data").eq("user_id", uid).maybeSingle();
    const photos = (r.data?.data?.photos ?? []) as string[];
    if (!photos.includes(photo)) return;
  } catch {
    return;
  }
  await pingSelf("reaction", "Réaction à ta photo", `${emoji} Un membre a réagi à l'une de tes photos.`, "/statistiques");
}

export async function onVerified(): Promise<void> {  await pingSelf("account", "Profil vérifié", "Ton profil a été vérifié. Bravo !", "/mon-profil");
}

export async function onSecurityEvent(label: string): Promise<void> {
  await pingSelf("security", "Sécurité du compte", label, "/parametres");
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
      if (row?.sender === "them" && row?.peer_id) void onIncomingChat(uid, String(row.peer_id));
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
  });
  return () => {
    stopped = true;
    channels.forEach((c) => c.unsubscribe());
    channels = [];
  };
}
