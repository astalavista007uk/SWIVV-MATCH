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
export function useUnreadNotifs(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    let channel: { unsubscribe: () => void } | null = null;
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
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || !live) return;
      refresh(data.user.id);
      channel = supabase
        .channel(`swivv-notifs:${data.user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "swivv_notifications", filter: `user_id=eq.${data.user.id}` },
          () => refresh(data.user!.id),
        )
        .subscribe() as unknown as { unsubscribe: () => void };
    });
    return () => {
      live = false;
      channel?.unsubscribe();
    };
  }, []);
  return n;
}

export async function listNotifs(): Promise<SwivvNotif[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("swivv_notifications")
    .select("id,type,title,message,link,read,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as SwivvNotif[];
}

export async function markNotifsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("swivv_notifications").update({ read: true }).eq("user_id", user.id).in("id", ids);
}
