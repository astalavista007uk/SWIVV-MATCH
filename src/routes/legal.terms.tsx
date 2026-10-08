import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, Banknote, Handshake, Heart, Lock, Scale, ShieldCheck } from "lucide-react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({ meta: [{ title: "Conditions d'utilisation détaillées — SWIVV" }] }),
  component: LegalTermsPage,
});

// ponytail: paragraphs split on blank lines, "•" blocks become lists — rich legal formatting (tables, anchors) waits for a real CMS
export const ARTICLES: [string, string][] = [
  ["1. IDENTIFICATION DE SWIVV", "Le service est exploité sous le nom :\n\nSWIVV MATCH\n\nAdresse :\n10 Rue Thureau Dangin\n75015 Paris\nFrance\n\nTéléphone :\n+33 (0)6 60 36 82 20\n\nSWIVV est actuellement proposé dans le cadre d'une phase initiale de développement sous la forme d'un MVP (Minimum Viable Product).\n\nLe service est actuellement gratuit."],
  ["2. OBJET DU SERVICE", "SWIVV est une plateforme numérique destinée à faciliter les rencontres et les échanges entre personnes majeures.\n\nSelon les fonctionnalités disponibles, SWIVV peut notamment permettre aux utilisateurs de :\n\n• créer un profil ;\n• ajouter des photographies ;\n• présenter leurs centres d'intérêt ;\n• rechercher ou découvrir d'autres utilisateurs ;\n• indiquer leur intérêt pour un autre profil ;\n• recevoir des suggestions de profils ;\n• obtenir une correspondance (« Match ») ;\n• communiquer avec d'autres utilisateurs ;\n• utiliser différentes fonctionnalités destinées à faciliter les rencontres.\n\nSWIVV est une plateforme de mise en relation et ne constitue pas une agence matrimoniale ni un service garantissant une relation sentimentale.\n\nSWIVV ne garantit aucun résultat particulier, notamment aucune rencontre, relation, compatibilité ou mariage."],
  ["3. ACCÈS AU SERVICE", "L'utilisation de SWIVV est actuellement gratuite.\n\nCertaines fonctionnalités peuvent nécessiter la création d'un compte.\n\nSWIVV peut faire évoluer, modifier, suspendre ou supprimer certaines fonctionnalités afin d'améliorer le service, sa sécurité ou son fonctionnement."],
  ["4. CONDITIONS D'ACCÈS", "L'utilisation de SWIVV est exclusivement réservée aux personnes âgées de 18 ans ou plus.\n\nEn utilisant SWIVV, l'utilisateur déclare :\n\n• être âgé d'au moins 18 ans ;\n• disposer de la capacité nécessaire pour accepter les présentes CGU ;\n• fournir des informations exactes et sincères ;\n• ne pas usurper l'identité d'une autre personne ;\n• respecter les présentes CGU et les lois applicables.\n\nLes personnes mineures ne sont pas autorisées à utiliser SWIVV."],
  ["5. CRÉATION D'UN COMPTE", "Lorsque la création d'un compte est nécessaire, l'utilisateur doit fournir les informations demandées par SWIVV.\n\nL'utilisateur s'engage à :\n\n• fournir des informations exactes ;\n• maintenir ses informations à jour ;\n• ne pas créer un compte au nom d'une autre personne ;\n• ne pas créer plusieurs comptes dans le but de contourner les règles de SWIVV ;\n• préserver la confidentialité de ses identifiants.\n\nL'utilisateur est responsable des activités effectuées depuis son compte."],
  ["6. PROFIL UTILISATEUR", "L'utilisateur peut créer un profil contenant notamment, selon les fonctionnalités disponibles :\n\n• un prénom ou pseudonyme ;\n• un âge ;\n• une photographie ;\n• une description personnelle ;\n• des centres d'intérêt ;\n• des préférences de rencontre ;\n• une localisation générale ;\n• des informations relatives à sa personnalité ;\n• des informations relatives à son apparence ou à la perception qu'il a de lui-même.\n\nL'utilisateur est responsable des informations qu'il choisit de publier.\n\nIl doit s'assurer que les informations publiées ne portent pas atteinte aux droits d'une autre personne."],
  ["7. PHOTOGRAPHIES ET CONTENUS VISUELS", "Les photographies publiées sur SWIVV doivent respecter les présentes CGU.\n\nIl est notamment interdit de publier :\n\n• des photographies utilisées sans autorisation ;\n• des photographies destinées à usurper l'identité d'une autre personne ;\n• des contenus pornographiques ;\n• des contenus sexuellement explicites ;\n• des contenus représentant des mineurs dans un contexte inapproprié ;\n• des contenus extrêmement violents ou illégaux ;\n• des images destinées à tromper les autres utilisateurs.\n\nSWIVV peut retirer tout contenu qui ne respecte pas ces règles."],
  ["8. AUTHENTICITÉ DES PROFILS", "SWIVV encourage les utilisateurs à présenter des informations authentiques.\n\nToutefois, SWIVV ne peut garantir que toutes les informations publiées par les utilisateurs sont exactes, complètes ou vérifiées.\n\nLes utilisateurs doivent donc faire preuve de prudence lorsqu'ils communiquent avec une personne rencontrée sur la plateforme."],
  ["9. PERCEPTION DE L'APPARENCE", "Certaines fonctionnalités de SWIVV peuvent permettre aux utilisateurs de renseigner leur propre perception de leur apparence.\n\nCes informations sont déclaratives et correspondent exclusivement à l'appréciation personnelle de l'utilisateur.\n\nElles ne constituent pas une évaluation objective de l'apparence, de la beauté ou de l'attractivité d'une personne.\n\nSWIVV ne présente pas ces informations comme une notation objective."],
  ["10. MATCHING ET RECOMMANDATIONS", "SWIVV peut proposer des profils ou des recommandations en fonction notamment :\n\n• des informations renseignées par l'utilisateur ;\n• de ses préférences ;\n• de sa localisation lorsque cette fonctionnalité est activée ;\n• de son utilisation du service ;\n• des paramètres techniques de la plateforme.\n\nUn « Match » ou une recommandation ne constitue pas une garantie de compatibilité.\n\nLes utilisateurs restent libres de décider avec qui ils souhaitent communiquer."],
  ["11. MESSAGES ET COMMUNICATION", "Les utilisateurs doivent utiliser les fonctionnalités de communication de manière respectueuse.\n\nIl est interdit notamment :\n\n• de harceler un autre utilisateur ;\n• de menacer une personne ;\n• d'envoyer de manière répétée des messages non sollicités ;\n• d'envoyer des contenus sexuels non sollicités ;\n• d'envoyer des contenus illégaux ;\n• de diffuser des liens malveillants ;\n• de demander de l'argent ;\n• d'utiliser SWIVV pour pratiquer une escroquerie ;\n• de diffuser des informations personnelles concernant une autre personne sans autorisation."],
  ["12. DEMANDES D'ARGENT ET FRAUDES", "Les utilisateurs doivent être particulièrement prudents face aux demandes d'argent provenant de personnes rencontrées en ligne.\n\nSWIVV recommande de ne jamais envoyer d'argent à une personne rencontrée sur la plateforme sans avoir vérifié de manière indépendante son identité et sa situation.\n\nIl est interdit d'utiliser SWIVV pour :\n\n• demander frauduleusement de l'argent ;\n• obtenir des coordonnées bancaires ;\n• organiser des escroqueries ;\n• pratiquer une fraude financière ;\n• promouvoir des investissements frauduleux ;\n• utiliser de fausses identités dans un but frauduleux.\n\nTout comportement suspect peut être signalé à SWIVV."],
  ["13. COMPORTEMENTS INTERDITS", "L'utilisation de SWIVV doit rester conforme à la loi.\n\nIl est notamment interdit :\n\n• d'usurper l'identité d'une autre personne ;\n• de créer un faux profil dans un but frauduleux ;\n• de harceler ou menacer une personne ;\n• de tenir des propos discriminatoires ou haineux ;\n• de publier du contenu pornographique ;\n• de solliciter ou exploiter des mineurs ;\n• de pratiquer ou promouvoir des activités illégales ;\n• de demander frauduleusement de l'argent ;\n• de diffuser des virus ou logiciels malveillants ;\n• de tenter d'accéder au compte d'un autre utilisateur ;\n• de contourner les systèmes de sécurité de SWIVV ;\n• de collecter automatiquement les données des utilisateurs ;\n• d'utiliser des robots ou systèmes automatisés sans autorisation ;\n• de vendre des produits ou services sans autorisation ;\n• d'utiliser SWIVV pour toute activité contraire à la législation applicable."],
  ["14. RENCONTRES HORS LIGNE", "SWIVV facilite les rencontres en ligne mais ne contrôle pas les rencontres physiques entre utilisateurs.\n\nToute rencontre organisée entre utilisateurs relève de leur propre responsabilité.\n\nSWIVV recommande notamment :\n\n• de se rencontrer dans un lieu public ;\n• d'informer un proche de la rencontre ;\n• de conserver un moyen de transport indépendant ;\n• de ne pas communiquer immédiatement son adresse personnelle ;\n• de ne jamais envoyer d'argent à une personne rencontrée en ligne ;\n• de quitter immédiatement une situation dans laquelle l'utilisateur ne se sent pas en sécurité."],
  ["15. SIGNALEMENT", "Les utilisateurs peuvent signaler à SWIVV un profil, un message ou un comportement qu'ils considèrent comme contraire aux présentes CGU.\n\nLes signalements peuvent notamment concerner :\n\n• les faux profils ;\n• les escroqueries ;\n• le harcèlement ;\n• les menaces ;\n• les contenus interdits ;\n• les demandes d'argent ;\n• les comportements suspects ;\n• les violations des présentes CGU.\n\nSWIVV peut examiner les signalements et prendre les mesures appropriées."],
  ["16. MODÉRATION", "SWIVV peut mettre en place des mesures de modération destinées à protéger les utilisateurs et l'intégrité de la plateforme.\n\nLorsque cela est nécessaire, SWIVV peut notamment :\n\n• supprimer un contenu ;\n• masquer un profil ;\n• limiter certaines fonctionnalités ;\n• suspendre temporairement un compte ;\n• supprimer définitivement un compte.\n\nCes mesures peuvent notamment être prises lorsqu'un utilisateur enfreint les présentes CGU ou lorsque son comportement présente un risque pour la sécurité de la plateforme ou de ses utilisateurs."],
  ["17. SUSPENSION OU SUPPRESSION D'UN COMPTE", "SWIVV peut suspendre ou supprimer un compte notamment lorsque :\n\n• l'utilisateur viole les présentes CGU ;\n• le compte contient des informations manifestement frauduleuses ;\n• le compte est utilisé à des fins illégales ;\n• le compte présente un risque pour les autres utilisateurs ;\n• une autorité compétente l'exige.\n\nLorsque cela est raisonnablement possible, SWIVV peut informer l'utilisateur de la mesure prise."],
  ["18. SUPPRESSION DU COMPTE PAR L'UTILISATEUR", "L'utilisateur peut demander la suppression de son compte conformément aux fonctionnalités disponibles sur SWIVV.\n\nLa suppression du compte entraîne la désactivation du profil.\n\nCertaines données peuvent néanmoins être conservées pendant la durée nécessaire au respect d'obligations légales ou à la constatation, à l'exercice ou à la défense de droits en justice."],
  ["19. CONTENU PUBLIÉ PAR LES UTILISATEURS", "L'utilisateur conserve ses droits sur les contenus qu'il publie.\n\nEn publiant un contenu sur SWIVV, l'utilisateur autorise SWIVV, dans la mesure nécessaire au fonctionnement de la plateforme, à héberger, reproduire techniquement, stocker et afficher ce contenu conformément aux fonctionnalités choisies par l'utilisateur.\n\nCette autorisation est limitée à l'exploitation du service SWIVV.\n\nL'utilisateur garantit disposer des droits nécessaires pour publier les contenus concernés."],
  ["20. PROPRIÉTÉ INTELLECTUELLE", "Le nom SWIVV, son logo, son identité visuelle, son interface, ses textes, ses éléments graphiques, son architecture et les éléments techniques développés pour la plateforme peuvent être protégés par les règles relatives à la propriété intellectuelle.\n\nToute reproduction ou exploitation non autorisée de ces éléments est interdite."],
  ["21. DONNÉES PERSONNELLES", "SWIVV peut collecter et traiter des données personnelles nécessaires au fonctionnement du service.\n\nLes informations relatives à la collecte, à l'utilisation, à la conservation et à la protection des données personnelles sont détaillées dans la Politique de confidentialité de SWIVV.\n\nLes utilisateurs disposent des droits prévus par la réglementation applicable en matière de protection des données personnelles.\n\nLa Politique de confidentialité doit être consultée avant l'utilisation de certaines fonctionnalités nécessitant la collecte de données personnelles."],
  ["22. GÉOLOCALISATION", "Certaines fonctionnalités peuvent utiliser une localisation approximative afin de faciliter la découverte de profils à proximité.\n\nLa localisation affichée aux autres utilisateurs peut être approximative selon les fonctionnalités disponibles.\n\nSWIVV recommande aux utilisateurs de ne jamais publier leur adresse personnelle exacte ou toute autre information permettant de déterminer précisément leur domicile."],
  ["23. ALGORITHMES ET SYSTÈMES AUTOMATISÉS", "SWIVV peut utiliser des systèmes automatisés afin de faciliter :\n\n• la recherche de profils ;\n• les recommandations ;\n• le matching ;\n• la sécurité ;\n• la détection de comportements suspects ;\n• l'amélioration du service.\n\nLes résultats produits par ces systèmes sont susceptibles de comporter des erreurs.\n\nAucune recommandation algorithmique ne constitue une garantie de compatibilité entre deux personnes."],
  ["24. INTELLIGENCE ARTIFICIELLE", "Certaines fonctionnalités présentes ou futures de SWIVV peuvent utiliser des technologies d'intelligence artificielle.\n\nLorsque cela est nécessaire, SWIVV informera les utilisateurs de l'utilisation de ces technologies conformément à la réglementation applicable.\n\nLes résultats générés automatiquement peuvent être imparfaits et ne doivent pas être considérés comme des décisions ou évaluations humaines définitives."],
  ["25. DISPONIBILITÉ DU SERVICE", "SWIVV s'efforce de maintenir le site accessible dans des conditions normales.\n\nCependant, des interruptions peuvent survenir notamment en raison :\n\n• de maintenance ;\n• de mises à jour ;\n• de problèmes techniques ;\n• de défaillances d'hébergement ;\n• de problèmes de réseau ;\n• de circonstances indépendantes de la volonté de SWIVV.\n\nSWIVV ne garantit pas une disponibilité permanente et ininterrompue du service."],
  ["26. SÉCURITÉ", "SWIVV met en œuvre des mesures raisonnables destinées à protéger le service.\n\nToutefois, aucun système informatique ou service en ligne ne peut garantir une sécurité absolue.\n\nLes utilisateurs doivent notamment :\n\n• protéger leurs identifiants ;\n• choisir un mot de passe sécurisé ;\n• ne pas communiquer leurs identifiants ;\n• signaler toute utilisation suspecte de leur compte."],
  ["27. RESPONSABILITÉ DES UTILISATEURS", "Chaque utilisateur est responsable :\n\n• de son comportement ;\n• des informations qu'il publie ;\n• des messages qu'il envoie ;\n• des contenus qu'il partage ;\n• des interactions qu'il entretient avec les autres utilisateurs.\n\nL'utilisateur demeure responsable de ses actes réalisés sur ou à partir de SWIVV."],
  ["28. RESPONSABILITÉ DE SWIVV", "SWIVV fournit un service de mise en relation.\n\nSWIVV ne garantit pas :\n\n• l'exactitude des informations publiées par les utilisateurs ;\n• l'identité réelle des utilisateurs ;\n• la compatibilité entre deux utilisateurs ;\n• qu'une rencontre aura lieu ;\n• qu'une relation sentimentale sera créée ;\n• le comportement d'un utilisateur en dehors de la plateforme.\n\nSWIVV prend néanmoins des mesures raisonnables destinées à maintenir un environnement respectueux et sécurisé."],
  ["29. GRATUITÉ DU SERVICE", "Dans le cadre de son lancement MVP, SWIVV est entièrement gratuit.\n\nAucun abonnement, paiement ou achat n'est actuellement nécessaire pour utiliser les fonctionnalités proposées dans cette version du service.\n\nSWIVV pourra ultérieurement proposer des fonctionnalités payantes.\n\nDans ce cas, les conditions tarifaires et contractuelles applicables seront communiquées aux utilisateurs avant toute souscription ou paiement."],
  ["30. PUBLICITÉ ET SERVICES TIERS", "SWIVV pourra ultérieurement intégrer de la publicité ou des services fournis par des partenaires tiers.\n\nLorsque cela sera applicable, les services tiers pourront être soumis à leurs propres conditions d'utilisation et politiques de confidentialité."],
  ["31. MODIFICATION DU SERVICE", "SWIVV peut à tout moment faire évoluer le service, notamment :\n\n• ajouter de nouvelles fonctionnalités ;\n• modifier certaines fonctionnalités ;\n• supprimer certaines fonctionnalités ;\n• modifier l'interface ;\n• améliorer les systèmes de sécurité ;\n• mettre à jour les technologies utilisées.\n\nCes modifications peuvent être nécessaires pour assurer le développement et l'amélioration de SWIVV."],
  ["32. MODIFICATION DES CONDITIONS D'UTILISATION", "SWIVV peut modifier les présentes CGU afin de tenir compte notamment :\n\n• de l'évolution du service ;\n• de l'ajout de nouvelles fonctionnalités ;\n• de changements législatifs ou réglementaires ;\n• de considérations de sécurité.\n\nLa version applicable est celle publiée sur le site au moment de l'utilisation du service.\n\nLorsque la réglementation l'exige, SWIVV informera les utilisateurs des modifications importantes."],
  ["33. RÉCLAMATIONS ET CONTACT", "Pour toute question, demande ou réclamation concernant SWIVV, l'utilisateur peut contacter :\n\nSWIVV MATCH\n\n10 Rue Thureau Dangin\n75015 Paris\nFrance\n\nTéléphone : +33 (0)6 60 36 82 20\n\nSWIVV s'efforcera de traiter les demandes dans un délai raisonnable."],
  ["34. DROIT APPLICABLE", "Les présentes Conditions Générales d'Utilisation sont soumises au droit français, sous réserve des dispositions impératives qui pourraient être applicables à l'utilisateur en raison de son pays de résidence."],
  ["35. RÈGLEMENT DES LITIGES", "En cas de différend concernant l'utilisation de SWIVV, les parties sont invitées à rechercher en priorité une solution amiable.\n\nÀ défaut d'accord amiable, les règles de compétence juridictionnelle applicables détermineront la juridiction compétente."],
  ["36. NULLITÉ PARTIELLE", "Si une disposition des présentes CGU est déclarée nulle ou inapplicable, les autres dispositions demeureront applicables dans la mesure permise par la loi."],
  ["37. ABSENCE DE RENONCIATION", "Le fait pour SWIVV de ne pas exercer immédiatement un droit prévu par les présentes CGU ne constitue pas une renonciation à ce droit."],
];

// ponytail: lucide icons in a black chip instead of emoji — swap the set in one place when the brand evolves
const COMMUNITY_RULES = [
  { icon: Heart, title: "Être respectueux", text: "Traiter les autres utilisateurs avec respect." },
  { icon: Handshake, title: "Être honnête", text: "Ne pas utiliser de faux profils ou de fausses identités dans un but trompeur ou frauduleux." },
  { icon: Ban, title: "Ne pas harceler", text: "Respecter le refus ou la volonté d'une personne de ne plus communiquer." },
  { icon: Banknote, title: "Ne pas demander d'argent", text: "Ne pas utiliser SWIVV pour obtenir frauduleusement de l'argent auprès d'autres utilisateurs." },
  { icon: Lock, title: "Protéger sa vie privée", text: "Ne pas publier ou communiquer inutilement des informations personnelles sensibles." },
  { icon: ShieldCheck, title: "Signaler les comportements suspects", text: "Utiliser les fonctionnalités de signalement lorsqu'un comportement semble dangereux, frauduleux ou contraire aux règles." },
  { icon: Scale, title: "Respecter la loi", text: "Ne pas utiliser SWIVV pour commettre ou faciliter une infraction." },
];

function LegalTermsPage() {
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
        <h1 className="text-3xl font-medium text-[#333]">Conditions Générales d'Utilisation (CGU)</h1>
        <p className="mt-2 text-sm text-[#777]">Dernière mise à jour : 22 septembre 2026.</p>
        <p className="mt-4 text-[15px] leading-relaxed text-[#555]">
          Bienvenue sur SWIVV, une plateforme de rencontre et de mise en relation permettant à des personnes majeures de découvrir d'autres utilisateurs, d'échanger et, lorsque les fonctionnalités le permettent, de créer des relations et des rencontres.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#555]">
          Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et l'utilisation du site internet SWIVV.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#555]">
          En utilisant le site ou en créant un compte, l'utilisateur reconnaît avoir pris connaissance des présentes CGU et les accepter.
        </p>
        <div className="mt-6 space-y-4">
          {ARTICLES.map(([t, d]) => (
            <article key={t} className="rounded-xl bg-white p-5">
              <h2 className="font-medium text-[#333]">{t}</h2>
              {d.split("\n\n").map((b, i) =>
                b.split("\n").every((l) => l.startsWith("•")) ? (
                  <ul key={i} className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#555]">
                    {b.split("\n").map((l) => (
                      <li key={l}>{l.replace(/^•\s*/, "")}</li>
                    ))}
                  </ul>
                ) : (
                  <p
                    key={i}
                    className={`mt-1 whitespace-pre-line text-sm leading-relaxed text-[#555] ${/^\d+\.\d+\s/.test(b) ? "font-medium text-[#333]" : ""}`}
                  >
                    {b}
                  </p>
                ),
              )}
            </article>
          ))}
          <article className="rounded-xl bg-white p-5">
            <h2 className="font-medium text-[#333]">RÈGLES DE LA COMMUNAUTÉ SWIVV</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#555]">
              Afin de créer une communauté respectueuse et agréable, chaque utilisateur s'engage à :
            </p>
            <ul className="mt-3 space-y-3">
              {COMMUNITY_RULES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black" aria-hidden="true">
                    <Icon className="h-4 w-4 text-white" />
                  </span>
                  <span className="text-sm leading-relaxed text-[#555]">
                    <strong className="font-medium text-[#333]">{title}</strong>
                    <br />
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
