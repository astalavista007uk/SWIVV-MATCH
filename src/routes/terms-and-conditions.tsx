import { createFileRoute, Link } from "@tanstack/react-router";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { pageHead } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () =>
    pageHead(
      "Conditions d'utilisation — SWIVV MATCH",
      "Conditions d'utilisation de SWIVV MATCH : règles du service, engagements des membres, modération et sécurité.",
      "/terms-and-conditions",
    ),
  component: TermsPage,
});

const SECTIONS = [
  {
    t: "1. Le service",
    d: "SWIVV est un site de rencontres : profils, likes, matchs et messagerie privée. Tout est gratuit, sans carte bancaire, sans abonnement. Il faut avoir 18 ans ou plus pour s'inscrire.",
  },
  {
    t: "2. Tes engagements",
    d: "Tu publies des photos réelles et récentes de toi (ni dessins, ni célébrités), des informations exactes, et tu respectes les autres membres : pas de harcèlement, pas de discours haineux, pas de contenu sexuel non sollicité.",
  },
  {
    t: "3. Tolérance zéro",
    d: "Arnaques, demandes d'argent, faux profils et comportements abusifs entraînent un bannissement immédiat et définitif. Signale tout abus via la page contact.",
  },
  {
    t: "4. Rencontres réelles : prudence",
    d: "SWIVV ne vérifie pas l'identité de chaque membre dans la vie réelle. Pour un premier rendez-vous : lieu public, durée limitée, préviens un proche. Tu restes responsable de ta sécurité.",
  },
  {
    t: "5. Données et suppression",
    d: "Tes données servent uniquement au fonctionnement du service (profils, compatibilité, modération). Tu peux exporter ou supprimer tes données à tout moment, et supprimer ton compte en 1 clic.",
  },
  {
    t: "6. Contact",
    d: "Pour toute question sur ces conditions, écris-nous via la page contact. Version complète et détaillée : voir les conditions d'utilisation.",
  },
];

function TermsPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-black text-white">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-medium text-[#333]">{t("Conditions d'utilisation")}</h1>
        <p className="mt-2 text-[#777]">
          {t("Les règles du jeu, en langage simple. Dernière mise à jour : septembre 2026.")}
        </p>
        <div className="mt-6 space-y-3">
          {SECTIONS.map((s) => (
            <div key={s.t} className="rounded-xl bg-white p-5">
              <h2 className="font-medium text-[#333]">{t(s.t)}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#555]">{t(s.d)}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-[#777]">
          {t("Données et confidentialité :")}{" "}
          <Link to="/privacy-centre" className="text-[#e60050] underline">{t("centre de confidentialité")}</Link>
        </p>
      </main>
      <SwivvFooter />
    </div>
  );
}
