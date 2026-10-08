import { createFileRoute, Link } from "@tanstack/react-router";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({ meta: [{ title: "Conditions d'utilisation — SWIVV" }] }),
  component: TermsPage,
});

const SECTIONS = [
  {
    t: "1. Le service",
    d: "SWIVV est un site de rencontres : profils, likes, matchs et messagerie privée. L'inscription et les fonctions de base sont gratuites. Il faut avoir 18 ans ou plus pour s'inscrire.",
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
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <span className="text-sm text-[#777]">Conditions</span>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-medium text-[#333]">Conditions d'utilisation</h1>
        <p className="mt-2 text-[#777]">
          Les règles du jeu, en langage simple. Dernière mise à jour : septembre 2026.
        </p>
        <div className="mt-6 space-y-3">
          {SECTIONS.map((s) => (
            <div key={s.t} className="rounded-xl bg-white p-5">
              <h2 className="font-medium text-[#333]">{s.t}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#555]">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-[#777]">
          Version juridique complète : <Link to="/legal/terms" className="text-[#e91e63] underline">conditions d'utilisation détaillées</Link> ·{" "}
          <Link to="/legal/privacy" className="text-[#e91e63] underline">politique de confidentialité</Link>
        </p>
      </main>
      <SwivvFooter />
    </div>
  );
}
