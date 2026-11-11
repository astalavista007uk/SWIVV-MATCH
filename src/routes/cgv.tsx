import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FileText, ReceiptText, Scale, ShieldCheck } from "lucide-react";
import { LEGAL_CARD, LEGAL_PILL, LegalHero } from "@/components/swivv-legal-hero";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { useT } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cgv")({
  head: () =>
    pageHead(
      "Conditions Générales de Vente et de Services — SWIVV MATCH",
      "Conditions générales de vente et de services de SWIVV MATCH, service de rencontres actuellement gratuit.",
      "/cgv",
    ),
  component: CgvPage,
});

const SECTIONS: { t: string; body: string[] }[] = [
  {
    t: "1. IDENTIFICATION",
    body: [
      "Le service est exploité sous le nom :",
      "SWIVV MATCH",
      "Adresse : 10 Rue Thureau Dangin — 75015 Paris — France.",
      "Téléphone : +33 (0)6 60 36 82 20.",
      "E-mail : contact@swivvmatch.com.",
      "SWIVV est actuellement lancé sous la forme d'un MVP (Minimum Viable Product).",
    ],
  },
  {
    t: "2. SERVICE GRATUIT",
    body: [
      "Dans le cadre de son lancement actuel, l'ensemble des fonctionnalités proposées par SWIVV est gratuit.",
      "L'utilisateur n'a actuellement :",
      "• aucun abonnement à souscrire ;",
      "• aucun paiement à effectuer ;",
      "• aucun frais d'inscription ;",
      "• aucun frais de création de profil ;",
      "• aucun renouvellement automatique ;",
      "• aucun achat obligatoire pour utiliser le service.",
      "Aucune carte bancaire ou autre moyen de paiement n'est actuellement nécessaire pour utiliser SWIVV.",
    ],
  },
  {
    t: "3. ABSENCE DE SERVICES PAYANTS",
    body: [
      "SWIVV ne commercialise actuellement aucun abonnement premium, fonctionnalité payante, crédit virtuel, boost, option payante ou service nécessitant un paiement.",
      "En conséquence, aucune somme ne peut être facturée à l'utilisateur dans le cadre des fonctionnalités actuellement proposées gratuitement.",
    ],
  },
  {
    t: "4. ÉVOLUTION FUTURE DES SERVICES",
    body: [
      "SWIVV pourra ultérieurement proposer des fonctionnalités ou services payants.",
      "Dans ce cas, aucune somme ne sera facturée à un utilisateur sans que celui-ci ait été clairement informé :",
      "• du service concerné ;",
      "• de son prix ;",
      "• de la durée éventuelle de l'engagement ;",
      "• des modalités de paiement ;",
      "• des conditions de résiliation ;",
      "• des conditions applicables au droit de rétractation lorsqu'il existe ;",
      "• des autres informations légalement requises.",
      "Les conditions applicables aux services payants feront, le cas échéant, l'objet d'une mise à jour des présentes conditions et/ou de conditions contractuelles spécifiques.",
      "Les prix des services payants devront être présentés de manière claire et compréhensible avant tout achat. Les règles françaises imposent notamment que les prix soient communiqués avant la conclusion du contrat et exprimés en euros TTC lorsqu'ils sont applicables.",
    ],
  },
  {
    t: "5. AUCUN ENGAGEMENT FINANCIER",
    body: [
      "La création d'un compte SWIVV et l'utilisation des fonctionnalités actuellement disponibles n'entraînent aucun engagement financier pour l'utilisateur.",
      "L'utilisateur peut utiliser le service sans fournir de coordonnées bancaires.",
    ],
  },
  {
    t: "6. CRÉATION D'UN COMPTE",
    body: [
      "Lorsque la création d'un compte est nécessaire pour accéder aux fonctionnalités de SWIVV, l'utilisateur doit fournir les informations demandées par la plateforme.",
      "L'utilisateur s'engage à fournir des informations exactes et à ne pas utiliser l'identité d'une autre personne.",
      "Les conditions relatives à la création et à l'utilisation d'un compte sont détaillées dans les Conditions Générales d'Utilisation (CGU) de SWIVV.",
    ],
  },
  {
    t: "7. SUPPRESSION DU COMPTE",
    body: [
      "L'utilisateur peut supprimer son compte directement depuis son espace personnel.",
      "Pour supprimer son compte, il suffit de :",
      "1. se connecter à son compte SWIVV ;",
      "2. ouvrir la page « Paramètres » / « Settings » ;",
      "3. sélectionner l'option de suppression du compte ;",
      "4. confirmer la demande de suppression.",
      "Aucune lettre, demande postale ou procédure administrative n'est nécessaire pour supprimer son compte.",
      "La suppression du compte entraîne la désactivation du profil et la suppression ou l'anonymisation des données concernées, sous réserve des données qui doivent légalement être conservées.",
    ],
  },
  {
    t: "8. ABSENCE DE RÉSILIATION D'ABONNEMENT",
    body: [
      "Dans la mesure où SWIVV est actuellement entièrement gratuit et ne propose aucun abonnement payant, aucune procédure spécifique de résiliation d'abonnement n'est actuellement applicable.",
      "La suppression du compte depuis la page Paramètres / Settings constitue le moyen simple de mettre fin à l'utilisation du service.",
    ],
  },
  {
    t: "9. RÉCLAMATIONS",
    body: [
      "Pour toute question, demande ou réclamation concernant SWIVV, l'utilisateur peut contacter :",
      "SWIVV MATCH — 10 Rue Thureau Dangin — 75015 Paris — France — Téléphone : +33 (0)6 60 36 82 20 — E-mail : contact@swivvmatch.com.",
      "SWIVV s'efforcera de traiter les demandes dans un délai raisonnable.",
    ],
  },
  {
    t: "10. DONNÉES PERSONNELLES",
    body: [
      "Les données personnelles collectées dans le cadre de l'utilisation de SWIVV sont traitées conformément à la Politique de confidentialité de SWIVV.",
      "Cette politique précise notamment les catégories de données collectées, les finalités des traitements, les durées de conservation et les droits des utilisateurs.",
    ],
  },
  {
    t: "11. PROPRIÉTÉ INTELLECTUELLE",
    body: [
      "Le nom SWIVV, son identité visuelle, son logo, son interface, ses éléments graphiques, ses textes et les éléments techniques de la plateforme peuvent être protégés par les règles relatives à la propriété intellectuelle.",
      "Toute utilisation non autorisée de ces éléments est interdite.",
    ],
  },
  {
    t: "12. MODIFICATION DES CONDITIONS",
    body: [
      "SWIVV peut modifier les présentes Conditions Générales de Vente et de Services notamment en cas :",
      "• d'évolution du service ;",
      "• d'introduction de nouvelles fonctionnalités ;",
      "• d'introduction de services payants ;",
      "• de modification de la réglementation applicable.",
      "La version publiée sur le site est la version applicable à la date de consultation.",
      "Lorsque la réglementation l'exige, les utilisateurs seront informés des modifications importantes.",
    ],
  },
  {
    t: "13. DROIT APPLICABLE",
    body: [
      "Les présentes Conditions Générales de Vente et de Services sont soumises au droit français, sous réserve des dispositions impératives qui pourraient être applicables à l'utilisateur en raison de son pays de résidence.",
    ],
  },
  {
    t: "14. RÈGLEMENT DES LITIGES",
    body: [
      "En cas de différend concernant les services proposés par SWIVV, l'utilisateur est invité à contacter préalablement SWIVV afin de rechercher une solution amiable.",
      "Les règles de règlement des litiges et de compétence juridictionnelle applicables sont celles prévues par la législation en vigueur.",
    ],
  },
  {
    t: "15. NULLITÉ PARTIELLE",
    body: [
      "Si une disposition des présentes conditions est déclarée nulle ou inapplicable, les autres dispositions demeureront applicables dans la mesure permise par la loi.",
    ],
  },
  {
    t: "16. CONTACT",
    body: [
      "Pour toute question concernant les présentes conditions ou le fonctionnement de SWIVV :",
      "SWIVV MATCH — 10 Rue Thureau Dangin — 75015 Paris — France — Téléphone : +33 (0)6 60 36 82 20 — E-mail : contact@swivvmatch.com.",
    ],
  },
  {
    t: "17. ÉDITEUR, HÉBERGEUR ET MENTIONS LÉGALES",
    body: [
      "Éditeur du service : SWIVV MATCH — 10 Rue Thureau Dangin, 75015 Paris, France — Téléphone : +33 (0)6 60 36 82 20 — contact@swivvmatch.com.",
      "Hébergeur : serveur dédié (VPS) exploité par SWIVV MATCH dans l'Union européenne.",
      "Ces informations sont également publiées sur la page Mentions légales.",
    ],
  },
  {
    t: "18. MÉDIATEUR DE LA CONSOMMATION",
    body: [
      "Pendant la phase actuelle, entièrement gratuite, SWIVV ne conclut aucune vente avec les utilisateurs : la médiation de la consommation n'est donc pas applicable.",
      "Avant la mise en place de tout service payant, SWIVV désignera un médiateur de la consommation conformément à l'article L612-1 du Code de la consommation et publiera ses coordonnées sur cette page ainsi que sur la page Mentions légales.",
      "En cas de réclamation, l'utilisateur est invité à contacter SWIVV en priorité via la page contact afin de rechercher une solution amiable.",
    ],
  },
  {
    t: "19. DROIT DE RÉTRACTATION ET RÉSILIATION (SERVICES PAYANTS À VENIR)",
    body: [
      "Aucun service payant n'étant proposé actuellement, aucun droit de rétractation ni abonnement n'est applicable à ce jour.",
      "Lorsque des services payants seront proposés, l'utilisateur consommateur disposera d'un délai de 14 jours pour se rétracter, sauf renoncement express à ce droit en cas d'accès immédiat au service numérique, conformément à la réglementation applicable.",
      "Les abonnements payants, s'ils sont mis en place, pourront être résiliés en ligne à tout moment, sans frais, au moyen d'une procédure simple et accessible. Les modalités de renouvellement, de résiliation et de remboursement seront communiquées avant toute souscription.",
    ],
  },
];

// ponytail: single bullet-run per section grouped into one <ul>; split into multiple lists if a section ever needs two runs
function SectionBody({ ps }: { ps: string[] }) {
  const t = useT();
  const out: ReactNode[] = [];
  let run: string[] = [];
  const flush = () => {
    if (!run.length) return;
    out.push(
      <ul key={out.length} className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#6b6b6b]">
        {run.map((b, j) => (
          <li key={j}>{t(b)}</li>
        ))}
      </ul>,
    );
    run = [];
  };
  ps.forEach((p) => {
    if (p.startsWith("• ") || p.startsWith("✓ ")) run.push(p.slice(2));
    else {
      flush();
      out.push(
        <p key={out.length} className="mt-2 text-sm leading-relaxed text-[#6b6b6b]">
          {t(p)}
        </p>,
      );
    }
  });
  flush();
  return <>{out}</>;
}

function CgvPage() {
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
      <LegalHero
        title={t("Conditions Générales de Vente et de Services — SWIVV")}
        subtitle={t("Le cadre du service : gratuité actuelle, responsabilités et règles prévues pour les services payants à venir.")}
        icon={ReceiptText}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-[#5c5c66]">{t("Dernière mise à jour : 3 novembre 2026.")}</p>
        <p className="mt-4 text-[15px] leading-relaxed text-[#6b6b6b]">
          {t("Bienvenue sur SWIVV, une plateforme de rencontre et de mise en relation permettant aux personnes majeures de découvrir d'autres utilisateurs, d'échanger et de faire de nouvelles rencontres.")}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#6b6b6b]">
          {t("Les présentes Conditions Générales de Vente et de Services (« CGV ») définissent les conditions applicables aux services proposés par SWIVV.")}
        </p>
        <div className="mt-6 grid gap-3">
          {SECTIONS.map((s) => (
            <section key={s.t} className={LEGAL_CARD}>
              <h2 className="font-extrabold tracking-[-0.01em] text-[#111]">{t(s.t)}</h2>
              <SectionBody ps={s.body} />
            </section>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link to="/terms-and-conditions" className={LEGAL_PILL}>
            <Scale className="h-4 w-4" aria-hidden="true" /> {t("conditions d'utilisation")}
          </Link>
          <Link to="/privacy-centre" className={LEGAL_PILL}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> {t("politique de confidentialité")}
          </Link>
          <Link to="/mentions-legales" className={LEGAL_PILL}>
            <FileText className="h-4 w-4" aria-hidden="true" /> {t("mentions légales")}
          </Link>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
