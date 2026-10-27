import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { startChatSync, pullMatchCriteria } from "@/lib/swivv-store";
import { initNotifyListeners, maybeRemindIncomplete } from "@/lib/swivv-notify";
import { catchUpNotifs } from "@/lib/notify.functions";
import { signOutSwivv, isEmailConfirmed } from "@/lib/swivv-auth";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { LangProvider, readLang, useDateLocale, useT } from "@/lib/i18n";

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
  head: () => ({
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
      { property: "og:locale", content: "fr_FR" },
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
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
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

// ponytail: single global banner instead of per-page copies — shown while the e-mail is unverified (session or fresh-signup stash), hidden otherwise
// ponytail: re-checked per navigation, not just on auth change — the root never remounts on SPA nav, so a banner keyed on [loading, user] alone missed signups that keep the visitor logged out (the exact first-signup case); a storage event if same-tab writes ever need instant pickup
function VerifyBanner() {
  const t = useT();
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (loading) return;
    if (!user) {
      try {
        setShow(!!localStorage.getItem("swivv-pending-profile"));
      } catch {
        setShow(false);
      }
      return;
    }
    isEmailConfirmed().then((c) => setShow(c === false));
  }, [loading, user, pathname]);
  if (!show) return null;
  return (
    <p className="bg-amber-100 px-4 py-2.5 text-center text-sm font-medium text-amber-900">
      ⚠️{" "}
      {t("Ton e-mail est en attente de confirmation — clique sur le lien reçu par e-mail pour activer ton compte.")}
    </p>
  );
}

function GatedOutlet() {
  const t = useT();
  const dateLocale = useDateLocale();
  const { restriction, loading, signOut } = useAuth();
  if (loading || !restriction) return <Outlet />;
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-medium text-[#333]">
          {restriction.status === "banned" ? t("Compte banni") : t("Compte suspendu")}
        </h1>
        <p className="mt-1 text-sm text-[#777]">
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
          onClick={() => signOut()}
          className="mt-4 w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white"
        >
          {t("Se déconnecter")}
        </button>
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    document.body.style.visibility = "visible";
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
        <VerifyBanner />
        <main id="main-content">
          <GatedOutlet />
        </main>
        <Toaster />
        <Analytics />
      </AuthProvider>
    </QueryClientProvider>
  );
}
