import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Coffee, Globe, Heart, Sparkles, User, Users } from "lucide-react";
import { SWIVV_PROFILES, nameAge, type SwivvProfile } from "@/lib/swivv-data";
import { realDistance, useMyCity } from "@/lib/location-distance";
import { getLikes, isThreadBlocked, markMatchCriteriaSaved, markMatchCriteriaVisited, MATCH_CRITERIA_KEY as KEY, pullMatchCriteria, pushMatchCriteria, subscribe, toggleLike } from "@/lib/swivv-store";
import { useAuth } from "@/hooks/use-auth";
import { displayPct, EMPTY, HARD, load, MatchTooltip, natTest, adjTest, inc, norm, RELOCATE_MAP, score, topMatches } from "@/lib/match-score";
import { SwivvAuthButtons, openAuthModal, requireSwivvAuth, usePublicProfiles } from "@/lib/swivv-auth";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { PhotoCountBadge } from "@/components/photo-count-badge";
import { useT } from "@/lib/i18n";
// ponytail: option lists reused from signup (single source) — tolerant matchers below because seed values are free text
import {
  BODY,
  BORN,
  DRINK,
  DRUGS,
  EAT,
  EDUC,
  ETHNI,
  EYES,
  FAMILY_VALUES,
  FIRSTLANGS,
  FRANCE_CITIES,
  HAIR,
  INCOME,
  JOB,
  LIVING,
  LOOKING,
  MARITAL,
  METIERS,
  NATS,
  PAYS,
  PRACTICE,
  RELOCATE,
  RELIGION,
  SMOKE,
  STYLE,
  YESNO,
  Seg,
  cmToFtIn,
  forGender,
  ftInToCm,
  kgToSt,
  stToKg,
  type GF,
} from "@/routes/inscription";

export const Route = createFileRoute("/matches")({
  head: () => ({ meta: [{ title: "Mes Matches — SWIVV" }] }),
  component: MatchesPage,
});

// ponytail: NATS is feminine-only upstream — rule-based masculine with exceptions; CLDR-sourced masculine list if it drifts
const NAT_MASC_KEEP = new Set(["Belge", "Biélorusse", "Bosniaque", "Guatémaltèque", "Monégasque", "Tchèque", "Britannique", "Russe", "Slovaque", "Suisse"]);
const NAT_MASC_FIX: Record<string, string> = { Grecque: "Grec", Turque: "Turc" };
const toMasculineNat = (w: string) => NAT_MASC_FIX[w] ?? (NAT_MASC_KEEP.has(w) ? w : w.replace(/e$/, ""));
// ponytail: HAIR/EYES are masculine-only upstream — rule-based feminine with exceptions; GF pairs if signup ever genders them
const ADJ_FEM_FIX: Record<string, string> = { Blancs: "Blanches", Roux: "Rousses" };
const toFeminineAdj = (w: string) => ADJ_FEM_FIX[w] ?? (w.endsWith("s") ? `${w.slice(0, -1)}es` : w);

type Crit = {
  key: string;
  label: string;
  group: string;
  kind: "select" | "number" | "text" | "multi";
  options?: readonly (string | GF)[];
  gendered?: boolean;
  vary?: "natMasc" | "adjFem";
  list?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  test: (p: SwivvProfile, v: string) => boolean;
};

const CRITERIA: Crit[] = [
  { key: "gender", label: "Je recherche", group: "L'essentiel", kind: "select", options: ["Femme", "Homme"], test: (p, v) => p.gender === (v === "Femme" ? "woman" : "man") },
  { key: "ageMin", label: "Âge min", group: "L'essentiel", kind: "number", placeholder: "18", test: (p, v) => !Number.isFinite(p.age) || p.age >= Number(v) },
  { key: "ageMax", label: "Âge max", group: "L'essentiel", kind: "number", placeholder: "99", test: (p, v) => !Number.isFinite(p.age) || p.age <= Number(v) },
  { key: "country", label: "Pays", group: "L'essentiel", kind: "select", options: PAYS, test: inc((p) => p.country) },
  { key: "city", label: "Ville", group: "L'essentiel", kind: "text", list: "cities", placeholder: "Peu importe", test: inc((p) => p.city) },
  { key: "maxDistance", label: "Distance max (km)", group: "L'essentiel", kind: "number", placeholder: "Peu importe", test: (p, v) => p.distanceKm <= Number(v) },
  { key: "nationality", label: "Nationalité", group: "L'essentiel", kind: "select", options: NATS, vary: "natMasc", test: natTest },
  { key: "lookingFor", label: "Recherche", group: "L'essentiel", kind: "select", options: LOOKING, test: inc((p) => p.lookingFor) },
  { key: "maritalStatus", label: "Statut matrimonial", group: "L'essentiel", kind: "select", options: MARITAL, gendered: true, test: inc((p) => p.maritalStatus) },
  { key: "heightMin", label: "Taille min (cm)", group: "Apparence", kind: "number", min: 130, max: 220, placeholder: "130", test: (p, v) => (p.heightCm == null ? true : p.heightCm >= Number(v)) },
  { key: "heightMax", label: "Taille max (cm)", group: "Apparence", kind: "number", min: 130, max: 220, placeholder: "220", test: (p, v) => (p.heightCm == null ? true : p.heightCm <= Number(v)) },
  { key: "weightMin", label: "Poids min (kg)", group: "Apparence", kind: "number", min: 30, max: 200, placeholder: "30", test: (p, v) => (p.weightKg == null ? true : p.weightKg >= Number(v)) },
  { key: "weightMax", label: "Poids max (kg)", group: "Apparence", kind: "number", min: 30, max: 200, placeholder: "Peu importe", test: (p, v) => (p.weightKg == null ? true : p.weightKg <= Number(v)) },
  { key: "hair", label: "Cheveux", group: "Apparence", kind: "select", options: HAIR, vary: "adjFem", test: adjTest((p) => p.hairColor) },
  { key: "eyes", label: "Yeux", group: "Apparence", kind: "select", options: EYES, vary: "adjFem", test: adjTest((p) => p.eyeColor) },
  { key: "silhouette", label: "Silhouette", group: "Apparence", kind: "select", options: BODY, gendered: true, test: inc((p) => p.bodyStyle) },
  { key: "ethnicity", label: "Origine", group: "Apparence", kind: "select", options: ETHNI, gendered: true, test: inc((p) => p.ethnicity) },
  { key: "style", label: "Style vestimentaire", group: "Apparence", kind: "select", options: STYLE, gendered: true, test: inc((p) => p.selfAppearance) },
  { key: "drink", label: "Alcool", group: "Style de vie", kind: "select", options: DRINK, test: inc((p) => p.drink) },
  { key: "smoke", label: "Tabac", group: "Style de vie", kind: "select", options: SMOKE, test: inc((p) => p.smoke) },
  { key: "drugs", label: "Drogue", group: "Style de vie", kind: "select", options: DRUGS, test: inc((p) => p.drugs) },
  { key: "eating", label: "Alimentation", group: "Style de vie", kind: "select", options: EAT, test: inc((p) => p.eatingHabits) },
  { key: "occupation", label: "Métier", group: "Style de vie", kind: "select", options: METIERS, gendered: true, test: inc((p) => p.occupation) },
  { key: "employment", label: "Situation pro", group: "Style de vie", kind: "select", options: JOB, gendered: true, test: inc((p) => p.employmentStatus) },
  { key: "income", label: "Revenus", group: "Style de vie", kind: "select", options: INCOME, gendered: true, test: inc((p) => p.annualIncome) },
  { key: "living", label: "Logement", group: "Style de vie", kind: "select", options: LIVING, gendered: true, test: inc((p) => p.livingSituation) },
  { key: "relocate", label: "Déménagement accepté", group: "Style de vie", kind: "select", options: RELOCATE, test: (p, v) => p.willingToRelocate === RELOCATE_MAP[v] },
  { key: "hasPets", label: "Animaux", group: "Style de vie", kind: "select", options: YESNO, test: (p, v) => norm(p.hasPets) === norm(v) },
  { key: "wantsMorePets", label: "Veut (d'autres) animaux", group: "Style de vie", kind: "select", options: ["Oui", "Non", "Peut-être"], test: inc((p) => p.wantsMorePets) },
  { key: "education", label: "Niveau d'études", group: "Style de vie", kind: "select", options: EDUC, test: inc((p) => p.education) },
  { key: "haveChildren", label: "Enfants", group: "Famille", kind: "select", options: YESNO, test: (p, v) => norm(p.haveChildren) === norm(v) },
  { key: "wantMoreChildren", label: "Veut (d'autres) enfants", group: "Famille", kind: "select", options: ["Oui", "Non", "Peut-être"], test: inc((p) => p.wantMoreChildren) },
  { key: "familyValues", label: "Valeurs familiales", group: "Famille", kind: "select", options: FAMILY_VALUES, test: inc((p) => p.familyValues) },
  { key: "firstLanguage", label: "Langue maternelle", group: "Origines & valeurs", kind: "select", options: FIRSTLANGS, test: (p, v) => norm(p.firstLanguage) === norm(v) || (p.languages ?? []).some((l) => norm(l) === norm(v)) },
  { key: "languages", label: "Autres langues", group: "Origines & valeurs", kind: "multi", placeholder: "Choisir…", test: inc((p) => [p.otherLanguages, ...(p.languages ?? [])].join(" ")) },
  { key: "born", label: "Religion de naissance", group: "Origines & valeurs", kind: "select", options: BORN, gendered: true, test: inc((p) => p.bornOrConverted) },
  { key: "religion", label: "Religion", group: "Origines & valeurs", kind: "select", options: RELIGION, gendered: true, test: inc((p) => p.religion) },
  { key: "practice", label: "Pratique religieuse", group: "Origines & valeurs", kind: "select", options: PRACTICE, gendered: true, test: inc((p) => p.religiousValues) },
];

// ponytail: fixed group order + icons — derive from CRITERIA if groups ever become dynamic
const GROUP_META: Record<string, typeof User> = {
  "L'essentiel": User,
  Apparence: Sparkles,
  "Style de vie": Coffee,
  Famille: Users,
  "Origines & valeurs": Globe,
};
const fieldCls =
  "w-full rounded-xl border border-border bg-[#fafafa] px-3 py-2.5 text-sm transition-colors placeholder:text-[#6b6b73] focus:border-[#e60050] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e60050]/30";

// ponytail: static grouping, no dnd — virtualize if criteria ever pass ~100
const GROUPS: { name: string; items: Crit[] }[] = [];
for (const c of CRITERIA) {
  const g = GROUPS.find((x) => x.name === c.group);
  if (g) g.items.push(c);
  else GROUPS.push({ name: c.group, items: [c] });
}
// Taille/poids render as one full-width pair slot.
const PAIR_SKIP = new Set(["heightMax", "weightMin", "weightMax"]);

// ponytail: edit = criteria editor (Mes Matches, saves), search = results viewer (Recherche Avancée, live filters) — split files if the layouts ever diverge
export function MatchesPage({ title = "Mes Matches", mode = "edit" }: { title?: string; mode?: "edit" | "search" }) {
  const t = useT();
  const { user, loading } = useAuth();
  const [form, setForm] = useState<Record<string, string>>(load);
  const [hUnit, setHUnit] = useState("cm");
  const [wUnit, setWUnit] = useState("kg");
  const numOrNull = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? null : Number(v));

  const heightInput = (key: "heightMin" | "heightMax", placeholder: string) => {
    const raw = form[key] ?? "";
      const cls = "w-full min-w-0 max-w-20 rounded-xl border border-border px-2 py-2.5 text-sm placeholder:text-[#6b6b73]";
    if (hUnit === "cm") {
      return (
        <input type="number" value={raw} min={130} max={220} placeholder={placeholder}
          aria-label={key === "heightMin" ? t("Taille min en centimètres") : t("Taille max en centimètres")}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={cls} />
      );
    }
    const [ft, inch] = numOrNull(raw) == null ? ["", ""] : cmToFtIn(Number(raw));
    return (
      <span className="flex min-w-0 flex-1 gap-1">
        <input value={ft} inputMode="numeric" placeholder={key === "heightMin" ? "4" : "7"}
          aria-label={key === "heightMin" ? t("Taille min en pieds") : t("Taille max en pieds")}
          onChange={(e) => setForm({ ...form, [key]: ftInToCm(e.target.value, inch) })} className={cls} />
        <input value={inch} inputMode="numeric" placeholder="″"
          aria-label={key === "heightMin" ? t("Taille min en pouces") : t("Taille max en pouces")}
          onChange={(e) => setForm({ ...form, [key]: ftInToCm(ft, e.target.value) })} className={cls} />
      </span>
    );
  };

  const weightInput = (key: "weightMin" | "weightMax", placeholder: string) => {
    const raw = form[key] ?? "";
    const shown = wUnit === "kg" || numOrNull(raw) == null ? raw : kgToSt(Number(raw));
    return (
      <input type={wUnit === "kg" ? "number" : "text"} value={shown} min={30} max={200} placeholder={placeholder}
        inputMode="decimal"
        aria-label={key === "weightMin" ? t("Poids min") : t("Poids max")}
        onChange={(e) => setForm({ ...form, [key]: wUnit === "kg" ? e.target.value : stToKg(e.target.value) })}
        className="w-full min-w-0 max-w-20 rounded-xl border border-border px-2 py-2.5 text-sm placeholder:text-[#6b6b73]" />
    );
  };
  const [savedFlash, setSavedFlash] = useState(false);
  const [, force] = useState(0);
  // ponytail: block/unblock refilters instantly — same store subscribe as browse/swipe
  useEffect(() => subscribe(() => force((x) => x + 1)), []);
  const resultsRef = useRef<HTMLElement>(null);
  // ponytail: server criteria win when strictly newer — local edits push on save
  useEffect(() => {
    if (!user) return;
    markMatchCriteriaVisited();
    pullMatchCriteria().then((server) => {
      if (server) setForm(server);
    }).catch(() => {});
  }, [user]);
  const sought = form.gender === "Homme" ? "man" : "woman";
  const { profiles: members, hasMore, loadMore } = usePublicProfiles();
  // ponytail: above the logged-out early return (Rules of Hooks) — it self-fills when the profile loads
  const viewer = useMyCity();
  const cities = [...new Set([...FRANCE_CITIES, ...SWIVV_PROFILES.map((p) => p.city)])].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );

  const critField = (c: Crit) => {
    // ponytail: "Veuf / Veuve" style pairs resolve to the sought side — GF pairs if more appear
    let opts = c.gendered
      ? forGender(c.options as readonly GF[], sought)
      : ((c.options as string[] | undefined) ?? []).slice();
    if (!c.gendered) {
      if (c.vary === "natMasc" && sought === "man") opts = opts.map(toMasculineNat);
      if (c.vary === "adjFem" && sought === "woman") opts = opts.map(toFeminineAdj);
      opts = opts.map((o) => (o.includes(" / ") ? (sought === "man" ? o.split(" / ")[0].trim() : o.split(" / ")[1].trim()) : o));
    }
    if (c.key === "heightMin") {
      return (
        // ponytail: height above weight on all screens — side-by-side again if horizontal space ever allows it
        <div className="grid gap-3">
          <div>
            <span id="m-taille" className="mb-1 block text-sm font-medium text-[#333]">{t("Taille min – max")}</span>
            <div className="flex items-center gap-1" role="group" aria-labelledby="m-taille">
              {heightInput("heightMin", "130")}
              <span className="text-[#6b6b73]">–</span>
              {heightInput("heightMax", "220")}
              <div className="w-24 shrink-0">
                <Seg value={hUnit} onChange={setHUnit} options={["cm", "ft"]} />
              </div>
            </div>
          </div>
          <div>
            <span id="m-poids" className="mb-1 block text-sm font-medium text-[#333]">{t("Poids min – max")}</span>
            <div className="flex items-center gap-1" role="group" aria-labelledby="m-poids">
              {weightInput("weightMin", "30")}
              <span className="text-[#6b6b73]">–</span>
              {weightInput("weightMax", "Peu importe")}
              <div className="w-24 shrink-0">
                <Seg value={wUnit} onChange={setWUnit} options={["kg", "st"]} />
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <>
        <label htmlFor={`m-${c.key}`} className="mb-1 block text-sm font-medium text-[#333]">
          {t(c.label)}
        </label>
        {c.kind === "multi" ? (
          <details className="relative rounded-xl border border-border bg-white">
            <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-[#333] [&::-webkit-details-marker]:hidden">
              {(() => {
                const sel = (form[c.key] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                return sel.length === 0 ? t(c.placeholder ?? "Choisir…") : sel.join(", ");
              })()}
            </summary>
            <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-white p-1 shadow-lg">
              {FIRSTLANGS.map((l) => {
                const sel = (form[c.key] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                return (
                  <label key={l} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-[#333] hover:bg-[#f2f2f2]">
                    <input
                      type="checkbox"
                      checked={sel.includes(l)}
                      onChange={() => setForm({ ...form, [c.key]: sel.includes(l) ? sel.filter((x) => x !== l).join(", ") : [...sel, l].join(", ") })}
                      className="h-4 w-4 accent-[#e60050]"
                    />
                    {l}
                  </label>
                );
              })}
            </div>
          </details>
        ) : c.kind === "select" ? (
          <select
            id={`m-${c.key}`}
            value={form[c.key] ?? ""}
            onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
          >
            <option value="">{t("Indifférent")}</option>
            {opts.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : (
          <>
            <input
              id={`m-${c.key}`}
              type={c.kind === "number" ? "number" : "text"}
              value={form[c.key] ?? ""}
              onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
              placeholder={c.placeholder ? t(c.placeholder) : undefined}
              list={c.list}
              min={c.min}
              max={c.max}
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm placeholder:text-[#6b6b73]"
            />
            {c.list === "cities" && (
              <datalist id="cities">
                {cities.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            )}
          </>
        )}
      </>
    );
  };

  // ponytail: blank while the session restores — the connect screen flashing on every refresh is worse than a beat of nothing
  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-black text-white">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
        <main className="mx-auto max-w-2xl px-4 py-8 text-center">
          <p className="text-sm text-[#5c5c66]">{t("Connecte-toi pour découvrir tes matches.")}</p>
          <button type="button" onClick={() => openAuthModal("account", "signin")} className="mt-4 rounded-md bg-[#e60050] px-6 py-3 font-medium text-white">
            {t("Se connecter / S'inscrire")}
          </button>
        </main>
        <SwivvFooter />
      </div>
    );
  }

  // ponytail: reset = factory defaults + kept gender (load() would restore saved criteria and look dead) — shared by both reset buttons
  const resetForm = () => setForm({ ...EMPTY, gender: form.gender || EMPTY.gender });

  // ponytail: both modes rank live from the form (edit = what you'll save, search = scratch filters) — debounced server scoring if profiles ever leave the seed list
  const crit = form;
  const rdist = (p: SwivvProfile) => realDistance(viewer.city, viewer.country, p);
  const results = crit
    ? (() => {
        // ponytail: normalized block check (same u:-mismatch class as browse) — seeds + members share this pool
        // ponytail: no soft criteria = static compatibility leads (matches the badges) — blend into score() if ranking ever needs one pass
        const hasSoft = Object.entries(crit).some(([k, v]) => !HARD.has(k) && (v ?? "").trim() !== "");
        // ponytail: highest criteria score first, then nearest, then age closeness — weights if ranking ever needs tuning
        const mid = ((Number(crit.ageMin) || 18) + (Number(crit.ageMax) || 99)) / 2;
        return [...SWIVV_PROFILES, ...members].map((p) => ({ p, km: rdist(p), ...score(p, crit, rdist) }))
          .filter((r) => r.hard && !isThreadBlocked(r.p.id))
          .sort((a, b) => (hasSoft ? b.pct - a.pct : b.p.compatibility - a.p.compatibility) || a.km - b.km || Math.abs(a.p.age - mid) - Math.abs(b.p.age - mid) || b.p.compatibility - a.p.compatibility);
      })()
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-black text-white">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-medium text-[#333]">{t(title)}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <p className="min-w-0 flex-1 text-sm text-[#5c5c66]">{mode === "edit" ? t("Sélectionne tes critères puis sauvegarde : ils définissent ton % de compatibilité partout sur le site, et les profils correspondants s'affichent ci-dessous, meilleurs en premier.") : t("Dis-nous qui tu cherches, on te montre les meilleurs profils en premier. Tes critères enregistrés dans Mes Matches sont chargés par défaut.")}</p>
          {mode === "search" && (
            <button
              type="button"
              onClick={resetForm}
              className="shrink-0 rounded-xl bg-[#e60050] px-4 py-2 text-sm font-medium text-white shadow-sm"
            >
              {t("Réinitialiser")}
            </button>
          )}
        </div>

        {/* ponytail: sidebar filters + results grid on desktop, stacked on mobile — drawer if the sidebar ever crowds small laptops */}
        {/* ponytail: edit mode goes full-width (no results column) — grid wrapper only in search mode */}
        <div className={mode === "search" ? "mt-6 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-6" : "mt-6"}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // ponytail: local first, server second — pull on mount adopts the strictly newer side
            markMatchCriteriaSaved();
            if (JSON.stringify(form) !== JSON.stringify(load())) {
              try {
                localStorage.setItem(KEY, JSON.stringify(form));
              } catch {}
              void pushMatchCriteria(form);
            }
            if (mode === "edit") {
              setSavedFlash(true);
              setTimeout(() => setSavedFlash(false), 2500);
            }
          }}
          className={mode === "search" ? "space-y-6 lg:sticky lg:top-4" : "space-y-6"}
        >
          {GROUPS.map((g) => {
            const Icon = GROUP_META[g.name] ?? User;
            const set = g.items.filter((c) => (form[c.key] ?? "").trim() !== "").length;
            return (
              <section key={g.name} aria-label={g.name} className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5">
                <h2 className="mb-3 flex items-center gap-2 font-medium text-[#333]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e60050]/10">
                    <Icon className="h-4 w-4 text-[#e60050]" aria-hidden="true" />
                  </span>
                  {t(g.name)}
                  {set > 0 && (
                    <span className="max-w-full whitespace-normal break-words rounded-2xl bg-[#e60050] px-3 py-1 text-center text-xs font-medium leading-snug text-white">{set === 1 ? t("1 critère rempli dans cette section") : t("{n} critères remplis dans cette section", { n: set })}</span>
                  )}
                </h2>
                {/* ponytail: 2-up on phones to shorten the scroll, height/weight keeps its full-width pair slot — 3-up if fields ever shrink */}
                <div className={mode === "search" ? "grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-1" : "grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-3"}>
                  {g.items.map((c) => {
                    if (PAIR_SKIP.has(c.key)) return null;
                    return (
                      <div key={c.key} className={c.key === "heightMin" ? "col-span-2 sm:col-span-full lg:col-span-1" : undefined}>
                        {critField(c)}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {/* ponytail: static save bar in edit mode so results sit directly below it — sticky only if the filter list ever outgrows the viewport */}
          <div className={mode === "search" ? "sticky bottom-0 -mx-4 border-t border-border bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6" : "border-t border-border py-3"}>
            <div className="flex flex-col gap-2 sm:flex-row">
            {mode === "edit" ? (
              <button type="submit" className="w-full rounded-xl bg-[#e60050] px-4 py-3 font-medium text-white shadow-sm sm:w-auto sm:px-8">
                {t("Sauvegarder mes critères")}
              </button>
            ) : (
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl bg-[#e60050] px-4 py-3 font-medium text-white shadow-sm"
              >
                {t("Réinitialiser")}
              </button>
            )}
            {savedFlash && (
              <p role="status" className="self-center text-sm font-medium text-green-700">{t("Critères sauvegardés ✓")}</p>
            )}
            </div>
          </div>
        </form>

        {results && (
          <section ref={resultsRef} aria-label={t("Résultats")} className={mode === "search" ? "mt-8 scroll-mt-4 lg:mt-0" : "mt-8"}>
            <h2 className="font-medium text-[#333]">
              {results.length === 1 ? t("1 profil, meilleur match en premier") : t("{n} profils, meilleur match en premier", { n: results.length })}
            </h2>
            {results.length === 0 ? (
              <p className="mt-2 text-sm text-[#5c5c66]">{t("Aucun profil avec ces critères. Élargis ta recherche.")}</p>
            ) : (
              <div className={mode === "search" ? "mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4" : "mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5"}>
                {results.map(({ p, km }) => (
                  <article key={p.id} className="overflow-hidden rounded-lg bg-white">
                    <div className="relative">
                      <Link to="/member/$id" params={{ id: p.id }}>
                        <img src={p.photo} alt={t("Photo de {name}", { name: p.name })} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                      </Link>
                      <PhotoCountBadge n={p.photos.length} />
                      {/* ponytail: same like-toggle as /browse (auth-gated, rerender via force) — extract a <LikeHeart> if a third grid needs it */}
                      <button
                        type="button"
                        onClick={() =>
                          requireSwivvAuth("like", () => {
                            toggleLike(p.id);
                            force((x) => x + 1);
                          })
                        }
                        aria-label={getLikes().includes(p.id) ? t("Retirer le like de {name}", { name: p.name }) : t("Liker {name}", { name: p.name })}
                        aria-pressed={getLikes().includes(p.id)}
                        className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm"
                      >
                        <Heart className={`h-4 w-4 ${getLikes().includes(p.id) ? "fill-red-500 text-red-500" : "text-[#555]"}`} />
                      </button>
                      {/* ponytail: CSS-only tooltip (no JS lib) — popover API if positioning ever needs flipping */}
                      <span className="absolute left-2 top-2">
                        <MatchTooltip
                          badge={
                            <span className="block rounded-full bg-[#e60050] px-2 py-0.5 text-[11px] font-bold text-white">
                              {displayPct(p, form)}%
                            </span>
                          }
                          items={topMatches(p, form, 12, km)}
                          criteria={form}
                          fem={p.gender === "woman"}
                        />
                      </span>
                    </div>
                    <Link to="/member/$id" params={{ id: p.id }} className="block p-2.5">
                      <p className="text-[15px] font-medium text-[#333]">{nameAge(p)}</p>
                      <p className="text-[13px] text-[#6b6b73]">{p.city} · {km} km</p>
                    </Link>
                  </article>
                ))}
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
          </section>
        )}
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
