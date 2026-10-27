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
  BarChart3,
  Trophy,
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
import { useDateLocale, useLang, useT } from "@/lib/i18n";
import type { EnKey } from "@/lib/locales/en";

export const Route = createFileRoute("/")({
  head: () => ({
    ...pageHead(
      "SWIVV MATCH — Site de rencontres gratuit",
      "Rencontres gratuites : crée ton profil en 2 minutes, découvre des profils compatibles, like, matche et discute. Relation sérieuse, mariage ou belle histoire.",
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



// ponytail: hero wall — one card per profile (not per photo), 3 strips mobile / 6 desktop, CSS drift only (no fetch/state)
const HERO_CARDS = SWIVV_PROFILES.map((p, i) => ({ profile: p, src: p.photos[i % p.photos.length] }));
const HERO_COLUMNS = Array.from({ length: 6 }, (_, c) => HERO_CARDS.slice(c * 4, c * 4 + 4));
const HERO_FEATURED = SWIVV_PROFILES.slice(0, 6);

function HeroCardInfo({ p, compact }: { p: SwivvProfile; compact?: boolean }) {
  return (
    <div className={`absolute inset-x-2.5 bottom-2.5 text-white ${compact ? "" : "md:inset-x-3 md:bottom-3"}`}>
      <p className={`flex items-center gap-1 font-medium leading-tight ${compact ? "text-[11px]" : "text-sm"}`}>
        {p.name}, {p.age}
        {p.verified && (
          <BadgeCheck className={`text-[#ff7aa8] ${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
        )}
      </p>
      <p className={`text-white/70 ${compact ? "text-[9px]" : "text-[11px]"}`}>{p.city}</p>
      <p className="mt-1 flex flex-wrap gap-1">
        {p.interests.slice(0, 2).map((tag) => (
          <span key={tag} className={`rounded-full bg-white/15 px-2 py-0.5 ${compact ? "text-[8px]" : "text-[10px]"}`}>
            {tag}
          </span>
        ))}
      </p>
    </div>
  );
}

function HeroWallCard({ card }: { card: (typeof HERO_CARDS)[number] }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg md:rounded-xl">
      <img src={card.src} alt="" loading="lazy" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <HeroCardInfo p={card.profile} compact />
    </div>
  );
}


function HeroStorySlider({ profiles }: { profiles: SwivvProfile[] }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  // ponytail: one rAF flip so slide 1 also gets the slow zoom (a class change on mount wouldn't animate)
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setZoomed(true));
    return () => cancelAnimationFrame(r);
  }, []);
  // ponytail: 5s JS advance + 5s CSS bar — move the advance to onAnimationEnd if background-tab drift ever shows
  useEffect(() => {
    const t = setTimeout(() => setIndex((i) => (i + 1) % profiles.length), 5000);
    return () => clearTimeout(t);
  }, [index, profiles.length]);

  return (
    <div className="relative aspect-[3/4] w-full max-w-[360px]">
      {profiles.map((p, i) => (
        <div
          key={p.id}
          tabIndex={i === index ? 0 : -1}
          className={`group absolute inset-0 overflow-hidden rounded-3xl bg-[#101014] shadow-lg transition-opacity duration-500 ${
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <img
            src={p.photo}
            alt={t("Photo de {name}", { name: p.name })}
            loading="eager"
            fetchPriority={i === 0 ? "high" : undefined}
            className={`h-full w-full object-cover transition-transform duration-[5000ms] ease-linear motion-reduce:transition-none ${
              zoomed && i === index ? "scale-110" : "scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/45" />
          <span className="absolute left-3 top-9 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white">
            <ImageIcon className="h-3 w-3" />
            photo
          </span>
          <div className="absolute inset-x-3 bottom-3 text-white">
            <p className="flex items-center gap-1 text-lg font-bold leading-tight">
              {p.name}, {p.age}
              {p.verified && <BadgeCheck className="h-4 w-4 text-[#ff7aa8]" />}
            </p>
            <p className="text-xs text-white/70">{p.city}</p>
            <p className="mt-2 flex flex-wrap gap-1">
              {p.interests.slice(0, 2).map((tag) => (
                <span key={tag} className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
                  {tag}
                </span>
              ))}
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("account", "signin")}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-[#e60050] text-base font-bold text-white transition hover:brightness-110"
            >
              {t("S'inscrire | Se connecter")}
            </button>
          </div>
        </div>
      ))}
      <div className="absolute inset-x-3 top-3 z-10 flex gap-1.5">
        {profiles.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={t("Voir le profil {n}", { n: i + 1 })}
            aria-current={i === index}
            className="h-0.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/25"
          >
            <span
              key={`${i}-${index}`}
              className={`block h-full rounded-full bg-white ${
                i < index ? "w-full" : i === index ? "animate-[swivvStoryFill_5s_linear_forwards]" : "w-0"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ponytail: static slide copy, no fetch/state beyond the active index — move to CMS if marketing wants to edit it
const FEATURE_SLIDES: {
  icon: typeof UserPlus;
  title: EnKey;
  text: EnKey;
  items: { icon: typeof UserPlus; title: EnKey }[];
}[] = [
  {
    icon: UserPlus,
    title: "Rejoins SWIVV en 2 minutes",
    text: "Compte gratuit en 2 minutes — complète ton profil à ton rythme.",
    items: [
      { icon: UserPlus, title: "Crée ton profil" },
      { icon: HeartHandshake, title: "Découvre des compatibles" },
      { icon: MessageCircle, title: "Like, matche, discute" },
    ],
  },
  {
    icon: Sparkles,
    title: "Un matching qui a du sens",
    text: "On te montre d'abord les personnes vraiment compatibles.",
    items: [
      { icon: Sparkles, title: "Score de compatibilité" },
      { icon: BadgeCheck, title: "Profils vérifiés" },
      { icon: Heart, title: "Intentions claires" },
      { icon: ShieldCheck, title: "Sécurité d'abord" },
    ],
  },
  {
    icon: Mic,
    title: "Entends sa voix avant le premier rendez-vous",
    text: "Réservés aux matchs : quand l'intérêt est réciproque, passe du texte à la voix.",
    items: [
      { icon: ImageIcon, title: "Partage de photos" },
      { icon: Mic, title: "Messages vocaux" },
    ],
  },
  {
    icon: BarChart3,
    title: "Suis tes chiffres et ta progression",
    text: "Des repères concrets sur ton activité, sans classement ni pression.",
    items: [
      { icon: BarChart3, title: "Statistiques" },
      { icon: Trophy, title: "SWIVV Progress" },
    ],
  },
];

// ponytail: one tilted photo stack reused by every photo slide (seed shifts the picks); bespoke art only if the deck grows
function FeaturePhotos({ seed, voice }: { seed: number; voice?: boolean }) {
  const t = useT();
  const picks = [0, 1, 2].map((n) => HERO_FEATURED[(seed * 2 + n) % HERO_FEATURED.length]);
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[420px] md:h-[400px]">
      <div className="absolute inset-0 -rotate-[7deg]">
        {picks.map((p, i) => (
          <figure
            key={p.id}
            className="absolute overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
            style={{ left: `${i * 27}%`, top: `${[12, 0, 18][i]}%`, width: "46%", height: "80%", zIndex: 3 - i }}
          >
            <img src={p.photo} alt={t("Profil de {name}", { name: p.name })} loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <figcaption className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] font-semibold text-white">
              {p.name}, {p.age}
              {p.verified && <BadgeCheck className="h-3 w-3 text-[#ff7aa8]" />}
            </figcaption>
          </figure>
        ))}
      </div>
      {voice && (
        <div className="absolute bottom-2 left-0 z-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-[#101a2b]/95 px-3 py-2 shadow-xl">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e60050]">
            <Mic className="h-3.5 w-3.5 text-white" />
          </span>
          {[6, 12, 8, 16, 10, 14, 7, 11].map((h, i) => (
            <span key={i} className="w-0.5 rounded-full bg-white/60" style={{ height: h }} />
          ))}
          <span className="ml-1 text-[11px] text-white/70">0:12</span>
        </div>
      )}
    </div>
  );
}

// ponytail: CSS bars, no chart library — real data only if these ever leave the marketing deck
function FeatureChart() {
  const t = useT();
  const bars = [42, 68, 55, 88, 74, 96, 63];
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[420px] md:h-[400px]">
      <div className="absolute inset-0 -rotate-[5deg] rounded-3xl border border-white/10 bg-[#0b1420]/95 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e60050]">SWIVV MATCH</p>
          <span className="text-[10px] text-white/40">{t("7 derniers jours")}</span>
        </div>
        <div className="mt-4 flex h-32 items-end gap-1.5 md:h-40">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#e60050]/30 to-[#e60050]" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {[[t("Profil complété"), 72], [t("Messages lus"), 48]].map(([label, pct]) => (
            <div key={label as string}>
              <div className="flex justify-between text-[11px] text-white/60">
                <span>{label}</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#e60050]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureSlider() {
  const t = useT();
  const [index, setIndex] = useState(0);
  // ponytail: 5s JS advance, restarts on dot click — pause-on-hover if reading time ever matters
  useEffect(() => {
    const t = setTimeout(() => setIndex((i) => (i + 1) % FEATURE_SLIDES.length), 5000);
    return () => clearTimeout(t);
  }, [index]);

  const slide = FEATURE_SLIDES[index];

  return (
    <section aria-label={t("Fonctionnalités SWIVV")} className="bg-black py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-[#e60050] bg-gradient-to-br from-[#0d1626] via-[#0b1320] to-[#101014] px-6 py-8 md:min-h-[520px] md:px-12 md:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#e60050]/10 blur-3xl"
        />
        <div
          key={index}
          className="relative grid animate-[swivvFeatureIn_400ms_ease-out] items-center gap-8 md:grid-cols-2"
        >
          {/* ponytail: oversized title bleeds over the visual — z-20 + negative margin, tune -mr if the copy gets longer */}
          <div className="relative z-20 md:-mr-16">
            <p className="text-xs font-bold tracking-[0.2em] text-[#e60050]">
              {String(index + 1).padStart(2, "0")} / {String(FEATURE_SLIDES.length).padStart(2, "0")}
            </p>
            <h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-tight text-white md:text-6xl lg:text-[5.5rem]">
              {t(slide.title)}
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/70 md:text-base">{t(slide.text)}</p>
            <button
              type="button"
              onClick={() => openAuthModal("account", "signup")}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#e60050] px-6 py-3 font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e60050]"
            >
              {t("Commence à Swivver")}
              <span aria-hidden>→</span>
            </button>
            <ul className="mt-6 flex flex-wrap gap-2">
              {slide.items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/70"
                  >
                    <ItemIcon className="h-3.5 w-3.5 text-[#e60050]" aria-hidden="true" />
                    {t(item.title)}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="relative md:-ml-28">
            {index === 3 ? <FeatureChart /> : <FeaturePhotos seed={index} voice={index === 2} />}
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 md:bottom-auto md:left-auto md:right-5 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col">
          {FEATURE_SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t("Voir la section {n}", { n: i + 1 })}
              aria-current={i === index}
              className={`h-3 w-2 rounded-full transition ${i === index ? "bg-[#e60050]" : "bg-white/25 hover:bg-white/40"}`}
            />
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

function SwivvHeader() {
  return (
    <>
      <header className="border-b border-border bg-black text-white">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
    </>
  );
}

function ProfileCard({ p, liked, onLike, eager }: { p: SwivvProfile; liked: boolean; onLike: () => void; eager?: boolean }) {
  const t = useT();
  const dateLocale = useDateLocale();
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
            alt={t("Photo de {name}", { name: p.name })}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            className="aspect-[4/5] w-full object-cover"
          />
        </Link>
        <PhotoCountBadge n={p.photos.length} />
        <button
          type="button"
          onClick={onLike}
            aria-label={isLiked ? t("Retirer le like de {name}", { name: p.name }) : t("Liker {name}", { name: p.name })}
          aria-pressed={isLiked}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm"
        >
          <Heart
            className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-[#555]"}`}
          />
        </button>
        {p.online && (
          <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-medium text-white">
            {t("En ligne")}
          </span>
        )}
      </div>
      <Link to="/member/$id" params={{ id: p.id }} className="block p-2.5">
        <p className="flex items-center gap-1 text-[15px] font-medium text-[#333]">
          {p.name}, {p.age}
          {p.verified && <BadgeCheck className="h-3.5 w-3.5 text-[#e60050]" />}
        </p>
        <p className="text-[13px] text-[#999]">
          {p.city} · {realDistance(viewer.city, viewer.country, p)} km
        </p>
        <p className="text-[12px] text-[#999]">
          {t("Membre depuis le {date}", {
            date: new Date(p.joinedAt).toLocaleDateString(dateLocale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          })}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-[#555]">{p.tagline}</p>
        {authLoading || user ? (
          <p className="mt-0.5 text-[11px] font-medium text-[#e60050]">
            {t("{pct}% compatible", { pct })} · {t(p.lookingFor)}
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
  title: EnKey;
  profiles: SwivvProfile[];
  likedIds: Set<string>;
  onLike: (id: string) => void;
  viewAll?: boolean;
  eager?: boolean;
}) {
  const t = useT();
  if (profiles.length === 0) return null;
  return (
    <section aria-label={t(title)} className="mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-[#333]">{t(title)}</h2>
        {viewAll && (
          <Link
            to="/browse"
            search={{ q: title, type: "", location: "" }}
            className="text-sm font-medium text-[#e60050] hover:underline"
          >
            {t("View All")}
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

function AppDownloadSection({ onDismiss }: { onDismiss?: () => void } = {}) {
  const t = useT();
  const lang = useLang();
  return (
    <section id="telecharger" aria-label={t("Télécharger l'application")} className="w-full scroll-mt-4 bg-[#F7F7F8] py-10">
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 md:grid-cols-2">
        <a
          href="/inscription"
          aria-label={t("Créer mon profil")}
          className="mx-auto block w-full max-w-md rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e60050]"
        >
          {/* ponytail: one square flyer per language (public/swivv-match-download-{en,es}.png); onError keeps the FR art if a file is missing */}
          <img
            src={lang === "fr" ? "/swivv-match-download.png" : `/swivv-match-download-${lang}.png`}
            onError={(e) => { e.currentTarget.src = "/swivv-match-download.png"; }}
            alt={t("Aperçu de l'application SWIVV MATCH sur mobile")}
            loading="lazy"
            className="w-full rounded-xl transition hover:brightness-105"
          />
        </a>
        <div>
          <h2 className="text-2xl font-medium text-[#333]">{t("SWIVV MATCH dans ta poche")}</h2>
          <p className="mt-2 text-sm text-[#777]">{t("Emporte tes matchs partout et commence à Swivver en quelques secondes.")}</p>
          <button
            type="button"
            onClick={() => openAuthModal("account", "signup")}
            className="mt-5 w-full rounded-md bg-[#e60050] px-6 py-3 font-medium text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e60050]"
          >
            {t("Commence à Swivver")}
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="mt-4 text-sm font-medium text-[#777] underline transition hover:text-[#333]"
            >
              {t("Déjà téléchargé ? Ne plus afficher")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function SwivvHome() {
  const t = useT();
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

  const loggedOutRows: { title: EnKey; profiles: SwivvProfile[] }[] = [
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
  const loggedRows: { title: EnKey; profiles: SwivvProfile[] }[] = [
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
      <section className="relative overflow-hidden bg-[#101014]">
        {/* tilted portrait wall on every breakpoint: CSS drift + native scroll-snap cards, no carousel dependency. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
        >
          <div className="grid h-full -rotate-[8deg] scale-[1.35] grid-cols-3 gap-1.5 opacity-60 md:grid-cols-6 md:gap-3">
            {HERO_COLUMNS.map((cards, col) => (
              <div key={col} className={`relative overflow-hidden ${col > 2 ? "hidden md:block" : ""}`}>
                <div
                  className={`flex flex-col gap-1.5 md:gap-3 ${
                    col === 1 || col === 4
                      ? "animate-[swivvHeroDown_46s_linear_infinite]"
                      : "animate-[swivvHeroUp_38s_linear_infinite]"
                  }`}
                >
                  {[...cards, ...cards].map((card, i) => (
                    <HeroWallCard key={i} card={card} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-[#101014]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 md:grid-cols-[420px_1fr] md:py-16">
          <p className="absolute left-4 top-4 z-10 hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80 md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            {t("100% gratuit. Pas de carte bancaire.")}
          </p>
          <div className="min-w-0 md:-translate-y-6">
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80 md:hidden">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              {t("100% gratuit. Pas de carte bancaire.")}
            </p>
            <h1 className="text-[32px] font-medium leading-tight text-white md:text-[68px] md:font-extrabold md:leading-[1.05] md:tracking-tight">
              <span className="md:whitespace-nowrap">{t("Fais de belles")}</span> {t("rencontres, gratuitement")}
            </h1>
            <p className="mt-2 text-sm text-white/75 md:mt-4 md:text-xl md:text-white/80">
              {t("SWIVV MATCH, le site de rencontres")}{" "}
              <strong className="font-bold text-white">{t("100% gratuit")}</strong>
              {t(". Your Match. Your Story.")}
            </p>
            <div className="mt-6 flex flex-col md:mt-8 md:inline-flex md:w-auto">
              <button
                type="button"
                onClick={() => openAuthModal("account", "signup")}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#e60050] px-4 py-3 font-medium text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e60050] md:w-auto md:rounded-full md:px-7 md:py-3.5 md:text-lg md:font-bold"
              >
                {t("Commence à Swivver")}
                <span
                  aria-hidden
                  className="hidden h-7 w-7 items-center justify-center rounded-full bg-black/15 text-base md:flex"
                >
                  →
                </span>
              </button>
              <Link
                to="/comment-ca-marche"
                className="mt-4 block text-center text-[#ff7aa8] md:mt-3 md:inline-flex md:items-center md:rounded-full md:bg-white/10 md:px-6 md:py-3 md:text-base md:font-bold md:text-white md:backdrop-blur-sm md:hover:bg-white/15"
              >
                {t("Découvrir comment ça marche")}
              </Link>
            </div>
          </div>
          <div className="mt-6 flex justify-center md:mt-0 md:-translate-y-8 md:justify-end">
            <HeroStorySlider profiles={HERO_FEATURED.slice(0, 3)} />
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section aria-label={t("SWIVV en chiffres")} className="bg-black py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap justify-around gap-8 rounded-2xl border border-[#e60050] bg-[#0d1626] px-6 py-8 text-center sm:flex-nowrap sm:justify-between md:px-10 md:py-10">
            {[
              ["100%", t("Gratuit")],
              ["∞", t("Possibilités de rencontres")],
              ["♥", t("Des profils à découvrir")],
              ["0 €", t("Pour commencer")],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-3xl font-black leading-none text-white md:text-5xl">{n === "∞" ? <span className="inline-block scale-150">{n}</span> : n}</p>
                <p className="mt-2 text-xs text-[#8a93a3] md:text-sm">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature slider: signup, matching, voice, progress */}
      <FeatureSlider />

      <section aria-label={t("Appel à l'inscription")} className="bg-black py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-3xl border border-[#e60050]/25 bg-[#0b0b0f] px-6 py-12 md:px-12 md:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_15%,rgba(230, 0, 80,0.45),transparent_55%)]"
            />
            <div className="relative">
              <h2 className="max-w-2xl text-3xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
                {t("À ton tour d'écrire ton histoire")}
              </h2>
              <p className="mt-4 max-w-xl text-sm text-white/70 md:text-base">
                {t("Rejoins SWIVV MATCH et écris ta propre histoire. Inscription gratuite, désinscription en 1 clic.")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openAuthModal("account", "signup")}
                  className="flex items-center gap-3 rounded-full bg-[#e60050] py-2 pl-6 pr-2 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:text-base"
                >
                  {t("Je m'inscris gratuitement")}
                  <span
                    aria-hidden
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg"
                  >
                    →
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal("account", "signin")}
                  className="rounded-full bg-[#2b2b2e] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#3a3a3e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:text-base"
                >
                  {t("Se connecter")}
                </button>
              </div>
            </div>
          </div>
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
              <span className="text-sm font-medium text-[#333]">{t("Je recherche :")}</span>
              <div className="flex overflow-hidden rounded-md border border-border text-sm" role="group" aria-label={t("Filtrer par genre")}>
                {(["all", "woman", "man"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSeeking(g)}
                    aria-pressed={effSeeking === g}
                    className={`px-3 py-1.5 ${effSeeking === g ? "bg-[#e60050] text-white" : "bg-white text-[#555]"}`}
                  >
                    {g === "all" ? t("Tous") : g === "woman" ? t("Femmes") : t("Hommes")}
                  </button>
                ))}
              </div>
            </div>
            {loggedRows.map((row, i) => (
              <Rail key={row.title} title={row.title} profiles={row.profiles} likedIds={likedIds} onLike={like} viewAll eager={i === 0} />
            ))}
            {loggedRows.every((row) => row.profiles.length === 0) && (
              <p className="mt-2 text-sm text-[#777]">
                {t("Aucun profil trouvé. Essaie un autre genre.")}
              </p>
            )}
          </>
        )}
      </main>
      {!authUser && (
        <>
          {/* ponytail: 4th signup CTA duplicating the pink panel above — extract shared <SwivvCta> if copy/behavior ever diverge */}
          <section aria-label={t("Inscription gratuite")} className="mx-auto max-w-6xl px-4 pb-10">
            <button
              type="button"
              onClick={() => openAuthModal("account", "signup")}
              className="block w-full rounded-2xl bg-[#e60050] px-8 py-5 text-center text-lg font-medium text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e60050]"
            >
              {t("SWIVV MATCH est 100% gratuit. Crée ton compte en 2 minutes et complète ton profil à ton rythme")}
            </button>
          </section>
        </>
      )}
      {/* ponytail: store links still 404 until the apps ship — section shows for all visitors, dismiss only for logged-in; footer « Application mobile » restores it */}
      {!getSettings().appPromoDismissed && !isNativeApp() && (
        <AppDownloadSection
          onDismiss={
            authUser
              ? () => {
                  setSetting("appPromoDismissed", true);
                  force((x) => x + 1);
                }
              : undefined
          }
        />
      )}
      <SwivvFooter />
    </div>
  );
}
