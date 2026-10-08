import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearSwivvLocal } from "@/lib/swivv-store";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  restriction: { status: string; until: string | null } | null;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, restriction: null, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [restriction, setRestriction] = useState<AuthCtx["restriction"]>(null);

  // ponytail: client-side gate only (a hostile client can ignore it) — RLS deny policy on swivv_* reads when lockout must survive devtools
  useEffect(() => {
    const uid = session?.user.id;
    if (!uid) {
      setRestriction(null);
      return;
    }
    supabase
      .from("swivv_user_status")
      .select("status,until")
      .eq("user_id", uid)
      .maybeSingle()
      .then(({ data }: any) => {
        const st = data?.status as string | undefined;
        if (st !== "suspended" && st !== "banned") {
          setRestriction(null);
          return;
        }
        if (st === "suspended" && data.until && new Date(data.until).getTime() <= Date.now()) {
          // ponytail: expired suspensions self-clear so the admin list stays truthful — server cron if exact expiry timing ever matters
          void supabase.from("swivv_user_status").delete().eq("user_id", uid);
          setRestriction(null);
          return;
        }
        setRestriction({ status: st, until: data.until ?? null });
      });
  }, [session?.user.id]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      // ponytail: locals are per-account — a new signup in the same browser otherwise inherits the old profile's likes/criteria; one-time wipe is safe because the server repopulates on boot
      try {
        const uid = s?.user.id ?? "";
        if (uid !== (localStorage.getItem("swivv-uid") ?? "")) {
          // ponytail: keep the confirm-pending signup data when it belongs to the incoming account (same e-mail) — wiping it vaporized pre-confirm answers on first login
          let keepSignup = false;
          try {
            const em = (s?.user.email ?? "").toLowerCase();
            const d = JSON.parse(localStorage.getItem("swivv-signup-draft") ?? "null") as { f?: { email?: string } } | null;
            keepSignup = !!em && (d?.f?.email ?? "").toLowerCase() === em;
          } catch {}
          clearSwivvLocal();
          for (const k of ["swivv-seeking", "swivv-avatar", "swivv-ephemeral", "swivv-signup-gender", ...(keepSignup ? [] : ["swivv-pending-profile", "swivv-signup-draft"])]) localStorage.removeItem(k);
          if (uid) localStorage.setItem("swivv-uid", uid);
          else localStorage.removeItem("swivv-uid");
        }
      } catch {}
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      // ponytail: server-check the session once per load — a server-deleted account otherwise haunts the app as logged-in with no profile
      if (data.session) {
        supabase.auth.getUser().then(async ({ error }) => {
          if (!error || typeof (error as { status?: unknown }).status !== "number") return;
          // ponytail: stale access token after sleep/offline blip — one refresh before calling it a dead account; sign out only if refresh fails too
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) void forceSignOut();
        });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        restriction,
        signOut: forceSignOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

/** Best-effort server logout, then guaranteed local wipe + reload.
 *  GoTrue skips local cleanup when POST /logout fails (e.g. no dev proxy),
 *  which silently bricked logout on every device. */
// ponytail: wipe+reload instead of surgical notify — revisit if logout must preserve SPA state
export async function forceSignOut(): Promise<void> {
  const timeout = (ms: number) => new Promise<null>((r) => setTimeout(() => r(null), ms));
  await Promise.race([supabase.auth.signOut(), timeout(4000)]).catch(() => null);
  await Promise.race([supabase.auth.signOut({ scope: "local" }), timeout(4000)]).catch(() => null);
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) localStorage.removeItem(k);
    }
  } catch {
    /* storage unavailable */
  }
  window.location.assign("/");
}
