import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getPhotoReaction, isMemberUuid, preloadMyReactionsForPhotos, REACTIONS, reactionOf, subscribeReactions, togglePhotoReaction, type ReactionId } from "@/lib/swivv-reactions";
import { SWIVV_PROFILES } from "@/lib/swivv-data";
import { displayPct, load, MatchLoginPrompt } from "@/lib/match-score";
import { useAuth } from "@/hooks/use-auth";
import { realDistance } from "@/lib/location-distance";
import { getLikes, getMatches, getProfileViews, isLikedBack, isMatch, isThreadBlocked, subscribe, toggleLike, bumpProfileView } from "@/lib/swivv-store";
import { SwivvAuthButtons, getMyBasics, requireSwivvAuth, usePublicProfiles } from "@/lib/swivv-auth";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { PhotoCountBadge } from "@/components/photo-count-badge";
import { useDateLocale, useT } from "@/lib/i18n";

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    type: typeof search.type === "string" ? search.type : "",
    location: typeof search.location === "string" ? search.location : "",
  }),
  head: () => ({
    meta: [{ title: "Parcourir les profils — SWIVV" }],
  }),
  component: SwivvBrowse,
});

const CATEGORIES = [
  "Femmes",
  "Hommes",
  "Près de moi",
  "En ligne",
  "Mariage",
  "Relation sérieuse",
  "Nouveaux profils",
  "Photos récentes",
  "Profils populaires",
] as const;

function splitSearch(raw: string): { category: string; text: string } {
  // ponytail: "Recherche avancée" is a nav label, not a query — extend the allowlist if more pseudo-categories appear
  if (raw.trim().toLowerCase() === "recherche avancée") return { category: "", text: "" };
  const match = CATEGORIES.find((c) => c.toLowerCase() === raw.trim().toLowerCase());
  if (match) return { category: match, text: "" };
  return { category: "", text: raw };
}

function SwivvBrowse() {
  const t = useT();
  const dateLocale = useDateLocale();
  const search = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState(() => splitSearch(search.q ?? "").text);
  const [category, setCategory] = useState(() => splitSearch(search.q ?? "").category);
  // ponytail: per-user cache read after mount (not in the initializer) — reading localStorage during the first render makes SSR and client disagree; the seeking fetch below still confirms
  const [gender, setGender] = useState<"all" | "woman" | "man">("all");
  useEffect(() => {
    try {
      const uid = localStorage.getItem("swivv-uid");
      const mine = uid ? localStorage.getItem(`swivv-seeking:${uid}`) : null;
      const cached = mine === "woman" || mine === "man" ? mine : localStorage.getItem("swivv-seeking");
      if (cached === "woman" || cached === "man") { setGender(cached); return; }
      const g = localStorage.getItem("swivv-signup-gender");
      if (g === "woman") setGender("man");
      else if (g === "man") setGender("woman");
    } catch { /* ignore */ }
  }, []);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [maxDist, setMaxDist] = useState("");
  const [lookingFor, setLookingFor] = useState("all");
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(99);
  const [sort, setSort] = useState<"match" | "distance" | "ageAsc" | "ageDesc" | "recent" | "popular">(
    "match",
  );
  const [, force] = useState(0);
  const [myUid, setMyUid] = useState<string | null>(null);
  // ponytail: reactor+type only, never the photo column (750KB data URLs) — distinct reactions per reactor stacked, 200 cap; admin/stats read the full rows when they need photos
  const [reactRecv, setReactRecv] = useState<Record<string, { emojis: string[]; labels: string[] }>>({});
  useEffect(() => {
    if (!myUid) {
      setReactRecv({});
      return;
    }
    let live = true;
    (supabase as any).from("swivv_photo_reactions")
      .select("reactor_id,reaction,updated_at").eq("owner_id", myUid)
      .order("updated_at", { ascending: false }).limit(200)
      .then(({ data }: any) => {
        if (!live) return;
        const m: Record<string, { emojis: string[]; labels: string[] }> = {};
        for (const r of (data ?? [])) {
          const id = `u:${r.reactor_id}`;
          const def = reactionOf(String(r.reaction));
          const emoji = def?.emoji ?? "❤️";
          const label = def?.label ?? "Réaction";
          const cur = (m[id] ??= { emojis: [], labels: [] });
          if (!cur.emojis.includes(emoji)) cur.emojis.push(emoji);
          if (!cur.labels.includes(label)) cur.labels.push(label);
        }
        setReactRecv(m);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [myUid]);
  const [openReact, setOpenReact] = useState<string | null>(null);
  const pendingReact = useRef<Set<string>>(new Set());
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMyUid(data.session?.user.id ?? null)).catch(() => {});
  }, []);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.("[data-reactscope]")) setOpenReact(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  // ponytail: refresh on store changes (block/unblock hides here instantly, no remount needed) — same subscribe as the message dialog
  useEffect(() => subscribe(() => force((x) => x + 1)), []);
  const [myGeo, setMyGeo] = useState({ city: "", country: "" });
  const { profiles: members, hasMore, loaded: poolLoaded, loadMore } = usePublicProfiles(
    category.toLowerCase() === "photos récentes",
  );
  // ponytail: seeds + real members in one pool — dedupe by id if a seed ever ships a u: id
  const pool = useMemo(() => [...SWIVV_PROFILES, ...members], [members]);
  const dist = (p: { city: string; country: string; distanceKm: number }) =>
    realDistance(myGeo.city, myGeo.country, p);
  // ponytail: joinedAt proxies photo-added date — per-photo timestamps if uploads ever track them
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });

  // Sync when arriving via a menu link: the page does not remount when only
  // the search params change, so update category + text on every navigation.
  useEffect(() => {
    const { category: c, text: txt } = splitSearch(search.q ?? "");
    setCategory(c);
    setQuery(txt);
  }, [search.q]);

  // Default gender filter to who the viewer seeks (saved preference, else opposite).
  // ponytail: per-user seeking cache, read from the local session in ms — seeds paint at once in the right gender/sort, server members stream into place when the pool lands (holding the whole grid for a 10s+ cold query was the bigger wait)
  const [seekReady, setSeekReady] = useState(false);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user.id ?? null;
        if (!live) return;
        if (uid) {
          try {
            const c = localStorage.getItem(`swivv-seeking:${uid}`);
            // ponytail: per-user hit lifts the gate at once (this uid's own last-known value, network fetch confirms below) — first visit on a new device still waits for the fetch
            if (c === "woman" || c === "man") {
              setGender(c);
              setSeekReady(true);
            }
          } catch {}
        }
        const b = await getMyBasics();
        if (!live) return;
        if (b.seeking) setGender(b.seeking);
        setMyGeo({ city: b.city, country: b.country });
      } finally {
        if (live) setSeekReady(true);
      }
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const gridReady = seekReady;
  const cat = category.toLowerCase();
  // ponytail: category views force their sort so the dropdown always shows the real order
  const effectiveSort = cat === "photos récentes" || cat === "nouveaux profils" ? "recent" : cat === "profils populaires" ? "popular" : cat === "près de moi" ? "distance" : sort;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = pool.filter((p) => {
      // ponytail: either direction hides (I blocked them or they blocked me) — threads keep their own banner instead
      if (isThreadBlocked(p.id)) return false;
      // ponytail: likes/matches/recus views reuse the text category pipeline — dedicated pages if they need their own layout
      if (search.type === "likes" && !getLikes().includes(p.id)) return false;
      if (search.type === "matches" && !isMatch(p.id)) return false;
      if (search.type === "recus" && !(isLikedBack(p.id) || reactRecv[p.id])) return false;
      if (gender !== "all" && p.gender !== gender) return false;
      if (onlineOnly && !p.online) return false;
      if (lookingFor !== "all" && p.lookingFor !== lookingFor) return false;
      if (p.age < minAge || p.age > maxAge) return false;
      if (cat === "femmes" && p.gender !== "woman") return false;
      if (cat === "hommes" && p.gender !== "man") return false;
      if (cat === "en ligne" && !p.online) return false;
      if (cat === "mariage" && p.lookingFor !== "Mariage") return false;
      if (cat === "relation sérieuse" && !p.lookingFor.toLowerCase().includes("sérieuse")) return false;
      // ponytail: "nouveaux profils" lists everything newest-first (isNew flag retired) — re-gate if the pool ever needs curating
      // ponytail: "près de moi" lists everything closest-first (no cutoff) — re-gate if far profiles ever drown the view
      if (cat === "près de moi" && maxDist !== "" && dist(p) > Number(maxDist)) return false;
      if (!q) return true;
      return `${p.name} ${p.city} ${p.tagline} ${p.bio} ${p.interests.join(" ")} ${p.occupation} ${p.religion} ${p.lookingFor}`
        .toLowerCase()
        .includes(q);
    });
    const sorted = [...filtered];
    // ponytail: popularity = most-visited first, then verified/online/compatibility — server-side analytics if it ever needs to be global
    if (effectiveSort === "popular") {
      const views = getProfileViews();
      sorted.sort((a, b) => (views[b.id] ?? 0) - (views[a.id] ?? 0) || Number(b.verified) - Number(a.verified) || Number(b.online) - Number(a.online) || b.compatibility - a.compatibility);
    }
    if (effectiveSort === "match") sorted.sort((a, b) => b.compatibility - a.compatibility);
    if (effectiveSort === "distance") sorted.sort((a, b) => dist(a) - dist(b));
    if (effectiveSort === "ageAsc") sorted.sort((a, b) => a.age - b.age);
    if (effectiveSort === "ageDesc") sorted.sort((a, b) => b.age - a.age);
    // ponytail: ?? guard — one dateless profile used to kill the whole page; backfilled upstream, this just sorts them last
    if (effectiveSort === "recent") sorted.sort((a, b) => (b.joinedAt ?? "").localeCompare(a.joinedAt ?? ""));
    return sorted;
  }, [query, category, gender, onlineOnly, lookingFor, minAge, maxAge, sort, search.type, myGeo, maxDist, pool, reactRecv]);

  const intents = ["all", "Mariage", "Relation sérieuse", "Relation amoureuse", "Belle histoire"];

  // ponytail: one honest subline per category (titles stay short for the nav) — popularity is most-visited-first and "photos récentes" follows newest members, server-side analytics if rankings ever need to go global
  const CAT_HINT: Record<string, string> = {
    "près de moi": "Du plus proche au plus loin — règle la distance max ci-dessus.",
    "en ligne": "Connectés en ce moment.",
    "profils populaires": "Les plus visités d'abord.",
    "nouveaux profils": "Les derniers inscrits d'abord.",
    "photos récentes": "Les photos des derniers inscrits.",
  };

  // ponytail: highlights re-render on any reaction tap (same-tab profile↔recent sync) + seed from the server for fresh browsers; the shared photo-URL cache is the sync itself, no per-photo refetch
  useEffect(() => subscribeReactions(() => force((x) => x + 1)), []);
  useEffect(() => {
    if (cat === "photos récentes") void preloadMyReactionsForPhotos(results.flatMap((p) => p.photos));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, results]);
  const reactTo = async (key: string, owner: string, photo: string, kind: ReactionId) => {
    if (pendingReact.current.has(photo)) return;
    pendingReact.current.add(photo);
    force((x) => x + 1);
    try {
      const r = await togglePhotoReaction(isMemberUuid(owner) ? owner : null, photo, kind, owner);
      if (!r.ok) {
        if (r.error === "own") toast.error(t("Tu ne peux pas réagir à tes propres photos."));
        else toast.error(t("Réaction non enregistrée. Réessaie."));
      } else {
        setOpenReact(null);
      }
    } finally {
      pendingReact.current.delete(photo);
      force((x) => x + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-black text-white">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-3">
          <div className="flex overflow-hidden rounded-md border border-border text-sm" role="group" aria-label={t("Filtrer par genre")}>
            {(["all", "woman", "man"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                aria-pressed={gender === g}
                className={`px-3 py-1.5 ${gender === g ? "bg-[#e60050] text-white" : "text-[#555]"}`}
              >
                {g === "all" ? t("Tous") : g === "woman" ? t("Femmes") : t("Hommes")}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-sm text-[#555]">
            <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} />
            {t("En ligne")}
          </label>
          <label className="flex items-center gap-1.5 text-sm text-[#555]">
            {t("Intention")}
            <select
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              className="rounded-md border border-border px-2 py-1.5"
              aria-label={t("Intention")}
            >
              {intents.map((i) => (
                <option key={i} value={i}>
                  {i === "all" ? t("Toutes") : t(i)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-sm text-[#555]">
            {t("Âge")}
            <input
              type="number"
              min={18}
              max={99}
              value={minAge}
              onChange={(e) => setMinAge(Number(e.target.value) || 18)}
              className="w-14 rounded-md border border-border px-1 py-1"
              aria-label={t("Âge minimum")}
            />
            –
            <input
              type="number"
              min={18}
              max={99}
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value) || 99)}
              className="w-14 rounded-md border border-border px-1 py-1"
              aria-label={t("Âge maximum")}
            />
          </label>
          {cat === "près de moi" && (
            <label className="flex items-center gap-1.5 text-sm text-[#555]">
              {t("Distance max")}
              <select
                value={maxDist}
                onChange={(e) => setMaxDist(e.target.value)}
                className="rounded-md border border-border px-2 py-1.5"
                aria-label={t("Distance maximale")}
              >
                <option value="">{t("Illimitée")}</option>
                {["5", "10", "25", "50", "100", "250", "500", "750", "1000"].map((d) => (
                  <option key={d} value={d}>
                    {d} km
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="ml-auto flex items-center gap-1.5 text-sm text-[#555]">
            {t("Trier")}{" "}
            <select
              value={effectiveSort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-md border border-border px-2 py-1.5"
              aria-label={t("Trier les profils")}
            >
              <option value="match">{t("Compatibilité")}</option>
              <option value="popular">{t("Popularité")}</option>
              <option value="distance">{t("Distance")}</option>
              <option value="ageAsc">{t("Âge - Croissant")}</option>
              <option value="ageDesc">{t("Âge - Décroissant")}</option>
              <option value="recent">{t("Ajouts Récents")}</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-medium text-[#333]">
            {(() => {
              const n = results.length;
              const profiles = n === 1 ? t("1 profil") : t("{n} profils", { n });
              if (cat === "photos récentes")
                return `${t("Photos récentes")} (${results.reduce((sum, p) => sum + p.photos.length, 0)} ${t("photos")} · ${profiles})`;
              if (search.type === "likes") return `${profiles} ${t("que j'ai liké")}`;
              if (search.type === "recus") return `${profiles} ${t("qui m'ont liké")}`;
              return profiles;
            })()}
            {category && cat !== "photos récentes" ? ` · ${t(category)}` : ""}
            {CAT_HINT[cat] && <span className="text-sm font-normal text-[#777]"> — {t(CAT_HINT[cat])}</span>}
          </h1>
          {category && (
            <button
              type="button"
              onClick={() => setCategory("")}
              className="rounded-full bg-[#e60050]/10 px-3 py-1 text-sm font-medium text-[#e60050] hover:bg-[#e60050]/20"
              aria-label={t("Retirer le filtre {category}", { category: t(category) })}
            >
              {t(category)} ✕
            </button>
          )}
        </div>
        {gridReady && !poolLoaded && (
          <p className="mt-4 text-sm text-[#777]">{t("Chargement des derniers profils…")}</p>
        )}
        {!gridReady ? (
          <p className="mt-6 text-sm text-[#777]">{t("Chargement…")}</p>
        ) : cat === "photos récentes" ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.flatMap((p) => p.photos.map((src, i) => ({ p, src, i }))).map(({ p, src, i }) => (
            <article key={`${p.id}-${i}`} className="overflow-hidden rounded-lg bg-white">
              <div className="group relative">
                <Link to="/member/$id" params={{ id: p.id }} onClick={() => { if (!(myUid && p.id === `u:${myUid}`)) bumpProfileView(p.id); }}>
                  <img src={src} alt={`Photo ${i + 1} de ${p.name}`} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                </Link>
                {!(myUid && p.id === `u:${myUid}`) && (
                  <PhotoReact
                    photo={src}
                    open={openReact === `${p.id}-${i}`}
                    pending={pendingReact.current.has(src)}
                    onToggle={() => setOpenReact(openReact === `${p.id}-${i}` ? null : `${p.id}-${i}`)}
                    onPick={(kind) => reactTo(`${p.id}-${i}`, p.id, src, kind)}
                  />
                )}
              </div>
                <div className="p-2.5">
                  <p className="text-[15px] font-medium text-[#333]">
                    {p.name}, {p.age}
                  </p>
                  <p className="text-xs text-[#999]">{t("Photo ajoutée le {date}", { date: fmtDate(p.joinedAt) })}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.map((p) => {
            const liked = getLikes().includes(p.id);
            return (
              <article key={p.id} className="overflow-hidden rounded-lg bg-white">
                <div className="relative">
                <Link to="/member/$id" params={{ id: p.id }}>
                  <img src={p.photo} alt={t("Photo de {name}", { name: p.name })} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                </Link>
                <PhotoCountBadge n={p.photos.length} className={search.type === "recus" && getMatches().includes(p.id) ? "left-[49px]" : ""} />
                  <span className="group/hint absolute right-2 top-2">
                    <button
                      type="button"
                      onClick={() =>
                        requireSwivvAuth("like", () => {
                          toggleLike(p.id);
                          force((x) => x + 1);
                        })
                      }
                      aria-label={liked ? t("Déliker {name}", { name: p.name }) : t("Liker {name}", { name: p.name })}
                      aria-pressed={liked}
                      className="rounded-full bg-white/90 p-2 shadow-sm"
                    >
                      <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : "text-[#555]"}`} />
                    </button>
                    {/* ponytail: same black/white bubble as the reaction hint below — native title dropped to avoid double popups */}
                    <span className="pointer-events-none absolute right-0 top-full z-10 mt-1 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1.5 text-[11px] font-normal text-white shadow-lg group-hover/hint:block" aria-hidden="true">
                      {liked ? t("Déliker {name}", { name: p.name }) : t("Liker {name}", { name: p.name })}
                    </span>
                  </span>
                  {p.online && (
                    <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-medium text-white">
                      {t("En ligne")}
                    </span>
                  )}
                  {(search.type === "matches" || search.type === "recus") && getMatches().includes(p.id) && (
                    <span className="group/hint absolute bottom-2 left-2 flex gap-1 rounded-full bg-white/90 p-1.5 shadow-sm">
                      <Heart aria-label={t("Like réciproque")} className="h-4 w-4 fill-red-500 text-red-500" />
                      <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1.5 text-[11px] font-normal text-white shadow-lg group-hover/hint:block" aria-hidden="true">
                        {t("{name} t'as Liké", { name: p.name })}
                      </span>
                    </span>
                  )}
                  {search.type === "recus" && reactRecv[p.id] && (
                    // ponytail: same black/white bubble as SwivvHint/MatchTooltip but bottom-full (badge sits at the card's clipped bottom edge) — short name-only hint, per-emoji names if the popup ever needs detail
                    <span className="group/hint absolute bottom-2 right-2 flex flex-col items-end gap-1">
                      {reactRecv[p.id].emojis.map((e) => (
                        <span key={e} aria-hidden="true" className="rounded-full bg-white/90 px-1.5 py-0.5 text-xs leading-none shadow-sm">
                          {e}
                        </span>
                      ))}
                        <span className="sr-only">{t("{name} a réagi sur tes photos", { name: p.name })}</span>
                      <span className="pointer-events-none absolute bottom-full right-0 z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1.5 text-[11px] font-normal text-white shadow-lg group-hover/hint:block">
                        {t("{name} a réagi sur tes photos", { name: p.name })}
                      </span>
                    </span>
                  )}
                </div>
                <Link to="/member/$id" params={{ id: p.id }} className="block p-3">
                  <p className="flex items-center gap-1 font-medium text-[#333]">
                    {p.name}, {p.age}
                    {p.verified && <BadgeCheck className="h-4 w-4 text-[#e60050]" />}
                  </p>
                  <p className="text-sm text-[#999]">
                    {p.city} · {dist(p)} km · {p.lastActive}
                  </p>
                  <p className="text-xs text-[#999]">
                    {t("Membre depuis le {date}", { date: fmtDate(p.joinedAt) })}
                  </p>
                  {authLoading || user ? (
                    <p className="mt-1 text-xs font-medium text-[#e60050]">
                      {displayPct(p, load())}% · {t(p.lookingFor)}
                    </p>
                  ) : (
                    <MatchLoginPrompt name={p.name} className="mt-1" />
                  )}
                </Link>
              </article>
            );
          })}
        </div>
        )}
        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            className="mx-auto mt-6 block rounded-md border border-border bg-white px-6 py-2.5 text-sm font-medium text-[#555]"
          >
            {t("Voir plus de profils")}
          </button>
        )}
        {gridReady && poolLoaded && results.length === 0 && <p className="mt-6 text-sm text-[#777]">{t("Aucun profil avec ces filtres. Élargis ta recherche.")}</p>}
      </main>
      <SwivvFooter />
    </div>
  );
}

// ponytail: hover reveals on desktop (CSS group-hover), tap pins on touch (open state) — one markup for both; no counts anywhere (a new pick overwrites the old, highlight is the only state); Esc + outside-tap close
export function PhotoReact({ photo, open, pending, onToggle, onPick }: {
  photo: string;
  open: boolean;
  pending: boolean;
  onToggle: () => void;
  onPick: (kind: ReactionId) => void;
}) {
  const mine = getPhotoReaction(photo);
  const mineDef = mine ? reactionOf(mine) : undefined;
  const t = useT();
  return (
    <div
      data-reactscope
      className="absolute inset-x-0 bottom-0 flex flex-col items-end gap-1 p-2"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) onToggle();
      }}
    >
      <div
        role="group"
        aria-label={t("Choisir une réaction")}
        className={`flex max-w-full flex-wrap justify-end gap-0.5 rounded-full bg-black/55 px-2 py-1.5 backdrop-blur-sm transition-opacity motion-safe:duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100"}`}
      >
        {REACTIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            title={t(r.label)}
            aria-label={t("Réagir : {label}", { label: t(r.label) })}
            aria-pressed={mine === r.id}
            disabled={pending}
            onClick={() => onPick(r.id)}
            className={`rounded-full px-1.5 py-1 text-xl leading-none transition motion-safe:active:scale-125 ${mine === r.id ? "bg-white/90 ring-2 ring-[#e60050]" : "hover:bg-white/20"} disabled:opacity-50`}
          >
            <span aria-hidden="true">{r.emoji}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={mineDef ? t("Ta réaction : {label} — changer", { label: t(mineDef.label) }) : t("Réagir à cette photo")}
        className="flex min-h-[36px] min-w-[36px] items-center justify-center gap-1 rounded-full bg-black/55 px-2 text-white backdrop-blur-sm"
      >
        <span aria-hidden="true" className="text-lg leading-none">{mineDef?.emoji || "😊"}</span>
      </button>
    </div>
  );
}
