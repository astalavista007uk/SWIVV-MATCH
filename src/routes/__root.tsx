import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SwivvMatchPopup } from "@/components/swivv-match-popup";
import { SwivvRequestPopup, SwivvRequestAnswerPopup } from "@/components/swivv-request-popup";
import { startChatSync, pullMatchCriteria } from "@/lib/swivv-store";
import { initNotifyListeners, maybeRemindIncomplete } from "@/lib/swivv-notify";
import { catchUpNotifs, sendDigestIfDue } from "@/lib/notify.functions";
import { signOutSwivv, isEmailConfirmed } from "@/lib/swivv-auth";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { LangProvider, OG_LOCALE, readLang, useDateLocale, useT } from "@/lib/i18n";
import { useErrorLog } from "@/lib/swivv-error-log";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("Page introuvable")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("Cette page n'existe pas ou a été déplacée.")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {t("Retour à l'accueil")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const lang = readLang();
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "SWIVV MATCH — Rencontres gratuites" },
        {
          name: "description",
          content:
            "SWIVV MATCH, site de rencontres gratuit et sans carte bancaire : profils, likes, matchs, messages, vocaux et photos.",
        },
        { name: "theme-color", content: "#e60050" },
        { property: "og:site_name", content: "SWIVV MATCH" },
        { property: "og:locale", content: OG_LOCALE[lang] },
        { property: "og:image", content: "https://swivvmatch.com/swivv-match-logo.jpg" },
        { property: "og:image:alt", content: "SWIVV MATCH" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: "https://swivvmatch.com/swivv-match-logo.jpg" },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "preconnect", href: "https://images.unsplash.com" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap",
        },
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        { rel: "manifest", href: "/manifest.json" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const lang = readLang();
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <LangProvider lang={lang}>{children}</LangProvider>
        <Scripts />
      </body>
    </html>
  );
}

// ponytail: hard gate, not a banner — while the server says the e-mail is unconfirmed, no route renders (GoTrue already refuses logins, this covers legacy/stale sessions)
function ConfirmEmailCard({ email, signOut }: { email: string; signOut: () => void }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function resend() {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth
      .resend({ type: "signup", email })
      .catch(() => ({ error: true as const }));
    setBusy(false);
    setMsg(
      error
        ? t("Envoi impossible pour le moment — vérifie ta connexion et réessaie.")
        : t("E-mail renvoyé ! Vérifie ta boîte de réception (et tes spams)."),
    );
  }
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-medium text-[#333]">{t("Confirme ton e-mail")}</h1>
        <p className="mt-2 text-sm text-[#5c5c66]">
          {t("Ton e-mail est en attente de confirmation — clique sur le lien reçu par e-mail pour activer ton compte.")}
        </p>
        <p className="mt-2 text-sm font-medium text-[#e60050]">{email}</p>
        <button
          type="button"
          onClick={resend}
          disabled={busy}
          className="mt-4 w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white disabled:opacity-60"
        >
          {busy ? t("Envoi…") : t("Renvoyer l'e-mail de confirmation")}
        </button>
        {msg && <p className="mt-2 text-sm text-[#333]">{msg}</p>}
        <button type="button" onClick={signOut} className="mt-3 w-full text-center text-sm text-[#5c5c66] underline">
          {t("Se déconnecter")}
        </button>
      </div>
    </div>
  );
}

function GatedOutlet() {
  const t = useT();
  const dateLocale = useDateLocale();
  const { restriction, loading, user, signOut } = useAuth();
  // ponytail: server verdict keyed by uid; only an explicit "false" blocks, so an unreachable auth server never bricks a valid session
  const [verdict, setVerdict] = useState<{ uid: string; ok: boolean } | null>(null);
  useEffect(() => {
    if (loading || !user) return;
    let live = true;
    isEmailConfirmed()
      .then((c) => {
        if (live) setVerdict({ uid: user.id, ok: c !== false });
      })
      .catch(() => null);
    return () => {
      live = false;
    };
  }, [loading, user]);
  // optimistic value from the stored session avoids a card flash on every reload; the server verdict corrects stale sessions
  const emailOk = user ? (verdict?.uid === user.id ? verdict.ok : !!user.email_confirmed_at) : true;
  if (loading) return <Outlet />;
  if (restriction) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-medium text-[#333]">
            {restriction.status === "banned" ? t("Compte banni") : t("Compte suspendu")}
          </h1>
          <p className="mt-1 text-sm text-[#5c5c66]">
            {restriction.status === "banned"
              ? t("Ton compte a été définitivement fermé pour non-respect du règlement.")
              : restriction.until
                ? t("Ton compte est suspendu jusqu'au {date}.", {
                    date: new Date(restriction.until).toLocaleString(dateLocale),
                  })
                : t("Ton compte est suspendu.")}{" "}
            {t("Tu peux contester via la page contact.")}
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white"
          >
            {t("Se déconnecter")}
          </button>
        </div>
      </div>
    );
  }
  if (user && !emailOk) return <ConfirmEmailCard email={user.email ?? ""} signOut={signOut} />;
  return <Outlet />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useErrorLog();

  useEffect(() => {
    document.body.style.visibility = "visible";
  }, []);

  // Recovery links can land on "/" when no redirect_to is set (e.g. admin-generated
  // links): forward them to the reset form, keeping the token in the hash/query.
  useEffect(() => {
    if (window.location.pathname === "/reset") return;
    const { search, hash } = window.location;
    if (hash.includes("type=recovery") || search.includes("type=recovery")) {
      window.location.replace(`/reset${search}${hash}`);
    }
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => startChatSync(), []);
  useEffect(() => initNotifyListeners(), []);
  // ponytail: one catch-up per tab session (dedupe makes reruns cheap, but once is enough — realtime covers the rest)
  useEffect(() => {
    try {
      if (sessionStorage.getItem("swivv-catchup")) return;
      sessionStorage.setItem("swivv-catchup", "1");
    } catch {}
    void catchUpNotifs({ data: {} }).catch(() => {});
    void sendDigestIfDue({ data: {} }).catch(() => {});
    void maybeRemindIncomplete().catch(() => {});
    // ponytail: one criteria pull per tab session — percentages/tooltips read localStorage, so every device converges on the newest save (notify repaints subscribers)
    void pullMatchCriteria().catch(() => {});
  }, []);

  // ponytail: "Rester connecté" unchecked = sign out on fresh browser starts (sessionStorage dies with the browser, localStorage doesn't)
  useEffect(() => {
    try {
      if (sessionStorage.getItem("swivv-booted")) return;
      sessionStorage.setItem("swivv-booted", "1");
      if (!localStorage.getItem("swivv-ephemeral")) return;
      localStorage.removeItem("swivv-ephemeral");
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) void signOutSwivv();
      });
    } catch {}
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <main id="main-content">
          <GatedOutlet />
        </main>
        <SwivvMatchPopup />
        <SwivvRequestPopup />
        <SwivvRequestAnswerPopup />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
