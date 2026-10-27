import { Link } from "@tanstack/react-router";
import { SwivvLogo } from "@/components/swivv-logo";
import { useAuth } from "@/hooks/use-auth";
import { setSetting } from "@/lib/swivv-store";
import { useT } from "@/lib/i18n";
import { SwivvLangSwitch } from "@/components/swivv-lang-switch";
import type { EnKey } from "@/lib/locales/en";

const BROWSE_ALL = { q: "", type: "", location: "" } as const;

type FooterLink = { label: EnKey; authOnly?: true } & (
  | { to: "/browse"; search: { q: string; type: string; location: string } }
  | { to: "/" }
  | { to: "/messagerie" }
  | { to: "/blog" }
  | { to: "/blog/$slug"; params: { slug: string } }
  | { to: "/help" }
  | { to: "/faq" }
  | { to: "/contact-us"; search: { subject: string } }
  | { to: "/terms-and-conditions" }
  | { to: "/privacy-centre" }
  | { to: "/comment-ca-marche" }
  | { to: "/guide-photos" }
  | { to: "/cgv" }
  | { to: "/cookies" }
);

// ponytail: browse/search values stay French — they are filter keys matched by /browse, only the label is translated
const COLUMNS: { id: "discover" | "help" | "legal" | "brand"; title: EnKey; links: FooterLink[] }[] = [
  {
    id: "discover",
    title: "Découvrir",
    links: [
      { label: "Découvrir comment ça marche", to: "/comment-ca-marche" },
      { label: "Parcourir les profils", to: "/browse", search: BROWSE_ALL },
      { label: "En ligne maintenant", to: "/browse", search: { ...BROWSE_ALL, q: "En ligne" } },
      { label: "Près de moi", to: "/browse", search: { ...BROWSE_ALL, q: "Près de moi" } },
      { label: "Mariage", to: "/browse", search: { ...BROWSE_ALL, q: "Mariage" } },
      { label: "Relation sérieuse", to: "/browse", search: { ...BROWSE_ALL, q: "Relation sérieuse" } },
      { label: "Nouveaux profils", to: "/browse", search: { ...BROWSE_ALL, q: "Nouveaux profils" } },
      { label: "Photos récentes", to: "/browse", search: { ...BROWSE_ALL, q: "Photos récentes" } },
      { label: "Profils populaires", to: "/browse", search: { ...BROWSE_ALL, q: "Profils populaires" } },
      { label: "Mes messages", to: "/messagerie" },
    ],
  },
  {
    id: "help",
    title: "Aide & Sécurité",
    links: [
      { label: "Centre d'aide", to: "/help" },
      { label: "Questions fréquentes", to: "/faq" },
      {
        label: "Conseils de sécurité",
        to: "/blog/$slug",
        params: { slug: "relation-serieuse-signes-profil-fiable" },
      },
      { label: "Guide photos", to: "/guide-photos" },
      {
        label: "Signaler un abus",
        authOnly: true,
        to: "/contact-us",
        search: { subject: "Signaler un abus ou un faux profil" },
      },
      { label: "Nous contacter", to: "/contact-us", search: { subject: "Question sur mon compte" } },
    ],
  },
  {
    id: "legal",
    title: "Confidentialité & Légal",
    links: [
      { label: "Conditions d'utilisation", to: "/terms-and-conditions" },
      { label: "Conditions Générales de Vente (CGV)", to: "/cgv" },
      { label: "Centre de confidentialité", to: "/privacy-centre" },
      { label: "Cookies", to: "/cookies" },
    ],
  },
  {
    id: "brand",
    title: "SWIVV",
    links: [
      { label: "Accueil", to: "/" },
      { label: "Blog rencontres", to: "/blog" },
    ],
  },
];

export function SwivvFooter() {
  const t = useT();
  const { user, loading } = useAuth();
  // ponytail: hidden for anonymous visitors, kept during auth loading to avoid a logged-in flash
  const columns =
    loading || user ? COLUMNS : COLUMNS.map((col) => ({ ...col, links: col.links.filter((l) => !l.authOnly) }));
  return (
    <footer className="border-t border-border bg-[#f7f7f7]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
        <div>
          <SwivvLogo className="h-24" />
          <p className="mt-2 text-sm text-[#777]">{t("Your Match. Your Story.")}</p>
          <p className="mt-4 text-xs text-[#999]">{t("© 2026 SWIVV. Tous droits réservés.")}</p>
          <SwivvLangSwitch className="mt-4" />
        </div>
        {columns.map((col) => (
          <nav key={col.id} aria-label={t(col.title)} className={col.id === "brand" ? "relative" : undefined}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#333]">{t(col.title)}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.to === "/browse" ? (
                    <Link
                      to={l.to}
                      search={l.search}
                      className="text-sm text-[#555] hover:text-[#e60050] hover:underline"
                    >
                      {t(l.label)}
                    </Link>
                  ) : l.to === "/contact-us" ? (
                    <Link
                      to={l.to}
                      search={l.search}
                      className="text-sm text-[#555] hover:text-[#e60050] hover:underline"
                    >
                      {t(l.label)}
                    </Link>
                  ) : "params" in l ? (
                    <Link
                      to={l.to}
                      params={l.params}
                      className="text-sm text-[#555] hover:text-[#e60050] hover:underline"
                    >
                      {t(l.label)}
                    </Link>
                  ) : (
                    <Link
                      to={l.to}
                      className="text-sm text-[#555] hover:text-[#e60050] hover:underline"
                    >
                      {t(l.label)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            {/* ponytail: plain anchor + full reload — re-shows the dismissed home section and jumps to it; no new page/route */}
            {col.id === "brand" && (
              <a
                href="/#telecharger"
                onClick={() => setSetting("appPromoDismissed", false)}
                className="mt-3 inline-block text-sm text-[#555] hover:text-[#e60050] hover:underline"
              >
                {t("Application mobile")}
              </a>
            )}
            {/* ponytail: multiply melts the JPG white box into the footer grey; pinned right on mobile, normal flow on sm+ (flex restructure if it ever needs vertical centering) */}
            {col.id === "brand" && (
              <img src="/favicon.png" alt="SWIVV" loading="lazy" className="absolute right-0 top-1/2 h-24 w-auto -translate-y-1/2 mix-blend-multiply sm:static sm:mt-4 sm:translate-y-0" />
            )}
          </nav>
        ))}
      </div>
    </footer>
  );
}
