import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SwivvLogo } from "@/components/swivv-logo";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/reset")({
  component: ResetPage,
});

type Phase = "checking" | "ready" | "invalid" | "done";

function ResetPage() {
  const t = useT();
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) setPhase("ready");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (live) setPhase(data.session ? "ready" : "invalid");
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setErr(t("Mot de passe : 8 caractères minimum."));
      return;
    }
    if (password !== confirm) {
      setErr(t("La confirmation du mot de passe ne correspond pas."));
      return;
    }
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setErr(t("Impossible de mettre à jour le mot de passe. Demande un nouveau lien."));
      return;
    }
    setPhase("done");
    setTimeout(() => nav({ to: "/" }), 1800);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 text-[#333]">
        <Link to="/" aria-label="SWIVV MATCH">
          <SwivvLogo />
        </Link>
        <h1 className="mt-3 text-xl font-medium">{t("Réinitialise ton mot de passe")}</h1>

        {phase === "checking" && <p className="mt-3 text-sm text-[#5c5c66]">{t("Vérification du lien…")}</p>}

        {phase === "invalid" && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-[#5c5c66]">{t("Ce lien de réinitialisation a expiré ou n'est pas valide.")}</p>
            <Link
              to="/"
              className="block w-full rounded-md bg-[#e60050] px-4 py-3 text-center font-medium text-white"
            >
              {t("Demander un nouveau lien")}
            </Link>
          </div>
        )}

        {phase === "ready" && (
          <form onSubmit={submit} className="mt-3 space-y-3">
            <p className="text-sm text-[#5c5c66]">{t("Choisis un nouveau mot de passe.")}</p>
            <div>
              <label htmlFor="reset-password" className="mb-1 block text-sm font-medium">
                {t("Ton nouveau mot de passe")}
              </label>
              <input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder={t("Nouveau mot de passe (8 caractères min)")}
                className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#6b6b73] focus:outline-none focus:ring-2 focus:ring-[#e60050]"
              />
            </div>
            <div>
              <label htmlFor="reset-confirm" className="mb-1 block text-sm font-medium">
                {t("Confirme le nouveau mot de passe")}
              </label>
              <input
                id="reset-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-md border border-border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e60050]"
              />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white disabled:opacity-60"
            >
              {t("Enregistrer")}
            </button>
          </form>
        )}

        {phase === "done" && <p className="mt-3 text-sm text-[#2f7d32]">{t("Mot de passe mis à jour.")}</p>}
      </div>
    </div>
  );
}
