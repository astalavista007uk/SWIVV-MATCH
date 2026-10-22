import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SwivvNotif = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

// ponytail: fetch-on-mount plus realtime INSERT bump (header remounts every navigation anyway) — full row sync if badges ever need exact server counts mid-session
async function myUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
export function useUnreadNotifs(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const refresh = (userId: string) => {
      void supabase
        .from("swivv_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false)
        .then(({ count }) => {
          if (live) setN(count ?? 0);
        });
    };
    myUid().then(async (uid) => {
      if (!uid || !live) return;
      refresh(uid);
      const topic = `swivv-notifs:${uid}`;
      // ponytail: channel() reuses the same topic — drop a StrictMode/HMR leftover or .on() throws "after subscribe()"
      for (const c of supabase.getChannels()) if (c.topic === `realtime:${topic}`) await supabase.removeChannel(c);
      if (!live) return;
      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "swivv_notifications", filter: `user_id=eq.${uid}` },
          () => refresh(uid),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "swivv_notifications", filter: `user_id=eq.${uid}` },
          () => refresh(uid),
        )
        .subscribe();
    });
    return () => {
      live = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);
  return n;
}

export async function listNotifs(limit = 50, offset = 0): Promise<SwivvNotif[]> {
  const uid = await myUid();
  if (!uid) return [];
  const { data, error } = await supabase
    .from("swivv_notifications")
    .select("id,type,title,message,link,read,created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  // ponytail: throw (don't empty-list) so the page can show a real error state — callers catch
  if (error) throw new Error(error.message);
  return (data ?? []) as SwivvNotif[];
}

export async function markNotifsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("swivv_notifications").update({ read: true }).eq("user_id", user.id).in("id", ids);
}

export async function deleteNotif(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("swivv_notifications").delete().eq("user_id", user.id).eq("id", id);
}
