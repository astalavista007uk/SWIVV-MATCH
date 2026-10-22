import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Heart,
  Mic,
  ImageIcon,
  BadgeCheck,
  UserPlus,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getLikes, getSettings, setSetting, subscribe, toggleLike, isNativeApp } from "@/lib/swivv-store";
import { SWIVV_PROFILES, type SwivvProfile } from "@/lib/swivv-data";
import { displayPct, load, MatchLoginPrompt } from "@/lib/match-score";
import { realDistance, useMyCity } from "@/lib/location-distance";
import { useAuth } from "@/hooks/use-auth";
import { SwivvAuthButtons, getMyBasics, openAuthModal, requireSwivvAuth } from "@/lib/swivv-auth";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";
import { PhotoCountBadge } from "@/components/photo-count-badge";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { ldJson, pageHead, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    ...pageHead(
      "SWIVV MATCH — Site de rencontres gratuit, sans carte bancaire",
      "Rencontres gratuites et sans carte bancaire : crée ton profil en 2 minutes, découvre des profils compatibles, like, matche et discute. Relation sérieuse, mariage ou belle histoire.",
      "/",
    ),
    scripts: [
      ldJson({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: "SWIVV MATCH",
            url: SITE_URL,
            logo: `${SITE_URL}/swivv-match-logo-transparent.png`,
            email: "contact@swivvmatch.com",
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: "SWIVV MATCH",
            url: SITE_URL,
            inLanguage: "fr-FR",
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
        ],
      }),
    ],
  }),
  component: SwivvHome,
});



function SwivvHeader() {
  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
    </>
  );
}

function ProfileCard({ p, liked, onLike, eager }: { p: SwivvProfile; liked: boolean; onLike: () => void; eager?: boolean }) {
  const viewer = useMyCity();
  const { user, loading: authLoading } = useAuth();
  // ponytail: criteria come from localStorage — SSR and the hydration pass both use the static fallback, then the saved criteria apply
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // ponytail: criteria score mirrors My Matches when set — static compatibility otherwise
  const pct = displayPct(p, mounted ? load() : {});
  // ponytail: likes live in localStorage — the server has none, so keep the button neutral through hydration
  const isLiked = mounted && liked;
  return (
    <article className="group w-40 shrink-0 snap-start overflow-hidden rounded-lg bg-white sm:w-48">
      <div className="relative">
        <Link to="/member/$id" params={{ id: p.id }}>
          <img
            src={p.photo}
            alt={`Photo de ${p.name}`}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            className="aspect-[4/5] w-full object-cover"
          />
        </Link>
        <PhotoCountBadge n={p.photos.length} />
        <button
          type="button"
          onClick={onLike}
            aria-label={isLiked ? `Retirer le like de ${p.name}` : `Liker ${p.name}`}
          aria-pressed={isLiked}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm"
        >
          <Heart
            className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-[#555]"}`}
          />
        </button>
        {p.online && (
          <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-medium text-white">
            En ligne
          </span>
        )}
      </div>
      <Link to="/member/$id" params={{ id: p.id }} className="block p-2.5">
        <p className="flex items-center gap-1 text-[15px] font-medium text-[#333]">
          {p.name}, {p.age}
          {p.verified && <BadgeCheck className="h-3.5 w-3.5 text-[#e91e63]" />}
        </p>
        <p className="text-[13px] text-[#999]">
          {p.city} · {realDistance(viewer.city, viewer.country, p)} km
        </p>
        <p className="text-[12px] text-[#999]">
          Membre depuis le{" "}
          {new Date(p.joinedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-[#555]">{p.tagline}</p>
        {authLoading || user ? (
          <p className="mt-0.5 text-[11px] font-medium text-[#e91e63]">
            {pct}% compatible · {p.lookingFor}
          </p>
        ) : (
          <MatchLoginPrompt name={p.name} className="mt-0.5" />
        )}
      </Link>
    </article>
  );
}

function Rail({
  title,
  profiles,
  likedIds,
  onLike,
  viewAll,
  eager,
}: {
  title: string;
  profiles: SwivvProfile[];
  likedIds: Set<string>;
  onLike: (id: string) => void;
  viewAll?: boolean;
  eager?: boolean;
}) {
  if (profiles.length === 0) return null;
  return (
    <section aria-label={title} className="mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-[#333]">{title}</h2>
        {viewAll && (
          <Link
            to="/browse"
            search={{ q: title, type: "", location: "" }}
            className="text-sm font-medium text-[#e91e63] hover:underline"
          >
            View All
          </Link>
        )}
      </div>
      <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {/* ponytail: only the first 3 cards preload — the whole rail marked eager pushed 10+ high-priority image requests and hurt LCP */}
        {profiles.map((p, i) => (
          <ProfileCard key={p.id} p={p} liked={likedIds.has(p.id)} onLike={() => onLike(p.id)} eager={eager && i < 3} />
        ))}
      </div>
    </section>
  );
}

// ponytail: both store listings 404 today — flip APPS_PUBLISHED and swap the real IDs once the apps ship
const APPS_PUBLISHED = false;
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.swivvmatch";
const APP_STORE_URL = "https://apps.apple.com/app/swivv-match/id0000000000";

function StoreButton({
  href,
  sub,
  label,
  children,
}: {
  href: string;
  sub: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${sub} ${label}`}
      className="flex flex-1 items-center justify-center gap-3 rounded-xl bg-black px-4 py-2.5 text-white transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e91e63]"
    >
      <span className="shrink-0" aria-hidden="true">
        {children}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wide text-white/70">{sub}</span>
        <span className="text-base font-medium">{label}</span>
      </span>
    </a>
  );
}

function AppDownloadSection({ onDismiss }: { onDismiss?: () => void } = {}) {
  // ponytail: UA sniff for the image link (iOS vs Android) — a real detector is overkill; desktop falls back to Play
  const [storeHref, setStoreHref] = useState(PLAY_STORE_URL);
  useEffect(() => {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) setStoreHref(APP_STORE_URL);
  }, []);
  return (
    <section aria-label="Télécharger l'application" className="w-full bg-[#F7F7F8] py-10">
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 md:grid-cols-2">
        <a
          href={storeHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Télécharger l'application SWIVV MATCH"
          className="mx-auto block w-full max-w-md rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e91e63]"
        >
          <img
            src="/swivv-match-download.png"
            alt="Aperçu de l'application SWIVV MATCH sur mobile"
            loading="lazy"
            className="w-full rounded-xl transition hover:brightness-105"
          />
        </a>
        <div>
          <h2 className="text-2xl font-medium text-[#333]">SWIVV MATCH dans ta poche</h2>
          <p className="mt-2 text-sm text-[#777]">
            Emporte tes matchs partout et commence à Swivver en quelques secondes.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("account", "signup")}
            className="mt-5 w-full rounded-md bg-[#e91e63] px-6 py-3 font-medium text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e91e63]"
          >
            Commence à Swivver
          </button>
          <div className="mt-6 flex w-full flex-wrap gap-3">
            <StoreButton href={PLAY_STORE_URL} sub="Disponible sur" label="Google Play">
              <svg viewBox="0 0 466 511.98" className="h-7 w-7">
                <path
                  fill="#EA4335"
                  d="M199.9 237.8 1.4 470.17c7.22 24.57 30.16 41.81 55.8 41.81 11.16 0 20.93-2.79 29.3-8.37l244.16-139.46L199.9 237.8z"
                />
                <path
                  fill="#FBBC04"
                  d="m433.91 205.1-104.65-60-111.61 110.22 113.01 108.83 104.64-58.6c18.14-9.77 30.7-29.3 30.7-50.23-1.4-20.93-13.95-40.46-32.09-50.22z"
                />
                <path
                  fill="#34A853"
                  d="M199.42 273.45 329.27 145.1 87.9 8.37C79.53 2.79 68.36 0 57.2 0 30.7 0 6.98 18.14 1.4 41.86l198.02 231.59z"
                />
                <path
                  fill="#4285F4"
                  d="M1.39 41.86C0 46.04 0 51.63 0 57.2v397.64c0 5.57 0 9.76 1.4 15.34l216.27-214.86L1.39 41.86z"
                />
              </svg>
            </StoreButton>
            <StoreButton href={APP_STORE_URL} sub="Télécharger sur" label="App Store">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
            </StoreButton>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="mt-4 text-sm font-medium text-[#777] underline transition hover:text-[#333]"
            >
              Déjà téléchargé ? Ne plus afficher
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function SwivvHome() {
  const [, force] = useState(0);
  // ponytail: repaint when the boot criteria pull adopts a newer server copy — percentages read localStorage
  useEffect(() => subscribe(() => force((x) => x + 1)), []);
  const { user: authUser, loading: authLoading } = useAuth();
  const [me, setMe] = useState<{ city: string; country: string } | null>(null);
  const [seeking, setSeeking] = useState<"woman" | "man" | "all" | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      setMe(null);
      return;
    }
    let live = true;
    // ponytail: one basics fetch (seeking+city, no photo megabytes) — the full profile never lands here; city only feeds distance sort
    getMyBasics().then((b) => {
      if (!live) return;
      if (b.seeking) setSeeking(b.seeking);
      setMe({ city: b.city, country: b.country });
    });
    return () => {
      live = false;
    };
  }, [authLoading, authUser]);

  const filtered = SWIVV_PROFILES;
  const likedIds = new Set(getLikes());
  const like = (id: string) =>
    requireSwivvAuth("like", () => {
      toggleLike(id);
      force((x) => x + 1);
    });

  const loggedOutRows = [
    { title: "Femmes", profiles: filtered.filter((p) => p.gender === "woman") },
    { title: "Hommes", profiles: filtered.filter((p) => p.gender === "man") },
  ];

  // ponytail: seeking = saved preference, else opposite gender, else all — Photos récentes sorts by join date (no photo timestamps in seed)
  const storedGender = (() => {
    try {
      return localStorage.getItem("swivv-signup-gender");
    } catch {
      return null;
    }
  })();
  const ownGender = storedGender === "woman" || storedGender === "man" ? storedGender : null;
  // ponytail: cached seeking first (no wrong-gender flash on back/forward remounts) — profile fetch refreshes the cache
  const cachedSeeking = (() => {
    try {
      const uid = localStorage.getItem("swivv-uid");
      const mine = uid ? localStorage.getItem(`swivv-seeking:${uid}`) : null;
      if (mine === "woman" || mine === "man") return mine;
      const c = localStorage.getItem("swivv-seeking");
      return c === "woman" || c === "man" ? c : null;
    } catch {
      return null;
    }
  })();
  const effSeeking = seeking ?? cachedSeeking ?? (ownGender ? (ownGender === "woman" ? "man" : "woman") : "all");
  const base = effSeeking === "all" ? filtered : filtered.filter((p) => p.gender === effSeeking);
  const dist = (p: SwivvProfile) => realDistance(me?.city, me?.country, p);
  const loggedRows = [
    { title: "Près de moi", profiles: [...base].sort((a, b) => dist(a) - dist(b)).slice(0, 8) },
    { title: "En ligne", profiles: base.filter((p) => p.online) },
    { title: "Nouveaux profils", profiles: base.filter((p) => p.isNew) },
    { title: "Mariage", profiles: base.filter((p) => p.lookingFor.includes("Mariage")) },
    { title: "Relation sérieuse", profiles: base.filter((p) => p.lookingFor.includes("Relation sérieuse")) },
    { title: "Photos récentes", profiles: [...base].sort((a, b) => (b.joinedAt ?? "").localeCompare(a.joinedAt ?? "")).slice(0, 8) },
    { title: "Profils populaires", profiles: [...base].sort((a, b) => b.compatibility - a.compatibility).slice(0, 8) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SwivvHeader />

      {!authUser && (
      <>
      <section className="relative overflow-hidden bg-[#e8ded3]">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 md:grid-cols-[380px_1fr] md:py-16">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-[32px] font-medium leading-tight text-[#333]">
              Fais de belles rencontres, gratuitement
            </h1>
            <p className="mt-2 text-sm text-[#777]">
              SWIVV MATCH, le site de rencontres gratuit et sans carte bancaire. Your Match. Your
              Story.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("account", "signup")}
              className="mt-6 block w-full rounded-md bg-[#e91e63] px-4 py-3 text-center font-medium text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e91e63]"
            >
              Commencez à Swivver
            </button>
            <Link
              to="/comment-ca-marche"
              className="mt-4 block text-center text-[#e91e63]"
            >
              Découvrir comment ça marche
            </Link>
          </div>
          <div className="hidden gap-4 md:flex" aria-hidden="true">
            {SWIVV_PROFILES.slice(0, 5).map((p, i) => (
              <img
                key={p.id}
                src={p.photo}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                className="h-44 w-32 rounded-xl object-cover shadow-sm"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section aria-label="SWIVV en chiffres" className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 text-center sm:grid-cols-4">
          {[
            ["100%", "Gratuit"],
            ["∞", "Possibilités de rencontres"],
            ["♥", "Des profils à découvrir"],
            ["0 €", "Pour commencer"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="text-2xl font-black text-[#e91e63]">{n}</p>
              <p className="text-sm text-[#777]">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How signup works */}
      <section aria-label="Comment s'inscrire" className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-center text-2xl font-medium text-[#333]">
          Rejoins SWIVV en 2 minutes
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#777]">
          Compte gratuit en 2 minutes, sans carte bancaire — complète ton profil à ton rythme.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: <UserPlus className="h-6 w-6 text-[#e91e63]" />,
              step: "Étape 1",
              title: "Crée ton profil",
              text: "Photos, bio, centres d'intérêt, intention : sérieux, mariage ou belle histoire.",
            },
            {
              icon: <HeartHandshake className="h-6 w-6 text-[#e91e63]" />,
              step: "Étape 2",
              title: "Découvre des compatibles",
              text: "Score de compatibilité, filtres par âge, ville, religion et centres d'intérêt.",
            },
            {
              icon: <MessageCircle className="h-6 w-6 text-[#e91e63]" />,
              step: "Étape 3",
              title: "Like, matche, discute",
              text: "Écris librement à qui te plaît : messages sans match, vocaux et photos entre matchs.",
            },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl border border-[#e91e63]/10 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e91e63] to-[#ff7ab8] text-white shadow-sm [&_svg]:text-white">
                {s.icon}
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#e91e63]">{s.step}</p>
              <h3 className="mt-1 font-medium text-[#333]">{s.title}</h3>
              <p className="mt-2 text-sm text-[#777]">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => openAuthModal("account", "signup")}
            className="inline-block rounded-md bg-[#e91e63] px-8 py-3 font-medium text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e91e63]"
          >
            Commencez à Swivver!
          </button>
        </div>
      </section>

      {/* How matching works */}
      {/* ponytail: pure Tailwind depth (gradient + borders + hover lift), no motion lib — framer-motion if scroll-triggered animation ever needed */}
      <section aria-label="Comment fonctionne le matching" className="bg-gradient-to-b from-[#f2f2f2] to-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-center text-2xl font-medium text-[#333]">
            Un matching qui a du sens
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#777]">
            On te montre d'abord les personnes vraiment compatibles.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Sparkles className="h-5 w-5 text-[#e91e63]" />,
                title: "Score de compatibilité",
                text: "Ville, âge, intérêts, religion, langues et intentions : chaque profil affiche son %.",
              },
              {
                icon: <BadgeCheck className="h-5 w-5 text-[#e91e63]" />,
                title: "Profils vérifiés",
                text: "Badge vérifié, photos réelles uniquement. Ni cartoons, ni illustrations.",
              },
              {
                icon: <Heart className="h-5 w-5 text-[#e91e63]" />,
                title: "Intentions claires",
                text: "Mariage, relation sérieuse ou belle histoire : tu sais ce que chacun cherche.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5 text-[#e91e63]" />,
                title: "Sécurité d'abord",
                text: "Signale un abus en 1 clic, conseils de sécurité et modération active.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e91e63]/10 [&_svg]:text-[#e91e63]">
                  {f.icon}
                </div>
                <h3 className="mt-3 font-medium text-[#333]">{f.title}</h3>
                <p className="mt-1 text-sm text-[#777]">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calls & voice notes */}
      <section aria-label="Appels et messages vocaux" className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-center text-2xl font-medium text-[#333]">
          Entends sa voix avant le premier rendez-vous
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#777]">
          Réservés aux matchs : quand l'intérêt est réciproque, passe du texte à la voix.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: <ImageIcon className="h-5 w-5 text-[#e91e63]" />,
              title: "Partage de photos",
              text: "Envoie des photos depuis la conversation. Signale et télécharge en 1 clic — la modération examine chaque signalement.",
            },
            {
              icon: <Mic className="h-5 w-5 text-[#e91e63]" />,
              title: "Messages vocaux",
              text: "Enregistre un vocal depuis la conversation et envoie-le comme un message. Écoutable sur téléphone et ordinateur.",
            },
          ].map((f) => (
            // ponytail: flat dark card, no per-card theme prop — map over a theme array if a third variant ever appears
            <div key={f.title} className="rounded-2xl border border-white/10 bg-[#2b2b2e] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-black [&_svg]:text-black">
                {f.icon}
              </div>
              <h3 className="mt-3 font-medium text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-white/70">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Appel à l'inscription" className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-2xl bg-[#e91e63] p-8 text-center text-white">
          <h2 className="text-2xl font-medium">À ton tour d'écrire ton histoire</h2>
          <p className="mt-2 text-sm text-white/80">
            Rejoins SWIVV MATCH et écris ta propre histoire. Inscription gratuite, désinscription
            en 1 clic.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("account", "signup")}
            className="mt-5 inline-block rounded-md bg-white px-8 py-3 font-medium text-[#e91e63] transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Je m'inscris gratuitement
          </button>
        </div>
      </section>
      </>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">
        {!authUser ? (
          <>
            {loggedOutRows.map((row, i) => (
              <Rail key={row.title} title={row.title} profiles={row.profiles} likedIds={likedIds} onLike={like} eager={i === 0} />
            ))}
          </>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-2">
              <span className="text-sm font-medium text-[#333]">Je recherche :</span>
              <div className="flex overflow-hidden rounded-md border border-border text-sm" role="group" aria-label="Filtrer par genre">
                {(["all", "woman", "man"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSeeking(g)}
                    aria-pressed={effSeeking === g}
                    className={`px-3 py-1.5 ${effSeeking === g ? "bg-[#e91e63] text-white" : "bg-white text-[#555]"}`}
                  >
                    {g === "all" ? "Tous" : g === "woman" ? "Femmes" : "Hommes"}
                  </button>
                ))}
              </div>
            </div>
            {loggedRows.map((row, i) => (
              <Rail key={row.title} title={row.title} profiles={row.profiles} likedIds={likedIds} onLike={like} viewAll eager={i === 0} />
            ))}
            {loggedRows.every((row) => row.profiles.length === 0) && (
              <p className="mt-2 text-sm text-[#777]">
                Aucun profil trouvé. Essaie un autre genre.
              </p>
            )}
          </>
        )}
      </main>
      {!authUser && (
        <>
          {/* ponytail: 4th signup CTA duplicating the pink panel above — extract shared <SwivvCta> if copy/behavior ever diverge */}
          <section aria-label="Inscription gratuite" className="mx-auto max-w-6xl px-4 pb-10">
            <button
              type="button"
              onClick={() => openAuthModal("account", "signup")}
              className="block w-full rounded-2xl bg-[#e91e63] px-8 py-5 text-center text-lg font-medium text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e91e63]"
            >
              SWIVV MATCH est 100% gratuit. Crée ton compte en 2 minutes et complète ton profil à ton rythme
            </button>
          </section>
          {APPS_PUBLISHED && <AppDownloadSection />}
        </>
      )}
      {APPS_PUBLISHED && authUser && !getSettings().appPromoDismissed && !isNativeApp() && (
        <AppDownloadSection
          onDismiss={() => {
            setSetting("appPromoDismissed", true);
            force((x) => x + 1);
          }}
        />
      )}
      <SwivvFooter />
    </div>
  );
}
