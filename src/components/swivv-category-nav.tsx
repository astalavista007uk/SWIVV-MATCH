import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { useT } from "@/lib/i18n";
import type { EnKey } from "@/lib/locales/en";
import {
  HeartHandshake,
  Images,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
  Wifi,
} from "lucide-react";

const CATEGORIES: EnKey[] = [
  "Recherche avancée",
  "Près de moi",
  "En ligne",
  "Mariage",
  "Relation sérieuse",
  "Nouveaux profils",
  "Photos récentes",
  "Profils populaires",
];

// ponytail: hand-drawn (lucide has no rings) — swap for a brand SVG if design ever supplies one
function WeddingRings({ className }: { className?: string; "aria-hidden"?: "true" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <circle cx="9" cy="14" r="6" />
      <circle cx="15" cy="10" r="6" />
    </svg>
  );
}

// ponytail: icon lookup keyed by label, not a parallel array — add the entry when a category joins
const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string; "aria-hidden"?: "true" }>> = {
  "Recherche avancée": Users,
  "Près de moi": MapPin,
  "En ligne": Wifi,
  Mariage: WeddingRings,
  "Relation sérieuse": HeartHandshake,
  "Nouveaux profils": Sparkles,
  "Photos récentes": Images,
  "Profils populaires": TrendingUp,
};

// ponytail: one category row rendered under every page header — don't re-add per-page copies
export function SwivvCategoryNav() {
  const t = useT();
  return (
    <nav aria-label={t("Catégories")} className="border-b border-white/10 bg-black text-white">
      {/* ponytail: tight wrap fits 2 lines on ~360px+ screens, may take 3 below 320px — scroll row if link count grows */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-1 sm:py-0.5 text-[14px] md:flex-nowrap md:justify-start md:gap-7 md:overflow-x-auto md:text-[15px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c];
          // ponytail: full criteria search lives on /recherche-avancee — new dedicated search pages get their own branch here
          if (c === "Recherche avancée") {
            return (
              <Link
                key={c}
                to="/recherche-avancee"
                className="inline-flex items-center gap-1 whitespace-nowrap text-white hover:underline"
                // ponytail: router-driven active state, no manual path checks — pill bg if underline ever feels quiet
                activeProps={{ className: "inline-flex items-center gap-1 whitespace-nowrap font-medium text-white underline decoration-[#e60050] decoration-2 underline-offset-4" }}
              >
                {Icon && <Icon className="h-3.5 w-3.5 text-[#e60050]" aria-hidden="true" />}
                {t(c)}
              </Link>
            );
          }
          return (
            <Link
              key={c}
              to="/browse"
              search={{ q: c, type: "", location: "" }}
                className="inline-flex items-center gap-1 whitespace-nowrap text-white hover:underline"
                activeProps={{ className: "inline-flex items-center gap-1 whitespace-nowrap font-medium text-white underline decoration-[#e60050] decoration-2 underline-offset-4" }}
            >
              {/* ponytail: icons take the logo MATCH pink, text stays black — re-tint if brand palette shifts */}
              {Icon && <Icon className="h-3.5 w-3.5 text-[#e60050]" aria-hidden="true" />}
              {t(c)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
