import { createFileRoute, Link } from "@tanstack/react-router";
import { Cookie, FileText, ReceiptText, Scale, ShieldCheck } from "lucide-react";
import { LEGAL_CARD, LEGAL_PILL, LegalHero } from "@/components/swivv-legal-hero";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { pageHead } from "@/lib/seo";
import { useLang, useT } from "@/lib/i18n";

export const Route = createFileRoute("/mentions-legales")({
  head: () =>
    pageHead(
      "Mentions légales — SWIVV MATCH",
      "Mentions légales de SWIVV MATCH : éditeur, hébergeur, propriété intellectuelle, signalements et données personnelles.",
      "/mentions-legales",
    ),
  component: LegalNoticePage,
});

// ponytail: no legal entity yet — registration fields (forme, SIREN, TVA, directeur de publication) stay out until the entity exists; add them here at that point
const SECTIONS: { t: string; body: string[] }[] = [
  {
    t: "1. Éditeur du site",
    body: [
      "Nom du service : SWIVV MATCH.",
      "Adresse : 10 Rue Thureau Dangin — 75015 Paris — France.",
      "Téléphone : +33 (0)6 60 36 82 20.",
      "E-mail : contact@swivvmatch.com.",
      "SWIVV est actuellement proposé dans le cadre d'une phase initiale de développement (MVP) et le service est gratuit.",
    ],
  },
  {
    t: "2. Hébergement",
    body: [
      "Le site est hébergé par Vercel Inc. — 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis — vercel.com.",
      "Les données applicatives (comptes, profils, messages, fichiers) sont hébergées par Supabase, notre prestataire de base de données et de stockage.",
    ],
  },
  {
    t: "3. Propriété intellectuelle",
    body: [
      "Le nom SWIVV MATCH, le logo, l'identité visuelle, l'interface, les textes et les éléments techniques de la plateforme sont protégés par les règles relatives à la propriété intellectuelle.",
      "Toute reproduction ou exploitation non autorisée est interdite.",
      "Les contenus publiés par les membres restent leur propriété ; ils accordent à SWIVV la licence limitée nécessaire au fonctionnement du service, décrite dans les Conditions Générales d'Utilisation.",
    ],
  },
  {
    t: "4. Données personnelles",
    body: [
      "Le responsable du traitement est SWIVV MATCH. Les données sont traitées conformément au RGPD et à la politique de confidentialité.",
      "Pour exercer tes droits (accès, rectification, effacement, limitation, opposition, portabilité) : page contact ou contact@swivvmatch.com. Réponse sous 30 jours.",
      "Réclamation possible auprès de la CNIL — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — cnil.fr.",
    ],
  },
  {
    t: "5. Cookies et stockages locaux",
    body: [
      "SWIVV utilise uniquement des traceurs techniques (session, langue, sécurité) et une mesure d'audience sans cookie.",
      "La liste des noms, finalités et durées figure sur la page Cookies.",
    ],
  },
  {
    t: "6. Signalement de contenus illicites",
    body: [
      "Pour signaler un contenu ou un comportement illicite : page contact, objet « Signaler un abus ou un faux profil », ou contact@swivvmatch.com.",
      "Le signalement doit préciser les éléments permettant d'identifier le contenu concerné (profil, message, date). SWIVV accuse réception et examine le signalement dans un délai raisonnable.",
      "Les décisions de modération peuvent être contestées conformément à l'article 39 des Conditions Générales d'Utilisation (recours et droits prévus par le DSA).",
    ],
  },
  {
    t: "7. Médiation et litiges",
    body: [
      "Pendant la phase gratuite, aucune vente n'est conclue : la médiation de la consommation n'est pas applicable.",
      "Avant tout service payant, SWIVV désignera un médiateur de la consommation et publiera ses coordonnées sur cette page et sur les CGV.",
      "En cas de litige, contacte SWIVV en priorité via la page contact afin de rechercher une solution amiable. À défaut, les juridictions françaises compétentes pourront être saisies, sous réserve des règles impératives applicables aux consommateurs.",
    ],
  },
];

function LegalNoticePage() {
  const t = useT();
  const lang = useLang();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-black text-white">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
      <LegalHero
        title={t("Mentions légales")}
        subtitle={t("Éditeur, hébergeur, propriété intellectuelle, signalements et litiges : l'essentiel en un coup d'œil.")}
        icon={FileText}
        tall
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-[#6b6b6b]">{t("Dernière mise à jour : 3 novembre 2026.")}</p>
        {lang !== "fr" && (
          <p className="mt-2 rounded-md border border-border bg-[#f3f3f3] p-3 text-sm text-[#555]">
            {t("Ce document juridique est fourni en français ; la version française fait foi.")}
          </p>
        )}
        <div className="mt-6 grid gap-3">
          {SECTIONS.map((s) => (
            <section key={s.t} className={LEGAL_CARD}>
              <h2 className="font-extrabold tracking-[-0.01em] text-[#111]">{t(s.t)}</h2>
              {s.body.map((p) => (
                <p key={p} className="mt-2 text-sm leading-relaxed text-[#6b6b6b]">{t(p)}</p>
              ))}
            </section>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link to="/terms-and-conditions" className={LEGAL_PILL}>
            <Scale className="h-4 w-4" aria-hidden="true" /> {t("conditions d'utilisation")}
          </Link>
          <Link to="/cgv" className={LEGAL_PILL}>
            <ReceiptText className="h-4 w-4" aria-hidden="true" /> {t("CGV")}
          </Link>
          <Link to="/privacy-centre" className={LEGAL_PILL}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> {t("centre de confidentialité")}
          </Link>
          <Link to="/cookies" className={LEGAL_PILL}>
            <Cookie className="h-4 w-4" aria-hidden="true" /> {t("cookies")}
          </Link>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
