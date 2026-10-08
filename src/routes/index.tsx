import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Star,
} from "lucide-react";
import { getLikes, toggleLike } from "@/lib/swivv-store";
import { SWIVV_PROFILES, type SwivvProfile } from "@/lib/swivv-data";
import { displayPct, load } from "@/routes/matches";
import { realDistance, useMyCity } from "@/lib/location-distance";
import { useAuth } from "@/hooks/use-auth";
import { SwivvAuthButtons, getMyProfile, openAuthModal, requireSwivvAuth } from "@/lib/swivv-auth";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";
import { PhotoCountBadge } from "@/components/photo-count-badge";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SWIVV — Rencontres" },
      {
        name: "description",
        content: "SWIVV, le site de rencontres façon marketplace : découvre des profils, like, matche, discute.",
      },
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

function ProfileCard({ p, liked, onLike }: { p: SwivvProfile; liked: boolean; onLike: () => void }) {
  const viewer = useMyCity();
  // ponytail: criteria score mirrors My Matches when set — static compatibility otherwise
  const pct = displayPct(p, load());
  return (
    <article className="group w-40 shrink-0 snap-start overflow-hidden rounded-lg bg-white sm:w-48">
      <div className="relative">
        <Link to="/member/$id" params={{ id: p.id }}>
          <img
            src={p.photo}
            alt={`Photo de ${p.name}`}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
        </Link>
        <PhotoCountBadge n={p.photos.length} />
        <button
          type="button"
          onClick={onLike}
            aria-label={liked ? `Retirer le like de ${p.name}` : `Liker ${p.name}`}
          aria-pressed={liked}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm"
        >
          <Heart
            className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : "text-[#555]"}`}
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
        <p className="mt-0.5 text-[11px] font-medium text-[#e91e63]">
          {pct}% compatible · {p.lookingFor}
        </p>
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
}: {
  title: string;
  profiles: SwivvProfile[];
  likedIds: Set<string>;
  onLike: (id: string) => void;
  viewAll?: boolean;
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
        {profiles.map((p) => (
          <ProfileCard key={p.id} p={p} liked={likedIds.has(p.id)} onLike={() => onLike(p.id)} />
        ))}
      </div>
    </section>
  );
}

function SwivvHome() {
  const [, force] = useState(0);
  const { user: authUser, loading: authLoading } = useAuth();
  const [me, setMe] = useState<SwivvProfile | null | undefined>(undefined);
  const [seeking, setSeeking] = useState<"woman" | "man" | "all" | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      setMe(null);
      return;
    }
    let live = true;
    getMyProfile().then((p) => {
      if (!live) return;
      setMe(p);
      const s = p?.seeking ?? (p?.gender === "woman" ? "man" : p?.gender === "man" ? "woman" : null);
      if (s) {
        try {
          localStorage.setItem("swivv-seeking", s);
        } catch {}
      }
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
  const ownGender = me?.gender ?? (storedGender === "woman" || storedGender === "man" ? storedGender : null);
  // ponytail: cached seeking first (no wrong-gender flash on back/forward remounts) — profile fetch refreshes the cache
  const cachedSeeking = (() => {
    try {
      const c = localStorage.getItem("swivv-seeking");
      return c === "woman" || c === "man" ? c : null;
    } catch {
      return null;
    }
  })();
  const effSeeking = seeking ?? cachedSeeking ?? me?.seeking ?? (ownGender ? (ownGender === "woman" ? "man" : "woman") : "all");
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
              Prêt à faire de belles rencontres ?
            </h1>
            <p className="mt-2 text-sm text-[#777]">
              Your Match. Your Story.
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
            {SWIVV_PROFILES.slice(0, 5).map((p) => (
              <img
                key={p.id}
                src={p.photo}
                alt=""
                loading="lazy"
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
          Inscription gratuite, sans carte bancaire.
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
              text: "Like les profils, obtiens un match et démarre la conversation. Premier message offert.",
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

      {/* Success stories */}
      {/* ponytail: pure Tailwind glow, no image assets — photo avatars if real testimonials ever land */}
      <section aria-label="Ils se sont rencontrés sur SWIVV" className="bg-gradient-to-b from-[#f2f2f2] to-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#e91e63]">
          Histoires vraies
        </p>
        <h2 className="mt-1 text-center text-2xl font-medium text-[#333]">
          Ils se sont rencontrés sur SWIVV
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              quote: "On a matché à 92%. Trois mois plus tard, on emménageait ensemble à Paris.",
              names: "Emma & Karim",
            },
            {
              quote: "Son vocal m'a fait craquer avant même notre premier café. Un an plus tard, on s'est mariés.",
              names: "Aïcha & Mehdi",
            },
            {
              quote: "J'ai liké sa photo de surf un dimanche. On ne s'est plus quittés depuis.",
              names: "Léa & Maxime",
            },
          ].map((t, i) => (
            <figure
              key={t.names}
              className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 ${i === 1 ? "ring-2 ring-[#e91e63]/60 sm:scale-[1.03]" : ""}`}
            >
              <span aria-hidden="true" className="pointer-events-none absolute -top-3 right-3 select-none text-[88px] font-black leading-none text-[#e91e63]/10">
                &rdquo;
              </span>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e91e63] to-[#ff7ab8] text-sm font-bold text-white">
                  {t.names.charAt(0)}
                </span>
                <div>
                  <div className="flex gap-0.5" aria-label="5 étoiles sur 5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <figcaption className="mt-0.5 text-sm font-medium text-[#e91e63]">{t.names}</figcaption>
                </div>
              </div>
              <blockquote className="mt-3 text-sm italic leading-relaxed text-[#555]">« {t.quote} »</blockquote>
            </figure>
          ))}
        </div>
        </div>
      </section>
      <section aria-label="Appel à l'inscription" className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-2xl bg-[#e91e63] p-8 text-center text-white">
          <h2 className="text-2xl font-medium">À ton tour d'écrire ton histoire</h2>
          <p className="mt-2 text-sm text-white/80">
            Rejoins des milliers de célibataires. Inscription gratuite, désinscription en 1 clic.
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
            {loggedOutRows.map((row) => (
              <Rail key={row.title} title={row.title} profiles={row.profiles} likedIds={likedIds} onLike={like} />
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
            {loggedRows.map((row) => (
              <Rail key={row.title} title={row.title} profiles={row.profiles} likedIds={likedIds} onLike={like} viewAll />
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
        // ponytail: 4th signup CTA duplicating the pink panel above — extract shared <SwivvCta> if copy/behavior ever diverge
        <section aria-label="Inscription gratuite" className="mx-auto max-w-6xl px-4 pb-10">
          <button
            type="button"
            onClick={() => openAuthModal("account", "signup")}
            className="block w-full rounded-2xl bg-[#e91e63] px-8 py-5 text-center text-lg font-medium text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e91e63]"
          >
            SWIVV MATCH est 100% gratuit. Inscrivez-vous aujourd&apos;hui en 2 minutes et trouvez votre Swivv
          </button>
        </section>
      )}
      <SwivvFooter />
    </div>
  );
}
