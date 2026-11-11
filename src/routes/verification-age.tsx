import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Cookie, ReceiptText, Scale, ShieldCheck, UserCheck } from "lucide-react";
import { LEGAL_CARD, LEGAL_PILL, LegalHero } from "@/components/swivv-legal-hero";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { pageHead } from "@/lib/seo";
import { useLang, useT } from "@/lib/i18n";
import { AGE_SECTIONS_EN } from "@/lib/verification-age-en";
import { AGE_SECTIONS_ES } from "@/lib/verification-age-es";

export const Route = createFileRoute("/verification-age")({
  head: () =>
    pageHead(
      "Politique de vérification de l'âge et de protection des mineurs – SWIVV MATCH",
      "Politique de SWIVV MATCH en matière de vérification de l'âge et de protection des mineurs : conditions 18+, déclaration d'âge, méthodes de vérification et traitement des comptes de mineurs.",
      "/verification-age",
    ),
  component: AgeVerificationPage,
});

// ponytail: **bold** + bare URLs are the only inline markup this policy needs — a markdown renderer would be more dependency than text
function Rich({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      nodes.push(<strong key={m.index} className="font-semibold text-[#111]">{tok.slice(2, -2)}</strong>);
    } else {
      nodes.push(
        <a key={m.index} href={tok} target="_blank" rel="noopener noreferrer" className="break-all text-[#e60050] underline">
          {tok}
        </a>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

type Block = { h?: string; p?: string; ul?: string[]; ol?: string[] };
type Section = { title: string; blocks: Block[] };

const SECTIONS: Section[] = [
  {
    title: "1. Introduction",
    blocks: [
      { p: "SWIVV MATCH est une plateforme de rencontres en ligne et de mise en relation destinée exclusivement aux personnes âgées de 18 ans et plus." },
      { p: "Notre objectif est de permettre aux adultes de faire connaissance, de créer des relations authentiques et d'échanger dans un environnement respectueux, sécurisé et soucieux de la protection de leur vie privée." },
      { p: "La protection des mineurs, la sécurité des utilisateurs et le respect des données personnelles constituent des principes essentiels dans la conception et le fonctionnement de notre plateforme." },
      { p: "C'est pourquoi SWIVV MATCH applique une politique d'accès réservée aux adultes et met en place des mesures destinées à empêcher les personnes de moins de 18 ans de créer un compte ou d'utiliser les fonctionnalités de rencontres et de communication." },
      { p: "Cette politique explique :" },
      { ul: [
        "Les conditions d'âge applicables à l'utilisation de SWIVV MATCH.",
        "Les informations demandées lors de l'inscription.",
        "La différence entre une déclaration d'âge, une vérification de l'âge et une vérification d'identité.",
        "Les circonstances dans lesquelles une vérification supplémentaire peut être demandée.",
        "Les mesures de prévention et de traitement des comptes appartenant à des mineurs.",
        "Les principaux textes législatifs et réglementaires applicables en France, dans l'Union européenne et dans d'autres juridictions.",
      ] },
      { p: "Notre approche repose sur un principe fondamental : **protéger les utilisateurs et vérifier leur majorité sans collecter inutilement des informations personnelles ou des documents d'identité.**" },
      { p: "La confidentialité et la protection des données personnelles sont traitées séparément dans notre page **Confidentialité des données**." },
    ],
  },
  {
    title: "2. SWIVV MATCH est exclusivement réservé aux personnes majeures",
    blocks: [
      { p: "L'accès à SWIVV MATCH est strictement réservé aux personnes âgées d'au moins 18 ans." },
      { p: "Toute personne souhaitant créer un compte doit :" },
      { ol: [
        "Être âgée d'au moins 18 ans au moment de son inscription.",
        "Fournir une date de naissance exacte.",
        "Confirmer expressément qu'elle est majeure.",
        "Accepter les Conditions générales d'utilisation et la présente politique.",
        "Ne pas utiliser de fausses informations pour contourner les restrictions d'âge.",
      ] },
      { p: "Les personnes mineures ne sont pas autorisées à créer un compte, à consulter les profils réservés aux membres, à utiliser les fonctionnalités de mise en relation ou à communiquer avec les utilisateurs de la plateforme." },
      { p: "Cette restriction s'applique indépendamment du pays de résidence de l'utilisateur." },
      { p: "Le fait de disposer d'une autorisation parentale ne permet pas à une personne de moins de 18 ans de créer un compte SWIVV MATCH." },
    ],
  },
  {
    title: "3. Déclaration de l'âge lors de l'inscription",
    blocks: [
      { p: "Lors de la création d'un compte, SWIVV MATCH demande à chaque utilisateur de renseigner sa date de naissance." },
      { p: "L'utilisateur doit également confirmer la déclaration suivante :" },
      { p: "**« Je confirme être âgé(e) d'au moins 18 ans et certifie que la date de naissance communiquée lors de mon inscription est exacte. Je comprends que SWIVV MATCH est une plateforme exclusivement réservée aux personnes majeures. »**" },
      { p: "Cette déclaration constitue une condition obligatoire d'inscription." },
      { p: "Le système calcule automatiquement l'âge de l'utilisateur à partir de la date de naissance renseignée." },
      { p: "L'inscription est refusée lorsque :" },
      { ul: [
        "La date de naissance indique que la personne a moins de 18 ans.",
        "La date renseignée est invalide.",
        "La date se situe dans le futur.",
        "Les informations fournies ne permettent pas de confirmer l'éligibilité à l'inscription.",
      ] },
      { p: "La simple modification d'un âge affiché sur un formulaire ne doit pas permettre de contourner les contrôles effectués par le système." },
      { p: "La validation de l'âge doit être réalisée côté serveur afin de limiter les possibilités de manipulation du processus d'inscription." },
    ],
  },
  {
    title: "4. Vérification de l'âge et vérification de l'identité : quelle différence ?",
    blocks: [
      { p: "Il est important de distinguer deux opérations qui ne poursuivent pas exactement le même objectif." },
      { h: "4.1. La vérification de l'âge" },
      { p: "La vérification de l'âge consiste à déterminer si une personne atteint un âge minimum requis." },
      { p: "Dans le cas de SWIVV MATCH, la question est simplement :" },
      { p: "**Cette personne a-t-elle au moins 18 ans ?**" },
      { p: "Une vérification de majorité n'implique pas nécessairement que la plateforme connaisse le nom légal complet de la personne, son numéro de document d'identité, son adresse ou d'autres informations personnelles." },
      { p: "Un dispositif indépendant peut, par exemple, confirmer qu'une personne est majeure en transmettant uniquement un résultat :" },
      { ul: [
        "Majeur – 18 ans ou plus.",
        "Mineur – moins de 18 ans.",
        "Vérification non concluante.",
      ] },
      { h: "4.2. La vérification de l'identité" },
      { p: "La vérification de l'identité vise à établir qu'une personne est bien celle qu'elle prétend être." },
      { p: "Elle peut notamment impliquer l'examen d'un passeport, d'une carte nationale d'identité ou d'un autre document officiel." },
      { p: "Cette procédure peut être pertinente dans certains secteurs réglementés, pour certaines opérations financières ou dans des circonstances particulières." },
      { p: "Toutefois, la vérification de l'identité complète n'est pas automatiquement nécessaire pour établir qu'un utilisateur est majeur." },
      { h: "4.3. La politique de SWIVV MATCH" },
      { p: "SWIVV MATCH privilégie une approche proportionnée et respectueuse de la vie privée." },
      { p: "La plateforme ne demande pas systématiquement à chaque nouvel utilisateur de transmettre une copie de son passeport, de sa carte nationale d'identité ou de son permis de conduire." },
      { p: "L'objectif est de vérifier la condition d'âge nécessaire à l'utilisation du service, et non de collecter des documents personnels sans nécessité démontrée." },
      { p: "Une vérification complémentaire pourra être mise en place lorsque cela est nécessaire pour la sécurité de la plateforme, pour traiter un signalement crédible ou pour répondre à une obligation légale applicable." },
    ],
  },
  {
    title: "5. Les documents d'identité sont-ils obligatoires pour créer un compte ?",
    blocks: [
      { p: "**Non, SWIVV MATCH ne fait pas du téléchargement d'une pièce d'identité une condition générale et systématique de création de compte.**" },
      { p: "Lorsqu'une personne s'inscrit, la procédure initiale repose sur :" },
      { ul: [
        "La communication d'une date de naissance.",
        "Une déclaration expresse de majorité.",
        "Le contrôle automatique de l'âge indiqué.",
        "L'acceptation des conditions applicables à la plateforme.",
      ] },
      { p: "Il convient de rappeler que les obligations de vérification de l'âge dépendent de la nature du service proposé et des dispositions légales applicables." },
      { p: "Certaines activités, notamment la vente d'alcool, les jeux d'argent et les services diffusant des contenus pornographiques, sont soumises à des obligations spécifiques de contrôle de l'âge." },
      { p: "Ces obligations ne sont pas automatiquement transposables à une plateforme ordinaire de rencontres en ligne." },
      { p: "SWIVV MATCH n'est pas un service de vente d'alcool, de jeux d'argent ou de diffusion de contenus pornographiques." },
      { p: "Cette distinction ne dispense toutefois pas la plateforme de mettre en œuvre des mesures appropriées pour protéger les mineurs et empêcher leur accès au service." },
    ],
  },
  {
    title: "6. Les différentes méthodes de vérification de l'âge",
    blocks: [
      { p: "Plusieurs méthodes techniques peuvent être utilisées pour déterminer si un utilisateur est majeur." },
      { p: "SWIVV MATCH privilégie les solutions qui offrent un niveau de fiabilité adapté tout en limitant la collecte et la transmission de données personnelles." },
      { h: "6.1. Déclaration de majorité" },
      { p: "L'utilisateur renseigne sa date de naissance et confirme être âgé d'au moins 18 ans." },
      { p: "Cette méthode est simple et permet de contrôler les informations communiquées au moment de l'inscription." },
      { p: "Toutefois, une déclaration individuelle ne constitue pas, à elle seule, une preuve indépendante de majorité." },
      { p: "Elle doit être accompagnée de mesures de prévention, de contrôles techniques et d'un dispositif de signalement." },
      { h: "6.2. Vérification par un prestataire indépendant" },
      { p: "Une autre méthode consiste à utiliser un prestataire spécialisé dans la vérification de l'âge." },
      { p: "Dans ce modèle :" },
      { ol: [
        "L'utilisateur est redirigé vers un prestataire indépendant.",
        "Le prestataire procède à la vérification de l'âge selon une méthode appropriée.",
        "Le prestataire transmet à SWIVV MATCH le résultat nécessaire.",
        "SWIVV MATCH reçoit une confirmation de majorité sans nécessairement recevoir une copie du document utilisé.",
      ] },
      { p: "Le résultat peut prendre la forme d'une attestation numérique indiquant uniquement que l'utilisateur a 18 ans ou plus." },
      { p: "Cette approche permet de séparer la vérification de l'âge de l'utilisation du service de rencontres." },
      { h: "6.3. Preuve d'âge numérique" },
      { p: "Les technologies de preuve d'âge numérique permettent de démontrer qu'une personne remplit une condition d'âge sans communiquer l'ensemble des informations contenues dans son document d'identité." },
      { p: "Certaines technologies cryptographiques, notamment les preuves à divulgation nulle de connaissance (Zero-Knowledge Proofs), permettent de prouver une information sans révéler les autres données qui ne sont pas nécessaires à la vérification." },
      { p: "Par exemple, un utilisateur peut prouver qu'il est majeur sans communiquer :" },
      { ul: [
        "Son numéro de passeport.",
        "Son numéro de carte d'identité.",
        "Son adresse personnelle.",
        "Son lieu de naissance.",
        "Les autres informations présentes sur son document officiel.",
      ] },
      { p: "SWIVV MATCH souhaite privilégier ce type d'approche lorsque des solutions adaptées et suffisamment fiables sont disponibles." },
      { h: "6.4. Vérification par document d'identité" },
      { p: "Une vérification à partir d'un document officiel peut être utilisée par un prestataire spécialisé lorsque cela est nécessaire." },
      { p: "Il peut s'agir notamment :" },
      { ul: [
        "D'une carte nationale d'identité.",
        "D'un passeport.",
        "D'un autre document officiel reconnu.",
      ] },
      { p: "Lorsque cette méthode est utilisée, le recours à un prestataire indépendant et la limitation des données communiquées à SWIVV MATCH sont privilégiés." },
      { p: "La collecte directe et systématique de copies de documents d'identité par SWIVV MATCH n'est pas notre méthode de vérification par défaut." },
      { h: "6.5. Estimation de l'âge par technologie" },
      { p: "Certaines solutions permettent d'estimer une tranche d'âge à partir de caractéristiques techniques ou d'images." },
      { p: "Ces solutions ne sont pas nécessairement équivalentes à une vérification fiable de l'identité ou de l'âge." },
      { p: "Elles peuvent comporter des marges d'erreur et soulever des questions importantes en matière de protection des données personnelles, notamment lorsque des données biométriques sont traitées." },
      { p: "SWIVV MATCH ne considère pas une simple estimation algorithmique comme une preuve certaine de majorité." },
      { p: "Toute éventuelle utilisation de telles technologies nécessiterait une analyse juridique, technique et de protection des données préalable." },
    ],
  },
  {
    title: "7. Protection des mineurs et prévention des faux comptes",
    blocks: [
      { p: "La politique 18+ de SWIVV MATCH ne repose pas uniquement sur la déclaration effectuée lors de l'inscription." },
      { p: "La plateforme prévoit des mécanismes destinés à détecter et traiter les situations susceptibles de révéler qu'un compte appartient à une personne mineure." },
      { p: "Ces mesures peuvent notamment comprendre :" },
      { ul: [
        "Des contrôles automatiques des dates de naissance.",
        "La détection d'informations incohérentes.",
        "Un système de signalement accessible aux membres.",
        "Un dispositif de modération.",
        "Des restrictions temporaires lorsqu'un risque crédible est identifié.",
        "Une procédure de réexamen lorsqu'une restriction a été appliquée par erreur.",
      ] },
      { p: "Les utilisateurs peuvent signaler un profil lorsqu'ils disposent de raisons sérieuses de penser que la personne concernée a moins de 18 ans." },
      { p: "Le signalement doit être examiné avec sérieux et dans le respect des droits des personnes concernées." },
    ],
  },
  {
    title: "8. Signalement d'un utilisateur susceptible d'être mineur",
    blocks: [
      { p: "Si un membre pense qu'un autre utilisateur est âgé de moins de 18 ans, il peut utiliser la fonction de signalement disponible sur la plateforme." },
      { p: "Le signalement peut notamment être effectué pour le motif :" },
      { p: "**« Je pense que cet utilisateur est mineur. »**" },
      { p: "À la réception d'un signalement :" },
      { ol: [
        "Le signalement est enregistré.",
        "Il peut être examiné par l'équipe de modération.",
        "Des mesures temporaires peuvent être appliquées lorsque cela est justifié.",
        "Une vérification complémentaire peut être demandée.",
        "Une décision est prise en fonction des informations disponibles.",
      ] },
      { p: "Les signalements abusifs, malveillants ou manifestement infondés peuvent également faire l'objet d'un examen." },
      { p: "SWIVV MATCH s'efforce de traiter ces situations de manière confidentielle, impartiale et proportionnée." },
    ],
  },
  {
    title: "9. Suspension et suppression des comptes appartenant à des mineurs",
    blocks: [
      { p: "Lorsqu'il est établi qu'un compte appartient à une personne de moins de 18 ans, SWIVV MATCH peut suspendre ou supprimer le compte." },
      { p: "La personne concernée ne peut plus utiliser les fonctionnalités de rencontres, de mise en relation et de communication réservées aux adultes." },
      { p: "Les mesures peuvent comprendre :" },
      { ul: [
        "La suspension de l'accès au compte.",
        "La désactivation des fonctionnalités de messagerie.",
        "La désactivation des échanges de fichiers et d'enregistrements vocaux.",
        "La suppression du compte lorsque les conditions applicables le justifient.",
        "La conservation limitée des informations nécessaires à la sécurité, à la gestion d'un incident ou au respect d'une obligation légale.",
      ] },
      { p: "Les données personnelles ne sont pas conservées indéfiniment." },
      { p: "Les durées de conservation sont déterminées en fonction de la finalité du traitement et des obligations légales applicables." },
    ],
  },
  {
    title: "10. Droit à une révision et contestation d'une décision",
    blocks: [
      { p: "Une personne dont le compte a été suspendu à la suite d'un doute concernant son âge peut contacter SWIVV MATCH afin de demander le réexamen de sa situation." },
      { p: "Si une vérification complémentaire est nécessaire, la plateforme peut proposer une méthode adaptée permettant d'établir que la personne est majeure." },
      { p: "Les informations demandées doivent être limitées à ce qui est nécessaire pour examiner la contestation." },
      { p: "Une restriction appliquée par erreur peut être réexaminée et levée lorsque les éléments fournis permettent de confirmer l'éligibilité de l'utilisateur." },
    ],
  },
  {
    title: "11. Le cadre juridique français",
    blocks: [
      { p: "La plateforme tient compte des dispositions françaises applicables aux services numériques, à la protection des données personnelles et à la protection des mineurs." },
      { h: "11.1. Le Règlement général sur la protection des données" },
      { p: "Le RGPD, règlement (UE) 2016/679, est directement applicable en France." },
      { p: "Il encadre notamment :" },
      { ul: [
        "La collecte et l'utilisation des données personnelles.",
        "Les bases juridiques des traitements.",
        "L'information des utilisateurs.",
        "La durée de conservation des données.",
        "Les droits des personnes.",
        "La sécurité des traitements.",
        "Les éventuelles analyses d'impact relatives à la protection des données.",
      ] },
      { p: "SWIVV MATCH doit notamment s'assurer que chaque traitement relatif à l'âge repose sur une base juridique appropriée et que les informations collectées sont proportionnées à sa finalité." },
      { h: "11.2. La loi Informatique et Libertés" },
      { p: "La loi française n° 78-17 du 6 janvier 1978, modifiée, complète le cadre européen de protection des données personnelles." },
      { p: "Elle encadre les traitements réalisés en France et les compétences de la Commission nationale de l'informatique et des libertés (CNIL)." },
      { h: "11.3. Le Code pénal et les contenus pornographiques" },
      { p: "L'article 227-24 du Code pénal prévoit des dispositions spécifiques concernant la diffusion de messages ou contenus pornographiques susceptibles d'être vus ou perçus par des mineurs." },
      { p: "La législation française impose des obligations particulières aux services diffusant ce type de contenu." },
      { p: "Ces dispositions ne doivent pas être confondues avec les règles applicables à une plateforme ordinaire de rencontres." },
      { p: "SWIVV MATCH est conçu comme un service de rencontres et de mise en relation pour adultes et non comme un service de diffusion de contenus pornographiques." },
      { p: "Si la nature du service évolue ou si des fonctionnalités de diffusion de contenus pornographiques sont introduites, une nouvelle analyse juridique sera nécessaire." },
      { h: "11.4. Le rôle de la CNIL" },
      { p: "La CNIL est l'autorité française chargée de veiller à la protection des données personnelles." },
      { p: "Elle a notamment publié des recommandations sur la vérification de l'âge en ligne et sur les moyens de concilier la protection des mineurs et le respect de la vie privée." },
      { p: "Ses travaux soulignent l'importance de la proportionnalité, de la minimisation des données et du recours à des solutions respectueuses de la confidentialité." },
    ],
  },
  {
    title: "12. Le cadre juridique européen",
    blocks: [
      { h: "12.1. Le Règlement général sur la protection des données (RGPD)" },
      { p: "Le RGPD s'applique aux traitements de données personnelles réalisés dans le cadre des activités de SWIVV MATCH lorsque les conditions territoriales prévues par le règlement sont réunies." },
      { p: "Il impose notamment :" },
      { ul: [
        "Une base juridique pour chaque traitement.",
        "Une information claire des utilisateurs.",
        "La limitation des données collectées.",
        "Des mesures de sécurité appropriées.",
        "Le respect des droits des personnes.",
        "Une durée de conservation proportionnée.",
      ] },
      { p: "Les utilisateurs peuvent notamment exercer les droits qui leur sont reconnus par le RGPD, sous réserve des conditions et exceptions applicables." },
      { h: "12.2. Le Digital Services Act (DSA)" },
      { p: "Le règlement (UE) 2022/2065, connu sous le nom de Digital Services Act ou DSA, établit un cadre européen applicable à différents services numériques." },
      { p: "Son article 28 prévoit notamment des obligations de protection de la vie privée, de la sécurité et de la sûreté des mineurs pour les plateformes en ligne accessibles aux mineurs." },
      { p: "L'article 28 prévoit également que le respect de ces obligations ne doit pas, à lui seul, conduire les plateformes à traiter des données personnelles supplémentaires dans le seul but de déterminer si un utilisateur est mineur." },
      { p: "Le DSA adopte une approche fondée sur la nature du service et les risques auxquels les utilisateurs peuvent être exposés." },
      { p: "Il convient également de tenir compte de l'article 19 du DSA, qui prévoit une exemption de certaines obligations, notamment celles de l'article 28, pour les fournisseurs de plateformes en ligne qui répondent à la définition des microentreprises ou petites entreprises, sous réserve des exceptions prévues par le règlement." },
      { p: "L'application de ces dispositions dépend de la situation réelle de l'entreprise, de la nature de son service et de son évolution." },
      { h: "12.3. Les lignes directrices européennes de 2025 relatives à la protection des mineurs" },
      { p: "Le 14 juillet 2025, la Commission européenne a publié des lignes directrices relatives aux mesures permettant d'assurer un niveau élevé de confidentialité, de sécurité et de protection des mineurs en ligne, conformément à l'article 28 du DSA." },
      { p: "Ces lignes directrices abordent notamment :" },
      { ul: [
        "La conception des services en tenant compte de la sécurité des mineurs.",
        "La limitation des contacts non désirés.",
        "Les systèmes de vérification et d'assurance de l'âge.",
        "La protection de la vie privée.",
        "Les mécanismes de signalement.",
        "La prévention des risques liés aux interactions en ligne.",
      ] },
      { p: "Elles encouragent des mesures proportionnées et efficaces et soulignent qu'une simple déclaration d'âge dans les conditions générales ne suffit pas, à elle seule, à démontrer qu'une plateforme empêche effectivement les mineurs d'accéder à son service lorsqu'elle est accessible à ces derniers." },
      { p: "La Commission précise également que les lignes directrices visent les plateformes entrant dans leur champ d'application et prévoient une exception pour les microentreprises et petites entreprises dans les conditions du DSA." },
      { h: "12.4. La solution européenne de vérification de l'âge" },
      { p: "La Commission européenne développe une approche harmonisée de la vérification de l'âge, destinée à permettre aux utilisateurs de démontrer qu'ils remplissent une condition d'âge sans communiquer inutilement leur identité." },
      { p: "La solution européenne s'appuie notamment sur des mécanismes de preuve numérique et des principes de protection de la vie privée." },
      { p: "Elle vise à permettre, par exemple, de prouver qu'une personne est âgée de plus de 18 ans sans transmettre à chaque service consulté l'ensemble des informations présentes sur son document d'identité." },
      { p: "SWIVV MATCH suit l'évolution de ces initiatives afin de pouvoir étudier leur intégration lorsque les solutions seront disponibles et adaptées à son activité." },
    ],
  },
  {
    title: "13. Cadre juridique international",
    blocks: [
      { p: "SWIVV MATCH peut être accessible à des utilisateurs résidant dans différents pays." },
      { p: "Il n'existe pas une règle internationale unique qui impose à tous les sites de rencontres de demander systématiquement une copie d'un document d'identité à chaque utilisateur majeur." },
      { p: "Les obligations dépendent notamment :" },
      { ul: [
        "Du pays dans lequel le service est exploité.",
        "Du pays dans lequel l'utilisateur réside.",
        "De la nature des fonctionnalités proposées.",
        "Du type de données personnelles collectées.",
        "Des risques associés au service.",
        "Des éventuelles obligations sectorielles applicables.",
      ] },
      { p: "La plateforme doit donc tenir compte des législations locales lorsque son activité est proposée dans de nouveaux territoires." },
      { h: "13.1. Royaume-Uni" },
      { p: "Le Royaume-Uni dispose notamment de l'Online Safety Act 2023, qui établit différentes obligations de sécurité pour certains services numériques." },
      { p: "Les obligations applicables dépendent notamment de la catégorie du service, de son fonctionnement et des risques identifiés." },
      { p: "La législation prévoit, dans certains cas, le recours à des méthodes efficaces de vérification ou d'estimation de l'âge pour empêcher les enfants d'accéder à certains contenus préjudiciables." },
      { p: "Elle prévoit également des dispositions particulières relatives à la vérification de l'identité pour certaines catégories de services." },
      { p: "Ces obligations ne signifient pas que chaque site de rencontres doit systématiquement collecter une pièce d'identité de tous ses membres." },
      { p: "SWIVV MATCH doit examiner les obligations applicables à son service avant de proposer ou de développer des fonctionnalités destinées au marché britannique." },
      { h: "13.2. États-Unis" },
      { p: "Aux États-Unis, plusieurs textes fédéraux et lois adoptées au niveau des États encadrent la protection des mineurs et les données personnelles." },
      { p: "Le Children's Online Privacy Protection Act (COPPA) concerne notamment la collecte de données personnelles auprès des enfants de moins de 13 ans par les services entrant dans son champ d'application." },
      { p: "COPPA ne constitue pas une obligation générale imposant à tous les services de rencontres de vérifier les pièces d'identité de chaque utilisateur âgé de 18 ans ou plus." },
      { p: "D'autres dispositions fédérales ou étatiques peuvent néanmoins s'appliquer selon le fonctionnement du service, les utilisateurs ciblés et les données traitées." },
      { p: "Une analyse juridique spécifique est nécessaire avant le lancement ou la commercialisation du service dans les différents États américains." },
      { h: "13.3. Canada" },
      { p: "Le Canada dispose de règles fédérales et provinciales relatives à la protection des renseignements personnels." },
      { p: "Selon les circonstances, différentes dispositions peuvent s'appliquer aux services numériques qui collectent et utilisent des informations personnelles." },
      { p: "La collecte d'une pièce d'identité doit être justifiée par une finalité légitime et respecter les principes applicables de nécessité et de proportionnalité." },
      { p: "Les exigences précises doivent être examinées en fonction de la province concernée et des activités effectivement proposées." },
      { h: "13.4. Australie" },
      { p: "L'Australie dispose d'un cadre législatif relatif à la sécurité en ligne et à la protection des enfants." },
      { p: "L'Online Safety Act 2021 et les instruments adoptés pour son application prévoient différentes obligations pour les services numériques." },
      { p: "Les règles australiennes relatives à l'âge minimum sur certaines plateformes ne doivent pas être automatiquement assimilées à une interdiction applicable à tous les services de rencontres." },
      { p: "L'application des dispositions pertinentes doit être examinée en fonction de la catégorie exacte du service et de ses fonctionnalités." },
      { h: "13.5. Autres pays" },
      { p: "Pour les autres territoires, SWIVV MATCH examine les exigences légales applicables avant d'y développer ses activités." },
      { p: "Les réglementations relatives à l'âge minimum, à la protection des mineurs, aux données personnelles et aux services numériques peuvent varier considérablement d'un pays à l'autre." },
      { p: "Aucune déclaration générale ne peut remplacer l'analyse des règles propres à chaque juridiction." },
    ],
  },
  {
    title: "14. Évolution de notre politique de vérification",
    blocks: [
      { p: "Les technologies et réglementations relatives à la vérification de l'âge évoluent rapidement." },
      { p: "SWIVV MATCH suit notamment :" },
      { ul: [
        "Les recommandations de la CNIL.",
        "Les évolutions du Digital Services Act.",
        "Les lignes directrices de la Commission européenne.",
        "Les initiatives européennes relatives à l'identité numérique.",
        "Les travaux relatifs aux preuves d'âge respectueuses de la vie privée.",
        "Les nouvelles obligations applicables aux plateformes numériques dans les pays où le service est proposé.",
      ] },
      { p: "La plateforme peut faire évoluer ses procédures de vérification lorsque cela est nécessaire pour renforcer la sécurité, respecter une nouvelle obligation légale ou améliorer la protection des utilisateurs." },
      { p: "Toute modification importante de la présente politique sera portée à la connaissance des utilisateurs selon les modalités appropriées." },
    ],
  },
  {
    title: "15. Contact et demandes concernant la vérification de l'âge",
    blocks: [
      { p: "Pour toute question concernant :" },
      { ul: [
        "La politique 18+ de SWIVV MATCH.",
        "La déclaration de majorité.",
        "Une demande de vérification complémentaire.",
        "La suspension d'un compte pour un motif lié à l'âge.",
      ] },
      { p: "Vous pouvez contacter notre équipe :" },
      { p: "**SWIVV MATCH**" },
      { p: "Site Internet : https://swivvmatch.com" },
      { p: "Adresse électronique : contact@swivvmatch.com" },
    ],
  },
  {
    title: "16. Textes officiels et ressources de référence",
    blocks: [
      { p: "Les textes et ressources suivants constituent des références importantes pour comprendre le cadre juridique relatif à la vérification de l'âge et à la protection des mineurs." },
      { h: "France" },
      { ul: [
        "**CNIL – Vérification de l'âge en ligne : trouver l'équilibre entre protection des mineurs et respect de la vie privée** https://www.cnil.fr/fr/verification-de-lage-en-ligne-trouver-lequilibre-entre-protection-des-mineurs-et-respect-de-la-vie",
        "**Loi Informatique et Libertés du 6 janvier 1978** https://www.legifrance.gouv.fr/",
        "**Code pénal – Article 227-24** https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043409193",
      ] },
      { h: "Union européenne" },
      { ul: [
        "**Règlement général sur la protection des données – Règlement (UE) 2016/679** https://eur-lex.europa.eu/eli/reg/2016/679/oj",
        "**Digital Services Act – Règlement (UE) 2022/2065** https://eur-lex.europa.eu/eli/reg/2022/2065/oj",
        "**Commission européenne – Lignes directrices sur la protection des mineurs en ligne, 2025** https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025XC05519",
        "**Commission européenne – Approche européenne de la vérification de l'âge** https://digital-strategy.ec.europa.eu/en/policies/eu-age-verification",
        "**Commission européenne – Solution européenne de vérification de l'âge** https://digital-strategy.ec.europa.eu/en/factpages/blueprint-age-verification-solution-help-protect-minors-online",
      ] },
      { h: "Royaume-Uni" },
      { ul: [
        "**Online Safety Act 2023** https://www.legislation.gov.uk/ukpga/2023/50",
        "**Ofcom – Online Safety** https://www.ofcom.org.uk/online-safety",
      ] },
      { h: "États-Unis" },
      { ul: [
        "**Federal Trade Commission – Children's Online Privacy Protection Rule (COPPA)** https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa",
      ] },
      { h: "Canada" },
      { ul: ["**Office of the Privacy Commissioner of Canada** https://www.priv.gc.ca/"] },
      { h: "Australie" },
      { ul: ["**eSafety Commissioner** https://www.esafety.gov.au/"] },
    ],
  },
  {
    title: "17. Engagement de SWIVV MATCH",
    blocks: [
      { p: "La confiance et la sécurité de notre communauté sont essentielles." },
      { p: "SWIVV MATCH s'engage à :" },
      { ul: [
        "Réserver son service aux personnes âgées de 18 ans et plus.",
        "Mettre en place des mesures adaptées pour empêcher l'accès des mineurs.",
        "Ne pas exiger systématiquement des copies de documents d'identité sans nécessité.",
        "Privilégier les solutions de vérification proportionnées et respectueuses de la vie privée.",
        "Traiter les signalements relatifs à la présence éventuelle de mineurs.",
        "Faire évoluer ses dispositifs en fonction des exigences légales et des avancées technologiques.",
      ] },
      { p: "**SWIVV MATCH – Your Match. Your Story.**" },
      { p: "Votre vie privée compte. Votre sécurité aussi." },
    ],
  },
];

const COPY = {
  fr: {
    title: "Vérification de l'âge & protection des mineurs",
    subtitle: "SWIVV MATCH — Dernière mise à jour : novembre 2026",
  },
  en: {
    title: "Age Verification & Protection of Minors",
    subtitle: "SWIVV MATCH — Last updated: November 2026",
  },
  es: {
    title: "Verificación de edad y protección de menores",
    subtitle: "SWIVV MATCH — Última actualización: noviembre de 2026",
  },
};

function AgeVerificationPage() {
  const t = useT();
  const lang = useLang();
  const copy = COPY[lang];
  const sections: Section[] = lang === "en" ? AGE_SECTIONS_EN : lang === "es" ? AGE_SECTIONS_ES : SECTIONS;
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
        title={copy.title}
        subtitle={copy.subtitle}
        icon={UserCheck}
        tall
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mt-6 grid gap-3">
          {sections.map((s) => (
            <section key={s.title} className={LEGAL_CARD}>
              <h2 className="font-extrabold tracking-[-0.01em] text-[#111]">{s.title}</h2>
              {s.blocks.map((b, i) => (
                <div key={i}>
                  {b.h && <h3 className="mt-4 font-bold text-[#111]">{b.h}</h3>}
                  {b.p && <p className="mt-2 text-sm leading-relaxed text-[#6b6b6b]"><Rich text={b.p} /></p>}
                  {b.ul && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#6b6b6b]">
                      {b.ul.map((x) => <li key={x}><Rich text={x} /></li>)}
                    </ul>
                  )}
                  {b.ol && (
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[#6b6b6b]">
                      {b.ol.map((x) => <li key={x}><Rich text={x} /></li>)}
                    </ol>
                  )}
                </div>
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
          <Link to="/confidentialite-donnees" className={LEGAL_PILL}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> {t("Confidentialité des données")}
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
