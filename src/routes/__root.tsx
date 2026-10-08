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
import { Toaster } from "@/components/ui/sonner";
import { startChatSync } from "@/lib/swivv-store";
import { signOutSwivv, isEmailConfirmed } from "@/lib/swivv-auth";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go home
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
      { title: "SWIVV" },
      { name: "description", content: "SWIVV — rencontres façon marketplace." },
      { name: "theme-color", content: "#e91e63" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
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
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// ponytail: single global banner instead of per-page copies — shown while the e-mail is unverified (session or fresh-signup stash), hidden otherwise
// ponytail: re-checked per navigation, not just on auth change — the root never remounts on SPA nav, so a banner keyed on [loading, user] alone missed signups that keep the visitor logged out (the exact first-signup case); a storage event if same-tab writes ever need instant pickup
function VerifyBanner() {
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
      📩 Ton e-mail est en attente de confirmation — clique sur le lien reçu par e-mail pour activer
      ton compte.
    </p>
  );
}

function GatedOutlet() {
  const { restriction, loading, signOut } = useAuth();
  if (loading || !restriction) return <Outlet />;
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-medium text-[#333]">
          {restriction.status === "banned" ? "Compte banni" : "Compte suspendu"}
        </h1>
        <p className="mt-1 text-sm text-[#777]">
          {restriction.status === "banned"
            ? "Ton compte a été définitivement fermé pour non-respect du règlement."
            : `Ton compte est suspendu${restriction.until ? ` jusqu'au ${new Date(restriction.until).toLocaleString("fr-FR")}` : ""}.`}
          {" "}Tu peux contester via la page contact.
        </p>
        <button
          type="button"
          onClick={() => signOut()}
          className="mt-4 w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white"
        >
          Se déconnecter
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
      </AuthProvider>
    </QueryClientProvider>
  );
}
