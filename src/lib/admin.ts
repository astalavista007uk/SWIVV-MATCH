import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type StaffRole = "super_admin" | "admin" | "moderator" | "support" | "analyst";

// ponytail: single rank table mirrors staff_level() in SQL — bump both if roles change
export const ROLE_LEVEL: Record<StaffRole, number> = {
  super_admin: 100,
  admin: 80,
  moderator: 50,
  support: 30,
  analyst: 10,
};

export async function getMyRole(): Promise<StaffRole | null> {  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  let best: StaffRole | null = null;
  for (const r of data ?? []) {
    const role = (r as { role: string }).role as StaffRole;
    if (ROLE_LEVEL[role] != null && (best == null || ROLE_LEVEL[role] > ROLE_LEVEL[best])) best = role;
  }
  return best;
}

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<StaffRole | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    getMyRole().then((r) => {
      setRole(r);
      setLoading(false);
    });
  }, [authLoading, user?.id]);
  return { role, loading, level: role ? ROLE_LEVEL[role] : 0 };
}

// ponytail: fire-and-forget audit (never blocks the action it records) — await it if ordering ever matters
export function audit(action: string, target_kind?: string, target_id?: string, metadata?: Record<string, any>) {
  supabase.auth.getUser().then(({ data }) => {
    if (!data.user) return;
    void supabase.from("swivv_audit_log").insert({
      actor_id: data.user.id,
      action,
      target_kind: target_kind ?? null,
      target_id: target_id ?? null,
      metadata: metadata ?? {},
    });
  });
}
