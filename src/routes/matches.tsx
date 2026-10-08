import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Coffee, Globe, Sparkles, User, Users } from "lucide-react";
import { SWIVV_PROFILES, type SwivvProfile } from "@/lib/swivv-data";
import { realDistance, useMyCity } from "@/lib/location-distance";
import { getBlocked, hasSavedMatchCriteria, hasVisitedMatchCriteria, markMatchCriteriaSaved, markMatchCriteriaVisited, MATCH_CRITERIA_KEY as KEY, pullMatchCriteria, pushMatchCriteria } from "@/lib/swivv-store";
import { useAuth } from "@/hooks/use-auth";
import { SwivvAuthButtons, openAuthModal, usePublicProfiles } from "@/lib/swivv-auth";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { PhotoCountBadge } from "@/components/photo-count-badge";
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

const norm = (v: string | undefined) => (v ?? "").toLowerCase().trim();
// ponytail: two-way contains because neither side uses strict enums — exact option ids if signup ever constrains them
const inc = (get: (p: SwivvProfile) => string | undefined) => (p: SwivvProfile, v: string) => {
  const a = norm(get(p));
  const b = norm(v);
  return !!a && a !== "—" && !!b && (a.includes(b) || b.includes(a));
};
const stem = (s: string) => norm(s).replace(/e$/, "");
// ponytail: NATS is feminine-only upstream — rule-based masculine with exceptions; CLDR-sourced masculine list if it drifts
const NAT_MASC_KEEP = new Set(["Belge", "Biélorusse", "Bosniaque", "Guatémaltèque", "Monégasque", "Tchèque", "Britannique", "Russe", "Slovaque", "Suisse"]);
const NAT_MASC_FIX: Record<string, string> = { Grecque: "Grec", Turque: "Turc" };
const toMasculineNat = (w: string) => NAT_MASC_FIX[w] ?? (NAT_MASC_KEEP.has(w) ? w : w.replace(/e$/, ""));
// ponytail: HAIR/EYES are masculine-only upstream — rule-based feminine with exceptions; GF pairs if signup ever genders them
const ADJ_FEM_FIX: Record<string, string> = { Blancs: "Blanches", Roux: "Rousses" };
const toFeminineAdj = (w: string) => ADJ_FEM_FIX[w] ?? (w.endsWith("s") ? `${w.slice(0, -1)}es` : w);
const ADJ_STEM_FIX: Record<string, string> = { blanches: "blanc", rousses: "roux" };
const stemAdj = (s: string) => {
  const n = norm(s);
  if (ADJ_STEM_FIX[n]) return ADJ_STEM_FIX[n];
  return n.length > 4 ? n.replace(/es$/, "").replace(/s$/, "") : n;
};
const adjTest = (get: (p: SwivvProfile) => string | undefined) => (p: SwivvProfile, v: string) => {
  const a = stemAdj(get(p) ?? "");
  const b = stemAdj(v);
  return !!a && !!b && (a.includes(b) || b.includes(a));
};
const natTest = (p: SwivvProfile, v: string) => {
  const b = stem(v);
  if (!b) return false;
  return norm(p.nationality)
    .split(/[^a-zàâäéèêëîïôöùûüç]+/i)
    .some((part) => {
      const a = stem(part);
      return !!a && (a.includes(b) || b.includes(a));
    });
};

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

// ponytail: canonical cm/kg in form, imperial converts on the fly like signup —
// a shared <UnitInterval> if a third measure appears
const RELOCATE_MAP: Record<string, string> = { Oui: "yes", Non: "no", "Peut-être": "maybe" };

const CRITERIA: Crit[] = [
  { key: "gender", label: "Je recherche", group: "L'essentiel", kind: "select", options: ["Femme", "Homme"], test: (p, v) => p.gender === (v === "Femme" ? "woman" : "man") },
  { key: "ageMin", label: "Âge min", group: "L'essentiel", kind: "number", placeholder: "18", test: (p, v) => p.age >= Number(v) },
  { key: "ageMax", label: "Âge max", group: "L'essentiel", kind: "number", placeholder: "99", test: (p, v) => p.age <= Number(v) },
  { key: "country", label: "Pays", group: "L'essentiel", kind: "select", options: PAYS, test: inc((p) => p.country) },
  { key: "city", label: "Ville", group: "L'essentiel", kind: "text", list: "cities", placeholder: "Peu importe", test: inc((p) => p.city) },
  { key: "maxDistance", label: "Distance max (km)", group: "L'essentiel", kind: "number", placeholder: "Peu importe", test: (p, v) => p.distanceKm <= Number(v) },
  { key: "nationality", label: "Nationalité", group: "L'essentiel", kind: "select", options: NATS, vary: "natMasc", test: natTest },
  { key: "lookingFor", label: "Recherche", group: "L'essentiel", kind: "select", options: LOOKING, test: inc((p) => p.lookingFor) },
  { key: "maritalStatus", label: "Statut matrimonial", group: "L'essentiel", kind: "select", options: MARITAL, gendered: true, test: inc((p) => p.maritalStatus) },
  { key: "heightMin", label: "Taille min (cm)", group: "Apparence", kind: "number", min: 130, max: 220, placeholder: "130", test: (p, v) => p.heightCm >= Number(v) },
  { key: "heightMax", label: "Taille max (cm)", group: "Apparence", kind: "number", min: 130, max: 220, placeholder: "220", test: (p, v) => p.heightCm <= Number(v) },
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

const HARD = new Set(["gender", "ageMin", "ageMax", "maxDistance"]);
const EMPTY: Record<string, string> = { gender: "Femme", ageMin: "18", ageMax: "99" };

// ponytail: fixed group order + icons — derive from CRITERIA if groups ever become dynamic
const GROUP_META: Record<string, typeof User> = {
  "L'essentiel": User,
  Apparence: Sparkles,
  "Style de vie": Coffee,
  Famille: Users,
  "Origines & valeurs": Globe,
};
const fieldCls =
  "w-full rounded-xl border border-border bg-[#fafafa] px-3 py-2.5 text-sm transition-colors placeholder:text-[#999] focus:border-[#e91e63] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e91e63]/30";

// ponytail: static grouping, no dnd — virtualize if criteria ever pass ~100
const GROUPS: { name: string; items: Crit[] }[] = [];
for (const c of CRITERIA) {
  const g = GROUPS.find((x) => x.name === c.group);
  if (g) g.items.push(c);
  else GROUPS.push({ name: c.group, items: [c] });
}
// Taille/poids render as one full-width pair slot.
const PAIR_SKIP = new Set(["heightMax", "weightMin", "weightMax"]);

export function load(): Record<string, string> {
  // ponytail: sought gender preloaded from the same cache as browse (+ signup fallback so Recherche Avancée is right on first mount) — profile fetch if both ever miss
  let sought = "";
  try {
    const c = localStorage.getItem("swivv-seeking");
    sought = c === "woman" ? "Femme" : c === "man" ? "Homme" : "";
    if (!sought) {
      const g = localStorage.getItem("swivv-signup-gender");
      sought = g === "woman" ? "Homme" : g === "man" ? "Femme" : "";
    }
  } catch {}
  try {
    return { ...EMPTY, ...(sought ? { gender: sought } : {}), ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, string>) };
  } catch {
    return { ...EMPTY, ...(sought ? { gender: sought } : {}) };
  }
}

export function score(p: SwivvProfile, c: Record<string, string>, getDist?: (p: SwivvProfile) => number): { pct: number; hard: boolean } {
  // ponytail: real geo distance when provided (matches page), static seed distance otherwise — migrate callers if seed distances ever go stale
  const dist = getDist ? getDist(p) : p.distanceKm;
  for (const k of HARD) {
    const v = (c[k] ?? "").trim();
    if (!v) continue;
    if (k === "maxDistance") {
      if (dist > Number(v)) return { pct: 0, hard: false };
      continue;
    }
    if (!CRITERIA.find((x) => x.key === k)!.test(p, v)) return { pct: 0, hard: false };
  }
  // ponytail: importance weights mirror the "Comprendre le matching" blog post — retune here and there together
  const WEIGHTS: Record<string, number> = { country: 11, city: 10, maritalStatus: 8, lookingFor: 7, religion: 6, heightMin: 5, heightMax: 5, weightMax: 4, haveChildren: 3, wantMoreChildren: 2, relocate: 1 };
  const wOf = (k: string) => WEIGHTS[k] ?? 1;
  let pts = 0;
  let total = 0;
  // ponytail: distance scores closeness (1 at 0 km → 0 at the max) instead of pass/fail — binary threshold if a gradient ever misleads
  const maxD = Number((c.maxDistance ?? "").trim());
  if (Number.isFinite(maxD) && maxD > 0) {
    total += 9;
    pts += 9 * Math.max(0, 1 - dist / maxD);
  }
  for (const crit of CRITERIA) {
    if (HARD.has(crit.key)) continue;
    if (crit.key === "interests") {
      const want = (c.interests ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (!want.length) continue;
      total += want.length;
      pts += want.filter((w) => p.interests.some((i) => i.toLowerCase().includes(w))).length;
      continue;
    }
    const v = (c[crit.key] ?? "").trim();
    if (!v) continue;
    total += wOf(crit.key);
    if (crit.test(p, v)) pts += wOf(crit.key);
  }
  return { pct: total === 0 ? 100 : Math.round((100 * pts) / total), hard: true };
}

// ponytail: criteria score is the single source of truth — homepage carousels mirror it via displayPct;
// static compatibility only shows when no soft criteria are set
export function displayPct(p: SwivvProfile, c: Record<string, string>): number {
  const soft = Object.entries(c).some(([k, v]) => !HARD.has(k) && (v ?? "").trim() !== "");
  return soft ? score(p, c).pct : p.compatibility;
}

// ponytail: CSS-only black tooltip shared with the member page — popover API if positioning ever needs flipping
// ponytail: unsaved-criteria hint links to /matches (pointer events on only then) — back to text-only if the link ever misfires on touch
// ponytail: fem boolean (not full gender union) — pass profile if the tooltip ever needs more than agreement
export function MatchTooltip({ badge, items, fem }: { badge: ReactNode; items: string[]; fem?: boolean }) {
  // ponytail: hint only for never-visited + never-saved newcomers — one visit or save flips to the ordered match list
  const hint = !hasVisitedMatchCriteria() && !hasSavedMatchCriteria();
  return (
    <span className="group/pct relative inline-block">
      {badge}
      <span className={`${hint ? "" : "pointer-events-none"} absolute left-0 top-full z-10 mt-1 hidden w-48 rounded-lg bg-black p-2.5 text-left text-[11px] font-normal leading-snug text-white shadow-lg group-hover/pct:block`}>
        {!hint ? (
          items.map((m) => (
            <span key={m} className="block">✓ {m}</span>
          ))
        ) : (
          // ponytail: explicit text-white (link cascade) + before: bridge over the mt-1 hover gap so the click lands — popover API if touch ever needs it
          <Link to="/matches" className="block py-1 text-white underline underline-offset-2 before:absolute before:-top-1 before:left-0 before:h-1 before:w-full before:content-['']">
            Cliquez sur Mes Matches pour définir votre Swivv parfait{fem ? "e" : ""} !
          </Link>
        )}
      </span>
    </span>
  );
}

// ponytail: fixed importance order per spec (not CRITERIA order) — derive from CRITERIA if the list ever grows dynamic; unset/unmatched/unfilled lines drop and the list compresses; values raw as stored (relocate ids mapped, the rest French labels)
// ponytail: km passed by results grids only — member page omits it and the Distance line drops
export function topMatches(p: SwivvProfile, c: Record<string, string>, n = 12, km?: number): string[] {
  const test = (k: string) => CRITERIA.find((x) => x.key === k)!.test(p, (c[k] ?? "").trim());
  const set = (k: string) => (c[k] ?? "").trim() !== "";
  const has = (v: unknown) => v != null && String(v).trim() !== "" && v !== "—";
  const out: string[] = [];
  const line = (ok: boolean, s: string) => { if (ok && out.length < n) out.push(s); };
  line(set("country") && test("country") && has(p.country), `Country: ${p.country}`);
  line(set("city") && test("city") && has(p.city), `City/Town: ${p.city}`);
  line(set("maxDistance") && km != null && Number.isFinite(km) && (km as number) <= Number(c.maxDistance), `Distance: ${Math.round(km as number)} km`);
  line(p.age >= Number(c.ageMin || 18) && p.age <= Number(c.ageMax || 99), `Age: ${p.age}`);
  line(set("haveChildren") && test("haveChildren") && has(p.haveChildren), `Children: ${p.haveChildren}`);
  line(set("wantMoreChildren") && test("wantMoreChildren") && has(p.wantMoreChildren), `Wants Children: ${p.wantMoreChildren}`);
  line(set("income") && test("income") && has(p.annualIncome), `Salary: ${p.annualIncome}`);
  line(set("living") && test("living") && has(p.livingSituation), `Logement: ${p.livingSituation}`);
  const rel = { yes: "Yes", no: "No", maybe: "Maybe" }[(p.willingToRelocate ?? "") as "yes" | "no" | "maybe"];
  line(set("relocate") && test("relocate") && !!rel, `Willing to move: ${rel}`);
  line(set("firstLanguage") && test("firstLanguage") && has(p.firstLanguage), `First language: ${p.firstLanguage}`);
  line(set("education") && test("education") && has(p.education), `Level of Study: ${p.education}`);
  line(set("religion") && test("religion") && has(p.religion), `Religion: ${p.religion}`);
  return out;
}

// ponytail: edit = criteria editor (Mes Matches, saves), search = results viewer (Recherche Avancée, live filters) — split files if the layouts ever diverge
export function MatchesPage({ title = "Mes Matches", mode = "edit" }: { title?: string; mode?: "edit" | "search" }) {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<Record<string, string>>(load);
  const [hUnit, setHUnit] = useState("cm");
  const [wUnit, setWUnit] = useState("kg");
  const numOrNull = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? null : Number(v));

  const heightInput = (key: "heightMin" | "heightMax", placeholder: string) => {
    const raw = form[key] ?? "";
      const cls = "w-full min-w-0 max-w-20 rounded-xl border border-border px-2 py-2.5 text-sm placeholder:text-[#999]";
    if (hUnit === "cm") {
      return (
        <input type="number" value={raw} min={130} max={220} placeholder={placeholder}
          aria-label={key === "heightMin" ? "Taille min en centimètres" : "Taille max en centimètres"}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={cls} />
      );
    }
    const [ft, inch] = numOrNull(raw) == null ? ["", ""] : cmToFtIn(Number(raw));
    return (
      <span className="flex min-w-0 flex-1 gap-1">
        <input value={ft} inputMode="numeric" placeholder={key === "heightMin" ? "4" : "7"}
          aria-label={key === "heightMin" ? "Taille min en pieds" : "Taille max en pieds"}
          onChange={(e) => setForm({ ...form, [key]: ftInToCm(e.target.value, inch) })} className={cls} />
        <input value={inch} inputMode="numeric" placeholder="″"
          aria-label={key === "heightMin" ? "Taille min en pouces" : "Taille max en pouces"}
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
        aria-label={key === "weightMin" ? "Poids min" : "Poids max"}
        onChange={(e) => setForm({ ...form, [key]: wUnit === "kg" ? e.target.value : stToKg(e.target.value) })}
        className="w-full min-w-0 max-w-20 rounded-xl border border-border px-2 py-2.5 text-sm placeholder:text-[#999]" />
    );
  };
  const [savedFlash, setSavedFlash] = useState(false);
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
  const members = usePublicProfiles();
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
            <span id="m-taille" className="mb-1 block text-sm font-medium text-[#333]">Taille min – max</span>
            <div className="flex items-center gap-1" role="group" aria-labelledby="m-taille">
              {heightInput("heightMin", "130")}
              <span className="text-[#999]">–</span>
              {heightInput("heightMax", "220")}
              <div className="w-24 shrink-0">
                <Seg value={hUnit} onChange={setHUnit} options={["cm", "ft"]} />
              </div>
            </div>
          </div>
          <div>
            <span id="m-poids" className="mb-1 block text-sm font-medium text-[#333]">Poids min – max</span>
            <div className="flex items-center gap-1" role="group" aria-labelledby="m-poids">
              {weightInput("weightMin", "30")}
              <span className="text-[#999]">–</span>
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
          {c.label}
        </label>
        {c.kind === "multi" ? (
          <details className="relative rounded-xl border border-border bg-white">
            <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-[#333] [&::-webkit-details-marker]:hidden">
              {(() => {
                const sel = (form[c.key] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                return sel.length === 0 ? (c.placeholder ?? "Choisir…") : sel.join(", ");
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
                      className="h-4 w-4 accent-[#e91e63]"
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
            <option value="">Indifférent</option>
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
              placeholder={c.placeholder}
              list={c.list}
              min={c.min}
              max={c.max}
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm placeholder:text-[#999]"
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
        <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
        <main className="mx-auto max-w-2xl px-4 py-8 text-center">
          <p className="text-sm text-[#777]">Connecte-toi pour découvrir tes matches.</p>
          <button type="button" onClick={() => openAuthModal("account", "signin")} className="mt-4 rounded-md bg-[#e91e63] px-6 py-3 font-medium text-white">
            Se connecter / S&apos;inscrire
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
  const viewer = useMyCity();
  const rdist = (p: SwivvProfile) => realDistance(viewer.city, viewer.country, p);
  const results = crit
    ? (() => {
        const blocked = new Set(getBlocked());
        // ponytail: no soft criteria = static compatibility leads (matches the badges) — blend into score() if ranking ever needs one pass
        const hasSoft = Object.entries(crit).some(([k, v]) => !HARD.has(k) && (v ?? "").trim() !== "");
        // ponytail: highest criteria score first, then nearest, then age closeness — weights if ranking ever needs tuning
        const mid = ((Number(crit.ageMin) || 18) + (Number(crit.ageMax) || 99)) / 2;
        return [...SWIVV_PROFILES, ...members].map((p) => ({ p, km: rdist(p), ...score(p, crit, rdist) }))
          .filter((r) => r.hard && !blocked.has(r.p.id))
          .sort((a, b) => (hasSoft ? b.pct - a.pct : b.p.compatibility - a.p.compatibility) || a.km - b.km || Math.abs(a.p.age - mid) - Math.abs(b.p.age - mid) || b.p.compatibility - a.p.compatibility);
      })()
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-medium text-[#333]">{title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <p className="min-w-0 flex-1 text-sm text-[#777]">{mode === "edit" ? "Sélectionne tes critères puis sauvegarde : ils définissent ton % de compatibilité partout sur le site, et les profils correspondants s'affichent ci-dessous, meilleurs en premier." : "Dis-nous qui tu cherches, on te montre les meilleurs profils en premier. Tes critères enregistrés dans Mes Matches sont chargés par défaut."}</p>
          {mode === "search" && (
            <button
              type="button"
              onClick={resetForm}
              className="shrink-0 rounded-xl bg-[#e91e63] px-4 py-2 text-sm font-medium text-white shadow-sm"
            >
              Réinitialiser
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
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e91e63]/10">
                    <Icon className="h-4 w-4 text-[#e91e63]" aria-hidden="true" />
                  </span>
                  {g.name}
                  {set > 0 && (
                    <span className="max-w-full whitespace-normal break-words rounded-2xl bg-[#e91e63] px-3 py-1 text-center text-xs font-medium leading-snug text-white">{set} critère{set > 1 ? "s" : ""} rempli{set > 1 ? "s" : ""} dans cette section</span>
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
              <button type="submit" className="w-full rounded-xl bg-[#e91e63] px-4 py-3 font-medium text-white shadow-sm sm:w-auto sm:px-8">
                Sauvegarder mes critères
              </button>
            ) : (
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl bg-[#e91e63] px-4 py-3 font-medium text-white shadow-sm"
              >
                Réinitialiser
              </button>
            )}
            {savedFlash && (
              <p role="status" className="self-center text-sm font-medium text-green-700">Critères sauvegardés ✓</p>
            )}
            </div>
          </div>
        </form>

        {results && (
          <section ref={resultsRef} aria-label="Résultats" className={mode === "search" ? "mt-8 scroll-mt-4 lg:mt-0" : "mt-8"}>
            <h2 className="font-medium text-[#333]">
              {results.length} profil{results.length > 1 ? "s" : ""}, meilleur match en premier
            </h2>
            {results.length === 0 ? (
              <p className="mt-2 text-sm text-[#777]">Aucun profil avec ces critères. Élargis ta recherche.</p>
            ) : (
              <div className={mode === "search" ? "mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4" : "mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5"}>
                {results.map(({ p, km }) => (
                  <article key={p.id} className="overflow-hidden rounded-lg bg-white">
                    <div className="relative">
                      <Link to="/member/$id" params={{ id: p.id }}>
                        <img src={p.photo} alt={`Photo de ${p.name}`} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                      </Link>
                      <PhotoCountBadge n={p.photos.length} />
                      {/* ponytail: CSS-only tooltip (no JS lib) — popover API if positioning ever needs flipping */}
                      <span className="absolute left-2 top-2">
                        <MatchTooltip
                          badge={
                            <span className="block rounded-full bg-[#e91e63] px-2 py-0.5 text-[11px] font-bold text-white">
                              {displayPct(p, form)}%
                            </span>
                          }
                          items={topMatches(p, form, 12, km)}
                          fem={p.gender === "woman"}
                        />
                      </span>
                    </div>
                    <Link to="/member/$id" params={{ id: p.id }} className="block p-2.5">
                      <p className="text-[15px] font-medium text-[#333]">{p.name}, {p.age}</p>
                      <p className="text-[13px] text-[#999]">{p.city} · {km} km</p>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
