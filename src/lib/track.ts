// Forward analytics events — fire-and-forget, never awaited, never blocks UX.
// ponytail: insert-own RLS only (no read for members) — history before swivv_events is reconstructed from created_at and labelled as such
import { supabase } from "@/integrations/supabase/client";

export function trackEvent(type: string, meta?: Record<string, unknown>): void {
  try {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      (supabase as any).from("swivv_events").insert({ user_id: data.user.id, type, meta: meta ?? {} }).then(() => {});
    }).catch(() => {});
  } catch {}
}
