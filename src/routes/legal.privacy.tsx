import { createFileRoute, Link } from "@tanstack/react-router";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({ meta: [{ title: "Politique de confidentialité — SWIVV" }] }),
  component: LegalPrivacyPage,
});

const ARTICLES = [
  ["1. Données collectées", "Compte : prénom, e-mail, âge, ville. Profil public : photos, bio, centres d'intérêt, intention. Usage : likes, matchs, messages, préférences de recherche. Les messages privés ne sont lisibles que par toi et ton match, plus la modération en cas de signalement."],
  ["2. Utilisation", "Tes données servent uniquement à : afficher ton profil aux membres, calculer tes compatibilités, assurer la modération et la sécurité, et te contacter pour le support. Aucune revente, aucun partage à des annonceurs, aucune publicité ciblée avec tes données de rencontres."],
  ["3. Visibilité", "Ton profil public (photos, prénom, âge, ville, bio) est visible par les membres connectés uniquement. Ton e-mail, ta position exacte et tes signalements restent strictement privés. Seule ta ville et une distance approximative en km sont affichées."],
  ["4. Conservation", "Tes données sont conservées tant que ton compte est actif. Après suppression du compte, ton profil public, tes photos et tes conversations sont effacés, sous réserve des durées légales (ex. journaux de modération en cas d'abus)."],
  ["5. Tes droits", "Accès, rectification, export, suppression : écris-nous via la page contact en précisant ta demande et l'e-mail de ton compte. Réponse sous 30 jours. Tu peux aussi supprimer ton compte toi-même en 1 clic depuis ton profil."],
  ["6. Cookies", "SWIVV utilise uniquement des cookies techniques (session, préférences, sécurité). Aucun cookie publicitaire. Détails sur la page cookies."],
  ["7. Sécurité", "Connexions chiffrées, mots de passe jamais stockés en clair, accès internes limités. En cas de faille avérée, les membres concernés sont informés conformément à la réglementation."],
  ["8. Contact", "Pour exercer tes droits ou poser une question : page contact, objet « Supprimer mes données » ou « Question confidentialité »."],
];

function LegalPrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <span className="text-sm text-[#777]">Juridique</span>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-medium text-[#333]">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-[#777]">Dernière mise à jour : septembre 2026.</p>
        <div className="mt-6 space-y-4">
          {ARTICLES.map(([t, d]) => (
            <article key={t} className="rounded-xl bg-white p-5">
              <h2 className="font-medium text-[#333]">{t}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#555]">{d}</p>
            </article>
          ))}
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
