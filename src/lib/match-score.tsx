import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import type { SwivvProfile } from "@/lib/swivv-data";
import { HINT_SKIN } from "@/components/swivv-hint";
import { useT } from "@/lib/i18n";
import { MATCH_CRITERIA_KEY as KEY, hasSavedMatchCriteria, hasVisitedMatchCriteria } from "@/lib/swivv-store";

// ponytail: single source of matching truth — routes/matches.tsx CRITERIA reuses these
// predicates/helpers for its editor; change tests here, wire labels/options there
export const norm = (v: string | undefined) => (v ?? "").toLowerCase().trim();
// ponytail: two-way contains because neither side uses strict enums — exact option ids if signup ever constrains them
export const inc = (get: (p: SwivvProfile) => string | undefined) => (p: SwivvProfile, v: string) => {
  const a = norm(get(p));
  const b = norm(v);
  return !!a && a !== "—" && !!b && (a.includes(b) || b.includes(a));
};
export const stem = (s: string) => norm(s).replace(/e$/, "");
const ADJ_STEM_FIX: Record<string, string> = { blanches: "blanc", rousses: "roux" };
const stemAdj = (s: string) => {
  const n = norm(s);
  if (ADJ_STEM_FIX[n]) return ADJ_STEM_FIX[n];
  return n.length > 4 ? n.replace(/es$/, "").replace(/s$/, "") : n;
};
export const adjTest = (get: (p: SwivvProfile) => string | undefined) => (p: SwivvProfile, v: string) => {
  const a = stemAdj(get(p) ?? "");
  const b = stemAdj(v);
  return !!a && !!b && (a.includes(b) || b.includes(a));
};
export const natTest = (p: SwivvProfile, v: string) => {
  const b = stem(v);
  if (!b) return false;
  return norm(p.nationality)
    .split(/[^a-zàâäéèêëîïôöùûüç]+/i)
    .some((part) => {
      const a = stem(part);
      return !!a && (a.includes(b) || b.includes(a));
    });
};

export const RELOCATE_MAP: Record<string, string> = { Oui: "yes", Non: "no", "Peut-être": "maybe" };

export const HARD = new Set(["gender", "ageMin", "ageMax", "maxDistance"]);
export const EMPTY: Record<string, string> = { gender: "Femme", ageMin: "18", ageMax: "99" };

type Test = (p: SwivvProfile, v: string) => boolean;
export const TESTS: Record<string, Test> = {
  gender: (p, v) => p.gender === (v === "Femme" ? "woman" : "man"),
  ageMin: (p, v) => p.age >= Number(v),
  ageMax: (p, v) => p.age <= Number(v),
  country: inc((p) => p.country),
  city: inc((p) => p.city),
  maxDistance: (p, v) => p.distanceKm <= Number(v),
  nationality: natTest,
  lookingFor: inc((p) => p.lookingFor),
  maritalStatus: inc((p) => p.maritalStatus),
  heightMin: (p, v) => p.heightCm >= Number(v),
  heightMax: (p, v) => p.heightCm <= Number(v),
  weightMin: (p, v) => (p.weightKg == null ? true : p.weightKg >= Number(v)),
  weightMax: (p, v) => (p.weightKg == null ? true : p.weightKg <= Number(v)),
  hair: adjTest((p) => p.hairColor),
  eyes: adjTest((p) => p.eyeColor),
  silhouette: inc((p) => p.bodyStyle),
  ethnicity: inc((p) => p.ethnicity),
  style: inc((p) => p.selfAppearance),
  drink: inc((p) => p.drink),
  smoke: inc((p) => p.smoke),
  drugs: inc((p) => p.drugs),
  eating: inc((p) => p.eatingHabits),
  occupation: inc((p) => p.occupation),
  employment: inc((p) => p.employmentStatus),
  income: inc((p) => p.annualIncome),
  living: inc((p) => p.livingSituation),
  relocate: (p, v) => p.willingToRelocate === RELOCATE_MAP[v],
  hasPets: (p, v) => norm(p.hasPets) === norm(v),
  wantsMorePets: inc((p) => p.wantsMorePets),
  education: inc((p) => p.education),
  haveChildren: (p, v) => norm(p.haveChildren) === norm(v),
  wantMoreChildren: inc((p) => p.wantMoreChildren),
  familyValues: inc((p) => p.familyValues),
  firstLanguage: (p, v) => norm(p.firstLanguage) === norm(v) || (p.languages ?? []).some((l) => norm(l) === norm(v)),
  languages: inc((p) => [p.otherLanguages, ...(p.languages ?? [])].join(" ")),
  born: inc((p) => p.bornOrConverted),
  religion: inc((p) => p.religion),
  practice: inc((p) => p.religiousValues),
};

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
    if (!TESTS[k]!(p, v)) return { pct: 0, hard: false };
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
  for (const [key, test] of Object.entries(TESTS)) {
    if (HARD.has(key)) continue;
    if (key === "interests") {
      const want = (c.interests ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (!want.length) continue;
      total += want.length;
      pts += want.filter((w) => p.interests.some((i) => i.toLowerCase().includes(w))).length;
      continue;
    }
    const v = (c[key] ?? "").trim();
    if (!v) continue;
    total += wOf(key);
    if (test(p, v)) pts += wOf(key);
  }
  return { pct: total === 0 ? 100 : Math.round((100 * pts) / total), hard: true };
}

// ponytail: criteria score is the single source of truth — homepage carousels mirror it via displayPct;
// static compatibility only shows when no soft criteria are set
export function displayPct(p: SwivvProfile, c: Record<string, string>): number {
  const soft = Object.entries(c).some(([k, v]) => !HARD.has(k) && (v ?? "").trim() !== "");
  // ponytail: server members carry no static compatibility — compute instead of rendering a bare "%"; block/unblock touches neither input, so the number can't shift under it
  if (soft) return score(p, c).pct;
  return Number.isFinite(p.compatibility) ? p.compatibility : score(p, c).pct;
}

// ponytail: logged-out prompt shared by every profile list — one copy so the wording can't drift; plain text because cards already sit inside a profile <Link> (nested buttons break taps)
export function MatchLoginPrompt({ name, className = "" }: { name: string; className?: string }) {
  const t = useT();
  return (
    <span className={`block text-[11px] font-medium leading-snug text-[#e60050] ${className}`}>
      {t("Connecte-toi ou inscris-toi pour voir à quel point tu matches avec {name}.", { name })}
    </span>
  );
}

// ponytail: CSS-only black tooltip shared with the member page — popover API if positioning ever needs flipping
// ponytail: unsaved-criteria hint links to /matches (pointer events on only then) — back to text-only if the link ever misfires on touch
// ponytail: fem boolean (not full gender union) — pass profile if the tooltip ever needs more than agreement
export function MatchTooltip({ badge, items, fem, criteria }: { badge: ReactNode; items: string[]; fem?: boolean; criteria?: Record<string, string> }) {
  // ponytail: hint only when NO criteria exist anywhere (soft fields + the device-local flags). The flags alone wrongly showed it on a device that had synced a saved copy but never opened Mes Matches there.
  const c = criteria ?? load();
  const hasSoft = Object.entries(c).some(([k, v]) => !HARD.has(k) && (v ?? "").trim() !== "");
  const hint = !hasSoft && !hasVisitedMatchCriteria() && !hasSavedMatchCriteria();
  // ponytail: tap-to-open for touch (hover is a no-op there) — add outside-tap close / flip positioning if it ever feels sticky
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <span className="group/pct relative inline-block" onMouseLeave={() => setOpen(false)}>
      <span
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="inline-block cursor-pointer"
      >
        {badge}
      </span>
      <span className={`${hint ? "" : "pointer-events-none"} ${open ? "block" : "hidden"} absolute left-0 top-full z-10 mt-1 w-48 p-2.5 text-left group-hover/pct:block ${HINT_SKIN}`}>
        {!hint ? (
          items.map((m) => (
            <span key={m} className="block">✓ {m}</span>
          ))
        ) : (
          // ponytail: explicit text-white (link cascade) + before: bridge over the mt-1 hover gap so the click lands — popover API if touch ever needs it
          <Link to="/matches" className="block py-1 text-white underline underline-offset-2 before:absolute before:-top-1 before:left-0 before:h-1 before:w-full before:content-['']">
            {t("Clique sur Mes Matches pour définir ton Swivv parfait{e} !", { e: fem ? "e" : "" })}
          </Link>
        )}
      </span>
    </span>
  );
}

// ponytail: fixed importance order per spec (not CRITERIA order) — derive from CRITERIA if the list ever grows dynamic; unset/unmatched/unfilled lines drop and the list compresses; values raw as stored (relocate ids mapped, the rest French labels)
// ponytail: km passed by results grids and the member page alike — the Distance line drops itself when unset, too far, or non-finite
export function topMatches(p: SwivvProfile, c: Record<string, string>, n = 12, km?: number): string[] {
  const test = (k: string) => TESTS[k]!(p, (c[k] ?? "").trim());
  const set = (k: string) => (c[k] ?? "").trim() !== "";
  const has = (v: unknown) => v != null && String(v).trim() !== "" && v !== "—";
  const out: string[] = [];
  const line = (ok: boolean, s: string) => { if (ok && out.length < n) out.push(s); };
  line(set("country") && test("country") && has(p.country), `Country: ${p.country}`);
  line(set("city") && test("city") && has(p.city), `City/Town: ${p.city}`);
  line(set("maxDistance") && km != null && Number.isFinite(km) && (km as number) <= Number(c.maxDistance), `Distance: ${Math.round(km as number)} km`);
  line(p.age >= Number(c.ageMin || 18) && p.age <= Number(c.ageMax || 99), `Age: ${p.age}`);
  line(set("maritalStatus") && test("maritalStatus") && has(p.maritalStatus), `Marital Status: ${p.maritalStatus}`);
  line(set("religion") && test("religion") && has(p.religion), `Religion: ${p.religion}`);
  line(set("nationality") && test("nationality") && has(p.nationality), `Nationality: ${p.nationality}`);
  line(set("haveChildren") && test("haveChildren") && has(p.haveChildren), `Children: ${p.haveChildren}`);
  line(set("wantMoreChildren") && test("wantMoreChildren") && has(p.wantMoreChildren), `Wants Children: ${p.wantMoreChildren}`);
  line(set("income") && test("income") && has(p.annualIncome), `Salary: ${p.annualIncome}`);
  line(set("living") && test("living") && has(p.livingSituation), `Logement: ${p.livingSituation}`);
  const rel = { yes: "Yes", no: "No", maybe: "Maybe" }[(p.willingToRelocate ?? "") as "yes" | "no" | "maybe"];
  line(set("relocate") && test("relocate") && !!rel, `Willing to move: ${rel}`);
  line(set("firstLanguage") && test("firstLanguage") && has(p.firstLanguage), `First language: ${p.firstLanguage}`);
  line(set("education") && test("education") && has(p.education), `Level of Study: ${p.education}`);
  return out;
}
