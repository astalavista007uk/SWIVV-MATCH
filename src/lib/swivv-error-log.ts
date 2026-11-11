import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ponytail: one write per 10s per tab, message truncated, no tokens/bodies/personal data.
// Ceiling: no user attribution (user_id stays null) and anonymous writes are open to spam —
// upgrade to a security-definer RPC with a per-IP bucket if the table ever gets noisy.
let last = 0;

export function logClientError(message: string, source?: string) {
  const now = Date.now();
  if (now - last < 10000) return;
  last = now;
  try {
    void (supabase as any)
      .from("swivv_client_errors")
      .insert({
        message: String(message ?? "Erreur").slice(0, 500),
        source: source?.slice(0, 120) ?? null,
        url: location.pathname.slice(0, 200),
        user_id: null,
      })
      .then(() => {});
  } catch {}
}

/** Global net for script errors and rejected promises — mounted once at the root. */
export function useErrorLog() {
  useEffect(() => {
    const onErr = (e: ErrorEvent) => logClientError(e.message || "Erreur", e.filename);
    const onRej = (e: PromiseRejectionEvent) =>
      logClientError((e.reason as any)?.message ?? String(e.reason ?? "Rejet"), "promise");
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);
}
