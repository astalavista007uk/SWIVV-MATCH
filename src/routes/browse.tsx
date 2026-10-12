import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchReactionCounts, getPhotoReaction, isMemberUuid, REACTIONS, reactionOf, togglePhotoReaction, type ReactionId } from "@/lib/swivv-reactions";
import { SWIVV_PROFILES } from "@/lib/swivv-data";
import { displayPct, load } from "@/routes/matches";
import { realDistance, useMyCity } from "@/lib/location-distance";
import { getBlocked, getLikes, getMatches, getProfileViews, isLikedBack, isMatch, toggleLike, bumpProfileView } from "@/lib/swivv-store";
import { SwivvAuthButtons, getMyProfile, requireSwivvAuth, usePublicProfiles } from "@/lib/swivv-auth";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { PhotoCountBadge } from "@/components/photo-count-badge";

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
  const search = Route.useSearch();
  const [query, setQuery] = useState(() => splitSearch(search.q ?? "").text);
  const [category, setCategory] = useState(() => splitSearch(search.q ?? "").category);
  const [gender, setGender] = useState<"all" | "woman" | "man">(() => {
    // ponytail: cached seeking first (no flash on back/forward remounts) — signup-gender fallback, profile fetch refreshes the cache
    try {
      const cached = localStorage.getItem("swivv-seeking");
      if (cached === "woman" || cached === "man") return cached;
      const g = localStorage.getItem("swivv-signup-gender");
      return g === "woman" ? "man" : g === "man" ? "woman" : "all";
    } catch {
      return "all";
    }
  });
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
  // ponytail: reactor+type only, never the photo column (750KB data URLs) — latest reaction per reactor, 200 cap; admin/stats read the full rows when they need photos
  const [reactRecv, setReactRecv] = useState<Record<string, { emoji: string; label: string }>>({});
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
        const m: Record<string, { emoji: string; label: string }> = {};
        for (const r of (data ?? [])) {
          const id = `u:${r.reactor_id}`;
          if (!m[id]) {
            const def = reactionOf(String(r.reaction));
            m[id] = { emoji: def?.emoji ?? "❤️", label: def?.label ?? "Réaction" };
          }
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
  const viewer = useMyCity();
  const members = usePublicProfiles();
  // ponytail: seeds + real members in one pool — dedupe by id if a seed ever ships a u: id
  const pool = useMemo(() => [...SWIVV_PROFILES, ...members], [members]);
  const dist = (p: { city: string; country: string; distanceKm: number }) =>
    realDistance(viewer.city, viewer.country, p);
  // ponytail: joinedAt proxies photo-added date — per-photo timestamps if uploads ever track them
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  // Sync when arriving via a menu link: the page does not remount when only
  // the search params change, so update category + text on every navigation.
  useEffect(() => {
    const { category: c, text: t } = splitSearch(search.q ?? "");
    setCategory(c);
    setQuery(t);
  }, [search.q]);

  // Default gender filter to who the viewer seeks (saved preference, else opposite).
  useEffect(() => {
    getMyProfile().then((p) => {
      const s = p?.seeking ?? (p?.gender === "woman" ? "man" : p?.gender === "man" ? "woman" : null);
      if (s) {
        try {
          localStorage.setItem("swivv-seeking", s);
        } catch {}
        setGender((g) => (g === "all" ? s : g));
      }
    });
  }, []);

  const cat = category.toLowerCase();
  // ponytail: category views force their sort so the dropdown always shows the real order
  const effectiveSort = cat === "photos récentes" || cat === "nouveaux profils" ? "recent" : cat === "profils populaires" ? "popular" : cat === "près de moi" ? "distance" : sort;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = pool.filter((p) => {
      if (getBlocked().includes(p.id)) return false;
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
  }, [query, category, gender, onlineOnly, lookingFor, minAge, maxAge, sort, search.type, viewer, maxDist, pool, reactRecv]);

  const intents = ["all", "Mariage", "Relation sérieuse", "Relation amoureuse", "Belle histoire"];

  // ponytail: one batched counts call per grid (no N+1); refreshed after each successful tap — realtime channel if taps ever need live totals
  const recentUrls = useMemo(
    () => (cat === "photos récentes" ? [...new Set(results.flatMap((p) => p.photos))].slice(0, 300) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cat, results],
  );
  const [reactCounts, setReactCounts] = useState<Record<string, Partial<Record<ReactionId, number>>>>({});
  useEffect(() => {
    let live = true;
    if (!recentUrls.length) {
      setReactCounts({});
      return;
    }
    fetchReactionCounts(recentUrls).then((m) => {
      if (live) setReactCounts(m);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentUrls.join("|")]);
  const reactTo = async (key: string, owner: string, photo: string, kind: ReactionId) => {
    if (pendingReact.current.has(photo)) return;
    pendingReact.current.add(photo);
    force((x) => x + 1);
    try {
      const r = await togglePhotoReaction(isMemberUuid(owner) ? owner : null, photo, kind);
      if (!r.ok) {
        if (r.error === "own") toast.error("Vous ne pouvez pas réagir à vos propres photos.");
        else toast.error("Réaction non enregistrée. Réessayez.");
      } else {
        setOpenReact(null);
        const m = await fetchReactionCounts(recentUrls);
        setReactCounts(m);
      }
    } finally {
      pendingReact.current.delete(photo);
      force((x) => x + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-3">
          <div className="flex overflow-hidden rounded-md border border-border text-sm" role="group" aria-label="Filtrer par genre">
            {(["all", "woman", "man"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                aria-pressed={gender === g}
                className={`px-3 py-1.5 ${gender === g ? "bg-[#e91e63] text-white" : "text-[#555]"}`}
              >
                {g === "all" ? "Tous" : g === "woman" ? "Femmes" : "Hommes"}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-sm text-[#555]">
            <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} />
            En ligne
          </label>
          <label className="flex items-center gap-1.5 text-sm text-[#555]">
            Intention
            <select
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              className="rounded-md border border-border px-2 py-1.5"
              aria-label="Intention"
            >
              {intents.map((i) => (
                <option key={i} value={i}>
                  {i === "all" ? "Toutes" : i}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-sm text-[#555]">
            Âge
            <input
              type="number"
              min={18}
              max={99}
              value={minAge}
              onChange={(e) => setMinAge(Number(e.target.value) || 18)}
              className="w-14 rounded-md border border-border px-1 py-1"
              aria-label="Âge minimum"
            />
            –
            <input
              type="number"
              min={18}
              max={99}
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value) || 99)}
              className="w-14 rounded-md border border-border px-1 py-1"
              aria-label="Âge maximum"
            />
          </label>
          {cat === "près de moi" && (
            <label className="flex items-center gap-1.5 text-sm text-[#555]">
              Distance max
              <select
                value={maxDist}
                onChange={(e) => setMaxDist(e.target.value)}
                className="rounded-md border border-border px-2 py-1.5"
                aria-label="Distance maximale"
              >
                <option value="">Illimitée</option>
                {["5", "10", "25", "50", "100", "250", "500", "750", "1000"].map((d) => (
                  <option key={d} value={d}>
                    {d} km
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="ml-auto flex items-center gap-1.5 text-sm text-[#555]">
            Trier            <select
              value={effectiveSort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-md border border-border px-2 py-1.5"
              aria-label="Trier les profils"
            >
              <option value="match">Compatibilité</option>
              <option value="popular">Popularité</option>
              <option value="distance">Distance</option>
              <option value="ageAsc">Âge - Croissant</option>
              <option value="ageDesc">Âge - Décroissant</option>
              <option value="recent">Ajouts Récents</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-medium text-[#333]">
            {cat === "photos récentes"
              ? `Photos récentes (${results.reduce((n, p) => n + p.photos.length, 0)} photos · ${results.length} profil${results.length > 1 ? "s" : ""})`
              : `${results.length} profil${results.length > 1 ? "s" : ""}`}
            {category && cat !== "photos récentes" ? ` · ${category}` : ""}
          </h1>
          {category && (
            <button
              type="button"
              onClick={() => setCategory("")}
              className="rounded-full bg-[#e91e63]/10 px-3 py-1 text-sm font-medium text-[#e91e63] hover:bg-[#e91e63]/20"
              aria-label={`Retirer le filtre ${category}`}
            >
              {category} ✕
            </button>
          )}
        </div>
        {cat === "photos récentes" ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.flatMap((p) => p.photos.map((src, i) => ({ p, src, i }))).map(({ p, src, i }) => (
            <article key={`${p.id}-${i}`} className="overflow-hidden rounded-lg bg-white">
              <div className="group relative">
                <Link to="/member/$id" params={{ id: p.id }} onClick={() => bumpProfileView(p.id)}>
                  <img src={src} alt={`Photo ${i + 1} de ${p.name}`} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                </Link>
                {!(myUid && p.id === `u:${myUid}`) && (
                  <PhotoReact
                    photo={src}
                    open={openReact === `${p.id}-${i}`}
                    counts={reactCounts[src]}
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
                  <p className="text-xs text-[#999]">Photo ajoutée le {fmtDate(p.joinedAt)}</p>
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
                  <img src={p.photo} alt={`Photo de ${p.name}`} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                </Link>
                <PhotoCountBadge n={p.photos.length} className={search.type === "recus" && getMatches().includes(p.id) ? "left-[49px]" : ""} />
                  <button
                    type="button"
                    onClick={() =>
                      requireSwivvAuth("like", () => {
                        toggleLike(p.id);
                        force((x) => x + 1);
                      })
                    }
                    aria-label={`Liker ${p.name}`}
                    aria-pressed={liked}
                    className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm"
                  >
                    <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : "text-[#555]"}`} />
                  </button>
                  {p.online && (
                    <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-medium text-white">
                      En ligne
                    </span>
                  )}
                  {(search.type === "matches" || search.type === "recus") && getMatches().includes(p.id) && (
                    <span className="absolute bottom-2 left-2 flex gap-1 rounded-full bg-white/90 p-1.5 shadow-sm">
                      <Heart aria-label="Like réciproque" className="h-4 w-4 fill-red-500 text-red-500" />
                    </span>
                  )}
                  {search.type === "recus" && reactRecv[p.id] && (
                    <span title={`A réagi à vos photos : ${reactRecv[p.id].label}`} className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-1 text-sm shadow-sm">
                      <span aria-hidden="true">{reactRecv[p.id].emoji}</span>
                      <span className="sr-only">A réagi : {reactRecv[p.id].label}</span>
                    </span>
                  )}
                </div>
                <Link to="/member/$id" params={{ id: p.id }} className="block p-3">
                  <p className="flex items-center gap-1 font-medium text-[#333]">
                    {p.name}, {p.age}
                    {p.verified && <BadgeCheck className="h-4 w-4 text-[#e91e63]" />}
                  </p>
                  <p className="text-sm text-[#999]">
                    {p.city} · {dist(p)} km · {p.lastActive}
                  </p>
                  <p className="text-xs text-[#999]">
                    Membre depuis le {fmtDate(p.joinedAt)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#e91e63]">
                    {displayPct(p, load())}% · {p.lookingFor}
                  </p>
                </Link>
              </article>
            );
          })}
        </div>
        )}
        {results.length === 0 && <p className="mt-6 text-sm text-[#777]">Aucun profil avec ces filtres. Élargis ta recherche.</p>}
      </main>
      <SwivvFooter />
    </div>
  );
}

// ponytail: hover reveals on desktop (CSS group-hover), tap pins on touch (open state) — one markup for both; counts live in the toolbar so cards stay clean; Esc + outside-tap close
function PhotoReact({ photo, open, counts, pending, onToggle, onPick }: {
  photo: string;
  open: boolean;
  counts: Partial<Record<ReactionId, number>> | undefined;
  pending: boolean;
  onToggle: () => void;
  onPick: (kind: ReactionId) => void;
}) {
  const mine = getPhotoReaction(photo);
  const total = Object.values(counts ?? {}).reduce((a, b) => a + (b ?? 0), 0);
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
        aria-label="Choisir une réaction"
        className={`flex max-w-full flex-wrap justify-end gap-0.5 rounded-full bg-black/55 px-2 py-1.5 backdrop-blur-sm transition-opacity motion-safe:duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100"}`}
      >
        {REACTIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            title={r.label}
            aria-label={`Réagir : ${r.label}`}
            aria-pressed={mine === r.id}
            disabled={pending}
            onClick={() => onPick(r.id)}
            className={`rounded-full px-1.5 py-1 text-xl leading-none transition motion-safe:active:scale-125 ${mine === r.id ? "bg-white/90 ring-2 ring-[#e91e63]" : "hover:bg-white/20"} disabled:opacity-50`}
          >
            <span aria-hidden="true">{r.emoji}</span>
            {(counts?.[r.id] ?? 0) > 0 && <span className="ml-0.5 align-middle text-[11px] font-semibold text-white">{counts?.[r.id]}</span>}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={total > 0 ? `Réagir à cette photo (${total} réaction${total > 1 ? "s" : ""})` : "Réagir à cette photo"}
        className="flex min-h-[36px] min-w-[36px] items-center justify-center gap-1 rounded-full bg-black/55 px-2 text-white backdrop-blur-sm"
      >
        <span aria-hidden="true" className="text-lg leading-none">{(mine && reactionOf(mine)?.emoji) || "😊"}</span>
        {total > 0 && <span className="text-[11px] font-semibold">{total}</span>}
      </button>
    </div>
  );
}
