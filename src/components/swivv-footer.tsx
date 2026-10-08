import { Link } from "@tanstack/react-router";
import { SwivvLogo } from "@/components/swivv-logo";

const BROWSE_ALL = { q: "", type: "", location: "" } as const;

type FooterLink =
  | { label: string; to: "/browse"; search: { q: string; type: string; location: string } }
  | { label: string; to: "/" }
  | { label: string; to: "/messagerie" }
  | { label: string; to: "/blog" }
  | { label: string; to: "/blog/$slug"; params: { slug: string } }
  | { label: string; to: "/help" }
  | { label: string; to: "/faq" }
  | { label: string; to: "/contact-us"; search: { subject: string } }
  | { label: string; to: "/terms-and-conditions" }
  | { label: string; to: "/legal/terms" }
  | { label: string; to: "/legal/privacy" }
  | { label: string; to: "/privacy-centre" }
  | { label: string; to: "/comment-ca-marche" }
  | { label: string; to: "/guide-photos" }
  | { label: string; to: "/cgv" }
  | { label: string; to: "/cookies" };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
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
        to: "/contact-us",
        search: { subject: "Signaler un abus ou un faux profil" },
      },
      { label: "Nous contacter", to: "/contact-us", search: { subject: "Question sur mon compte" } },
    ],
  },
  {
    title: "Confidentialité & Légal",
    links: [
      { label: "Conditions d'utilisation", to: "/terms-and-conditions" },
      { label: "CGU détaillées", to: "/legal/terms" },
      { label: "Conditions Générales de Vente (CGV)", to: "/cgv" },
      { label: "Politique de confidentialité", to: "/legal/privacy" },
      { label: "Centre de confidentialité", to: "/privacy-centre" },
      { label: "Cookies", to: "/cookies" },
    ],
  },
  {
    title: "SWIVV",
    links: [
      { label: "Accueil", to: "/" },
      { label: "Comment ça marche", to: "/help" },
      { label: "Blog rencontres", to: "/blog" },
      {
        label: "Témoignages",
        to: "/blog/$slug",
        params: { slug: "temoignages-maries-grace-swivv" },
      },
    ],
  },
];

export function SwivvFooter() {
  return (
    <footer className="border-t border-border bg-[#f7f7f7]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
        <div>
          {/* ponytail: multiply drops the JPG's white box into the footer bg — real transparent PNG if the footer ever goes dark */}
          <SwivvLogo className="h-24 mix-blend-multiply" />
          <p className="mt-2 text-sm text-[#777]">Your Match. Your Story.</p>
          <p className="mt-4 text-xs text-[#999]">© 2026 SWIVV. Tous droits réservés.</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className={col.title === "SWIVV" ? "relative" : undefined}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#333]">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.to === "/browse" ? (
                    <Link
                      to={l.to}
                      search={l.search}
                      className="text-sm text-[#555] hover:text-[#e91e63] hover:underline"
                    >
                      {l.label}
                    </Link>
                  ) : l.to === "/contact-us" ? (
                    <Link
                      to={l.to}
                      search={l.search}
                      className="text-sm text-[#555] hover:text-[#e91e63] hover:underline"
                    >
                      {l.label}
                    </Link>
                  ) : "params" in l ? (
                    <Link
                      to={l.to}
                      params={l.params}
                      className="text-sm text-[#555] hover:text-[#e91e63] hover:underline"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <Link
                      to={l.to}
                      className="text-sm text-[#555] hover:text-[#e91e63] hover:underline"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            {/* ponytail: multiply melts the JPG white box into the footer grey; pinned right on mobile, normal flow on sm+ (flex restructure if it ever needs vertical centering) */}
            {col.title === "SWIVV" && (
              <img src="/favicon.png" alt="SWIVV" loading="lazy" className="absolute right-0 top-1/2 h-24 w-auto -translate-y-1/2 mix-blend-multiply sm:static sm:mt-4 sm:translate-y-0" />
            )}
          </nav>
        ))}
      </div>
    </footer>
  );
}
