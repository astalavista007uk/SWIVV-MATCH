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

// ponytail: member notice on restriction (Module 13) — in-app copy, never fraud thresholds or reporter details
export function notifySuspended(userId: string, reason: string) {
  supabase.auth.getUser().then(() => {
    void (supabase as any).from("swivv_notifications").insert({
      user_id: userId, type: "warning", title: "Compte restreint",
      message: `Ton compte est suspendu 7 jours (${reason}). Tu peux contester via le support.`.slice(0, 300),
    }).then(() => {});
  }).catch(() => {});
}

// ponytail: evaluation log stores refs + categories only (never bodies/images) —
// reviewers' decisions and fraud case openings write here; providers fill confidence later
export function logEvaluation(e: {
  account_ref?: string | null; content_ref?: string | null; content_type: string;
  category: string; severity?: string; method?: string; recommended?: string;
  action_taken?: string | null; approval_required?: boolean;
}) {
  try {
    void (supabase as any).from("swivv_mod_evaluations").insert({
      account_ref: e.account_ref ?? null, content_ref: e.content_ref ?? null,
      content_type: e.content_type, category: e.category, severity: e.severity ?? "info",
      method: e.method ?? "rule", recommended: e.recommended ?? null,
      action_taken: e.action_taken ?? null, approval_required: e.approval_required ?? true,
    }).then(() => {});
  } catch {}
}
// ponytail: opts write outcome/severity/reason/correlation columns when provided (migration 20261017000000);
// pre-migration rows read defaults; callers without opts are unchanged
export function audit(action: string, target_kind?: string, target_id?: string, metadata?: Record<string, any>, opts?: { outcome?: string; severity?: string; reason?: string; correlation?: string }) {
  supabase.auth.getUser().then(({ data }) => {
    if (!data.user) return;
    void (supabase as any).from("swivv_audit_log").insert({
      actor_id: data.user.id,
      action,
      target_kind: target_kind ?? null,
      target_id: target_id ?? null,
      metadata: metadata ?? {},
      ...(opts?.outcome ? { outcome: opts.outcome } : {}),
      ...(opts?.severity ? { severity: opts.severity } : {}),
      ...(opts?.reason ? { reason: opts.reason } : {}),
      ...(opts?.correlation ? { correlation: opts.correlation } : {}),
    });
  });
}
