import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Cookie, KeyRound, Lock, ReceiptText, Scale, ShieldCheck, UserCheck } from "lucide-react";
import { LEGAL_CARD, LEGAL_PILL, LegalHero } from "@/components/swivv-legal-hero";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { pageHead } from "@/lib/seo";
import { useLang, useT, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/confidentialite-donnees")({
  head: () =>
    pageHead(
      "Confidentialité des données – SWIVV MATCH",
      "Politique de confidentialité des données de SWIVV MATCH : données traitées, principes RGPD, droits des utilisateurs, conservation et sécurité.",
      "/confidentialite-donnees",
    ),
  component: DataPrivacyPage,
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
      { p: "SWIVV MATCH accorde une importance particulière à la confidentialité des informations communiquées lors de l'inscription et de l'utilisation du service." },
      { p: "La présente politique décrit les principes applicables à la protection des données personnelles, les catégories de données traitées, les droits dont disposent les utilisateurs et les durées de conservation." },
      { p: "Elle complète notre politique de **vérification de l'âge et de protection des mineurs**, qui traite spécifiquement des conditions d'âge et des mesures destinées à empêcher l'accès des mineurs." },
      { p: "Le responsable du traitement est SWIVV MATCH, 10 Rue Thureau Dangin, 75015 Paris, France. Contact pour toute question relative aux données personnelles : contact@swivvmatch.com." },
      { p: "Aucun délégué à la protection des données (DPO) n'a été désigné : les demandes sont traitées par l'équipe support." },
    ],
  },
  {
    title: "2. Principes de protection des données",
    blocks: [
      { p: "Les informations relatives à l'âge sont des données personnelles lorsqu'elles permettent d'identifier directement ou indirectement un utilisateur." },
      { p: "Leur collecte et leur traitement doivent respecter le Règlement général sur la protection des données (RGPD), notamment les principes de :" },
      { ul: [
        "Licéité, loyauté et transparence.",
        "Limitation des finalités.",
        "Minimisation des données.",
        "Exactitude.",
        "Limitation de la conservation.",
        "Intégrité et confidentialité.",
        "Responsabilité du responsable de traitement.",
      ] },
      { p: "SWIVV MATCH cherche à limiter les données collectées à celles nécessaires au fonctionnement du service, à la sécurité des utilisateurs et au respect des obligations applicables." },
    ],
  },
  {
    title: "3. Données pouvant être traitées",
    blocks: [
      { h: "3.1. Données liées au compte et au profil" },
      { p: "Selon les fonctionnalités effectivement utilisées, les informations suivantes peuvent être traitées :" },
      { ul: [
        "Prénom, adresse e-mail, âge et ville.",
        "Photos, biographie, centres d'intérêt et intention de rencontre.",
        "Likes, matchs, messages et préférences de recherche.",
        "Données techniques : adresse IP, journaux de connexion et type d'appareil.",
        "Messages envoyés à l'équipe support.",
      ] },
      { h: "3.2. Données liées à la vérification de l'âge" },
      { p: "Selon les procédures de vérification effectivement utilisées, les informations suivantes peuvent être traitées :" },
      { ul: [
        "Date de naissance.",
        "Résultat du contrôle d'âge.",
        "Confirmation de la déclaration de majorité.",
        "Date et heure de la déclaration.",
        "Statut d'une éventuelle vérification complémentaire.",
        "Résultat transmis par un prestataire indépendant.",
        "Informations nécessaires à la gestion d'un signalement ou d'une contestation.",
      ] },
      { p: "Les informations collectées dépendent de la méthode de vérification effectivement utilisée." },
    ],
  },
  {
    title: "4. Données que SWIVV MATCH cherche à ne pas collecter inutilement",
    blocks: [
      { p: "La plateforme ne souhaite pas collecter systématiquement les informations suivantes dans le seul but de vérifier la majorité :" },
      { ul: [
        "Numéro de passeport.",
        "Numéro de carte nationale d'identité.",
        "Numéro de permis de conduire.",
        "Adresse figurant sur un document officiel.",
        "Copie intégrale d'un document d'identité.",
        "Informations biométriques non nécessaires à la vérification.",
      ] },
    ],
  },
  {
    title: "5. Confidentialité de la date de naissance",
    blocks: [
      { p: "La date de naissance fournie lors de l'inscription n'est pas destinée à être affichée publiquement sur les profils de rencontres." },
      { p: "Elle doit être protégée par des contrôles d'accès appropriés." },
      { p: "Les autres membres ne doivent pas pouvoir accéder à la date de naissance complète d'un utilisateur par l'intermédiaire de son profil ou des fonctionnalités publiques de la plateforme." },
    ],
  },
  {
    title: "6. Sécurité des données",
    blocks: [
      { p: "SWIVV MATCH met en œuvre des mesures techniques et organisationnelles adaptées à la nature des données traitées." },
      { p: "Ces mesures peuvent comprendre :" },
      { ul: [
        "Le contrôle des accès.",
        "L'authentification sécurisée.",
        "La limitation des droits des utilisateurs et administrateurs.",
        "Le chiffrement lorsque cela est approprié.",
        "La sécurisation des échanges de données.",
        "La surveillance des accès non autorisés.",
        "La gestion des incidents de sécurité.",
        "Des règles de conservation et de suppression des informations.",
      ] },
    ],
  },
  {
    title: "7. Pourquoi SWIVV MATCH privilégie la minimisation des données",
    blocks: [
      { p: "La protection de la vie privée est particulièrement importante sur une plateforme de rencontres." },
      { p: "Les profils, préférences, conversations et interactions peuvent révéler des informations personnelles très intimes." },
      { p: "Certaines informations relatives à la vie sexuelle ou à l'orientation sexuelle peuvent notamment relever des catégories particulières de données personnelles prévues par l'article 9 du RGPD." },
      { p: "C'est pourquoi SWIVV MATCH souhaite éviter de collecter des informations d'identité qui ne sont pas nécessaires à la fourniture du service." },
      { p: "Notre objectif est de limiter la vérification à ce qui est utile pour garantir l'accès aux adultes et protéger la communauté." },
      { p: "Nous privilégions notamment :" },
      { ul: [
        "La vérification de la majorité plutôt que la collecte systématique de l'identité complète.",
        "La transmission d'un résultat de vérification plutôt que d'une copie de document.",
        "Le recours à des prestataires indépendants lorsque cela est approprié.",
        "La limitation des durées de conservation.",
        "La sécurisation des informations.",
        "La transparence envers les utilisateurs.",
      ] },
    ],
  },
  {
    title: "8. Droits des utilisateurs concernant leurs données personnelles",
    blocks: [
      { p: "Conformément au RGPD, les utilisateurs disposent de droits concernant les données personnelles qui les concernent, dans les conditions prévues par la réglementation." },
      { p: "Ces droits comprennent notamment :" },
      { p: "**Droit d'accès :** obtenir des informations sur les données personnelles traitées par SWIVV MATCH." },
      { p: "**Droit de rectification :** demander la correction de données inexactes ou incomplètes." },
      { p: "**Droit à l'effacement :** demander la suppression de certaines données lorsque les conditions légales sont réunies." },
      { p: "**Droit à la limitation :** demander, dans certaines situations, la limitation du traitement." },
      { p: "**Droit d'opposition :** s'opposer à certains traitements lorsque les conditions légales sont réunies." },
      { p: "**Droit à la portabilité :** recevoir certaines données dans un format structuré et couramment utilisé, lorsque ce droit est applicable." },
      { p: "Les demandes peuvent être adressées à :" },
      { p: "**contact@swivvmatch.com**" },
      { p: "Les demandes sont examinées dans les délais et selon les modalités prévus par le RGPD." },
      { p: "Les utilisateurs peuvent également introduire une réclamation auprès de l'autorité de contrôle compétente, notamment la CNIL pour les traitements relevant de sa compétence." },
      { p: "Site officiel de la CNIL : https://www.cnil.fr/" },
    ],
  },
  {
    title: "9. Conservation et suppression des données",
    blocks: [
      { p: "SWIVV MATCH ne souhaite pas conserver les informations personnelles au-delà de ce qui est nécessaire aux finalités pour lesquelles elles sont traitées." },
      { p: "Les informations relatives à l'âge et aux éventuelles vérifications complémentaires sont conservées selon des durées adaptées à leur finalité." },
      { p: "Les informations nécessaires à la gestion d'un incident de sécurité, d'un signalement ou d'une obligation légale peuvent faire l'objet d'une conservation spécifique lorsque cela est justifié." },
      { p: "Lorsqu'un compte est supprimé, les données sont supprimées ou anonymisées selon les procédures applicables, sous réserve des obligations légales de conservation et des nécessités légitimes de gestion des litiges ou de sécurité." },
      { p: "Les documents d'identité éventuellement traités par un prestataire indépendant sont soumis aux règles de conservation de ce prestataire et aux informations qui doivent être communiquées à l'utilisateur." },
    ],
  },
  {
    title: "10. Évolution de notre politique de confidentialité",
    blocks: [
      { p: "Les technologies et réglementations relatives à la protection des données personnelles évoluent rapidement." },
      { p: "SWIVV MATCH suit notamment :" },
      { ul: [
        "Les recommandations de la CNIL.",
        "Les évolutions du Règlement général sur la protection des données.",
        "Les lignes directrices de la Commission européenne.",
        "Les initiatives européennes relatives à l'identité numérique.",
        "Les travaux relatifs aux preuves d'âge respectueuses de la vie privée.",
        "Les nouvelles obligations applicables aux plateformes numériques dans les pays où le service est proposé.",
      ] },
      { p: "La plateforme peut faire évoluer ses procédures de protection des données lorsque cela est nécessaire pour renforcer la sécurité, respecter une nouvelle obligation légale ou améliorer la protection des utilisateurs." },
      { p: "Toute modification importante de la présente politique sera portée à la connaissance des utilisateurs selon les modalités appropriées." },
    ],
  },
  {
    title: "11. Contact et demandes relatives aux données personnelles",
    blocks: [
      { p: "Pour toute question concernant :" },
      { ul: [
        "La protection des données personnelles.",
        "L'exercice des droits prévus par le RGPD.",
        "La suppression d'un compte ou de certaines données.",
        "Un incident de sécurité.",
      ] },
      { p: "Vous pouvez contacter notre équipe :" },
      { p: "**SWIVV MATCH**" },
      { p: "Site Internet : https://swivvmatch.com" },
      { p: "Adresse électronique : contact@swivvmatch.com" },
    ],
  },
  {
    title: "12. Textes officiels et ressources de référence",
    blocks: [
      { p: "Les textes et ressources suivants constituent des références importantes pour comprendre le cadre applicable à la protection des données personnelles." },
      { h: "France" },
      { ul: [
        "**Loi Informatique et Libertés du 6 janvier 1978** https://www.legifrance.gouv.fr/",
        "**Commission nationale de l'informatique et des libertés (CNIL)** https://www.cnil.fr/",
      ] },
      { h: "Union européenne" },
      { ul: [
        "**Règlement général sur la protection des données – Règlement (UE) 2016/679** https://eur-lex.europa.eu/eli/reg/2016/679/oj",
      ] },
    ],
  },
  {
    title: "13. Engagement de SWIVV MATCH",
    blocks: [
      { p: "La confiance de notre communauté repose notamment sur le respect de la vie privée." },
      { p: "SWIVV MATCH s'engage à :" },
      { ul: [
        "Protéger la confidentialité des données personnelles des utilisateurs.",
        "Limiter la collecte aux informations nécessaires au fonctionnement du service.",
        "Ne pas revendre les données personnelles.",
        "Ne pas utiliser les données de rencontres à des fins de publicité ciblée.",
        "Respecter les droits prévus par le RGPD.",
        "Sécuriser les informations et limiter les accès internes.",
        "Supprimer ou anonymiser les données selon les durées annoncées.",
        "Faire évoluer ses dispositifs en fonction des exigences légales et des avancées technologiques.",
      ] },
      { p: "**SWIVV MATCH – Your Match. Your Story.**" },
      { p: "Votre vie privée compte. Votre sécurité aussi." },
    ],
  },
];

const SECTIONS_EN: Section[] = [
  {
    title: "1. Introduction",
    blocks: [
      { p: "SWIVV MATCH places particular importance on the confidentiality of the information provided when registering for and using the service." },
      { p: "This policy describes the principles governing the protection of personal data, the categories of data processed, the rights available to users and the applicable data retention periods." },
      { p: "It complements our **Age Verification and Child Protection Policy**, which specifically addresses age requirements and the measures designed to prevent minors from accessing the platform." },
      { p: "The data controller is SWIVV MATCH, 10 Rue Thureau Dangin, 75015 Paris, France. For any questions relating to personal data, please contact: contact@swivvmatch.com." },
      { p: "No Data Protection Officer (DPO) has been appointed. Requests are handled by the support team." },
    ],
  },
  {
    title: "2. Data Protection Principles",
    blocks: [
      { p: "Information relating to a user's age constitutes personal data when it makes that user directly or indirectly identifiable." },
      { p: "Its collection and processing must comply with the General Data Protection Regulation (GDPR), particularly the following principles:" },
      { ul: [
        "Lawfulness, fairness and transparency.",
        "Purpose limitation.",
        "Data minimisation.",
        "Accuracy.",
        "Storage limitation.",
        "Integrity and confidentiality.",
        "Accountability of the data controller.",
      ] },
      { p: "SWIVV MATCH seeks to limit the data it collects to information necessary for operating the service, ensuring user safety and complying with applicable obligations." },
    ],
  },
  {
    title: "3. Data That May Be Processed",
    blocks: [
      { h: "3.1. Account and Profile Data" },
      { p: "Depending on the features actually used, the following information may be processed:" },
      { ul: [
        "First name, email address, age and city.",
        "Photos, biography, interests and dating intentions.",
        "Likes, matches, messages and search preferences.",
        "Technical data: IP address, connection logs and device type.",
        "Messages sent to the support team.",
      ] },
      { h: "3.2. Age Verification Data" },
      { p: "Depending on the verification procedures actually used, the following information may be processed:" },
      { ul: [
        "Date of birth.",
        "Age-check result.",
        "Confirmation of the declaration of adulthood.",
        "Date and time of the declaration.",
        "Status of any additional verification.",
        "Result transmitted by an independent provider.",
        "Information necessary to manage a report or dispute.",
      ] },
      { p: "The information collected depends on the verification method actually used." },
    ],
  },
  {
    title: "4. Data SWIVV MATCH Seeks to Avoid Collecting Unnecessarily",
    blocks: [
      { p: "The platform does not intend to systematically collect the following information solely for the purpose of verifying that a user is an adult:" },
      { ul: [
        "Passport number.",
        "National identity card number.",
        "Driving licence number.",
        "Address shown on an official document.",
        "Full copy of an identity document.",
        "Biometric information that is not necessary for verification.",
      ] },
    ],
  },
  {
    title: "5. Confidentiality of Date of Birth",
    blocks: [
      { p: "The date of birth provided during registration is not intended to be displayed publicly on dating profiles." },
      { p: "It must be protected by appropriate access controls." },
      { p: "Other members must not be able to access a user's full date of birth through their profile or the platform's public-facing features." },
    ],
  },
  {
    title: "6. Data Security",
    blocks: [
      { p: "SWIVV MATCH implements technical and organisational measures appropriate to the nature of the data being processed." },
      { p: "These measures may include:" },
      { ul: [
        "Access controls.",
        "Secure authentication.",
        "Restrictions on user and administrator permissions.",
        "Encryption where appropriate.",
        "Secure data transfers.",
        "Monitoring of unauthorised access.",
        "Security incident management.",
        "Rules governing the retention and deletion of information.",
      ] },
    ],
  },
  {
    title: "7. Why SWIVV MATCH Prioritises Data Minimisation",
    blocks: [
      { p: "Privacy protection is particularly important on a dating platform." },
      { p: "Profiles, preferences, conversations and interactions may reveal highly intimate personal information." },
      { p: "Certain information relating to sexual life or sexual orientation may fall within the special categories of personal data provided for under Article 9 of the GDPR." },
      { p: "For this reason, SWIVV MATCH seeks to avoid collecting identity information that is not necessary to provide the service." },
      { p: "Our aim is to limit verification to what is useful for ensuring that the service is accessed by adults and for protecting our community." },
      { p: "In particular, we prioritise:" },
      { ul: [
        "Verifying that a user is an adult rather than systematically collecting their full identity.",
        "Transmitting a verification result rather than a copy of a document.",
        "Using independent providers where appropriate.",
        "Limiting data retention periods.",
        "Securing information.",
        "Being transparent with users.",
      ] },
    ],
  },
  {
    title: "8. Users' Rights Regarding Their Personal Data",
    blocks: [
      { p: "In accordance with the GDPR, users have rights concerning their personal data, subject to the conditions set out in the applicable regulations." },
      { p: "These rights include, in particular:" },
      { p: "**Right of access:** to obtain information about the personal data processed by SWIVV MATCH." },
      { p: "**Right to rectification:** to request the correction of inaccurate or incomplete data." },
      { p: "**Right to erasure:** to request the deletion of certain data where the legal conditions are met." },
      { p: "**Right to restriction of processing:** to request, in certain circumstances, that the processing of data be restricted." },
      { p: "**Right to object:** to object to certain processing activities where the legal conditions are met." },
      { p: "**Right to data portability:** to receive certain data in a structured, commonly used format where this right applies." },
      { p: "Requests may be sent to:" },
      { p: "**contact@swivvmatch.com**" },
      { p: "Requests are reviewed within the time limits and in accordance with the procedures set out in the GDPR." },
      { p: "Users may also lodge a complaint with the competent supervisory authority, including the CNIL in relation to processing activities falling within its remit." },
      { p: "Official CNIL website: https://www.cnil.fr/" },
    ],
  },
  {
    title: "9. Data Retention and Deletion",
    blocks: [
      { p: "SWIVV MATCH does not intend to retain personal information for longer than necessary for the purposes for which it is processed." },
      { p: "Information relating to age and any additional verification is retained for periods appropriate to its purpose." },
      { p: "Information necessary to manage a security incident, a report or a legal obligation may be subject to specific retention where justified." },
      { p: "When an account is deleted, data is deleted or anonymised in accordance with the applicable procedures, subject to legal retention obligations and legitimate requirements relating to the management of disputes or security." },
      { p: "Any identity documents processed by an independent provider are subject to that provider's retention rules and to the information that must be communicated to the user." },
    ],
  },
  {
    title: "10. Changes to Our Privacy Policy",
    blocks: [
      { p: "Technologies and regulations relating to the protection of personal data are evolving rapidly." },
      { p: "SWIVV MATCH monitors, in particular:" },
      { ul: [
        "CNIL recommendations.",
        "Developments in the General Data Protection Regulation.",
        "European Commission guidelines.",
        "European initiatives relating to digital identity.",
        "Work relating to privacy-preserving age proofs.",
        "New obligations applicable to digital platforms in the countries where the service is offered.",
      ] },
      { p: "The platform may update its data protection procedures where necessary to strengthen security, comply with a new legal obligation or improve user protection." },
      { p: "Any significant changes to this policy will be brought to users' attention through appropriate means." },
    ],
  },
  {
    title: "11. Contact and Requests Relating to Personal Data",
    blocks: [
      { p: "For any questions concerning:" },
      { ul: [
        "The protection of personal data.",
        "Exercising rights under the GDPR.",
        "Deleting an account or certain data.",
        "A security incident.",
      ] },
      { p: "You can contact our team:" },
      { p: "**SWIVV MATCH**" },
      { p: "Website: https://swivvmatch.com" },
      { p: "Email: contact@swivvmatch.com" },
    ],
  },
  {
    title: "12. Official Legislation and Reference Resources",
    blocks: [
      { p: "The following legislation and resources are important references for understanding the framework applicable to personal data protection." },
      { h: "France" },
      { ul: [
        "**French Data Protection Act of 6 January 1978 (Loi Informatique et Libertés)** https://www.legifrance.gouv.fr/",
        "**French Data Protection Authority (Commission nationale de l'informatique et des libertés – CNIL)** https://www.cnil.fr/",
      ] },
      { h: "European Union" },
      { ul: [
        "**General Data Protection Regulation – Regulation (EU) 2016/679** https://eur-lex.europa.eu/eli/reg/2016/679/oj",
      ] },
    ],
  },
  {
    title: "13. SWIVV MATCH's Commitment",
    blocks: [
      { p: "The trust of our community is based, in particular, on respect for privacy." },
      { p: "SWIVV MATCH is committed to:" },
      { ul: [
        "Protecting the confidentiality of users' personal data.",
        "Limiting data collection to information necessary for operating the service.",
        "Not selling personal data.",
        "Not using dating-related data for targeted advertising.",
        "Respecting the rights provided for under the GDPR.",
        "Securing information and limiting internal access.",
        "Deleting or anonymising data in accordance with the stated retention periods.",
        "Updating its safeguards in response to legal requirements and technological developments.",
      ] },
      { p: "**SWIVV MATCH – Your Match. Your Story.**" },
      { p: "Your privacy matters. Your safety matters too." },
    ],
  },
];

const SECTIONS_ES: Section[] = [
  {
    title: "1. Introducción",
    blocks: [
      { p: "SWIVV MATCH concede especial importancia a la confidencialidad de la información facilitada durante el registro y el uso del servicio." },
      { p: "Esta política describe los principios aplicables a la protección de los datos personales, las categorías de datos tratados, los derechos de los que disponen los usuarios y los plazos de conservación." },
      { p: "Complementa nuestra **Política de verificación de edad y protección de menores**, que aborda específicamente los requisitos de edad y las medidas destinadas a impedir el acceso de menores." },
      { p: "El responsable del tratamiento de los datos es SWIVV MATCH, 10 Rue Thureau Dangin, 75015 París, Francia. Para cualquier consulta relacionada con los datos personales, puede ponerse en contacto con nosotros en: contact@swivvmatch.com." },
      { p: "No se ha designado ningún delegado de protección de datos (DPO). Las solicitudes son gestionadas por el equipo de soporte." },
    ],
  },
  {
    title: "2. Principios de protección de datos",
    blocks: [
      { p: "La información relativa a la edad constituye un dato personal cuando permite identificar directa o indirectamente a un usuario." },
      { p: "Su recopilación y tratamiento deben respetar el Reglamento General de Protección de Datos (RGPD), en particular los siguientes principios:" },
      { ul: [
        "Licitud, lealtad y transparencia.",
        "Limitación de la finalidad.",
        "Minimización de los datos.",
        "Exactitud.",
        "Limitación del plazo de conservación.",
        "Integridad y confidencialidad.",
        "Responsabilidad del responsable del tratamiento.",
      ] },
      { p: "SWIVV MATCH procura limitar los datos recopilados a aquellos que sean necesarios para el funcionamiento del servicio, la seguridad de los usuarios y el cumplimiento de las obligaciones aplicables." },
    ],
  },
  {
    title: "3. Datos que pueden tratarse",
    blocks: [
      { h: "3.1. Datos de la cuenta y del perfil" },
      { p: "En función de las funcionalidades que se utilicen efectivamente, pueden tratarse los siguientes datos:" },
      { ul: [
        "Nombre, dirección de correo electrónico, edad y ciudad.",
        "Fotografías, biografía, intereses e intención de encontrar pareja.",
        "Likes, matches, mensajes y preferencias de búsqueda.",
        "Datos técnicos: dirección IP, registros de conexión y tipo de dispositivo.",
        "Mensajes enviados al equipo de soporte.",
      ] },
      { h: "3.2. Datos relacionados con la verificación de edad" },
      { p: "En función de los procedimientos de verificación que se utilicen efectivamente, pueden tratarse los siguientes datos:" },
      { ul: [
        "Fecha de nacimiento.",
        "Resultado del control de edad.",
        "Confirmación de la declaración de mayoría de edad.",
        "Fecha y hora de la declaración.",
        "Estado de cualquier verificación adicional.",
        "Resultado transmitido por un proveedor independiente.",
        "Información necesaria para gestionar una denuncia o una reclamación.",
      ] },
      { p: "La información recopilada depende del método de verificación que se utilice efectivamente." },
    ],
  },
  {
    title: "4. Datos que SWIVV MATCH procura no recopilar innecesariamente",
    blocks: [
      { p: "La plataforma no pretende recopilar sistemáticamente la siguiente información con el único fin de verificar que un usuario es mayor de edad:" },
      { ul: [
        "Número de pasaporte.",
        "Número del documento nacional de identidad.",
        "Número del permiso de conducir.",
        "Dirección que figura en un documento oficial.",
        "Copia íntegra de un documento de identidad.",
        "Información biométrica que no sea necesaria para la verificación.",
      ] },
    ],
  },
  {
    title: "5. Confidencialidad de la fecha de nacimiento",
    blocks: [
      { p: "La fecha de nacimiento facilitada durante el registro no está destinada a mostrarse públicamente en los perfiles de citas." },
      { p: "Debe protegerse mediante controles de acceso adecuados." },
      { p: "Los demás miembros no deben poder acceder a la fecha de nacimiento completa de un usuario a través de su perfil ni mediante las funcionalidades públicas de la plataforma." },
    ],
  },
  {
    title: "6. Seguridad de los datos",
    blocks: [
      { p: "SWIVV MATCH aplica medidas técnicas y organizativas adecuadas a la naturaleza de los datos tratados." },
      { p: "Estas medidas pueden incluir:" },
      { ul: [
        "Controles de acceso.",
        "Autenticación segura.",
        "Limitación de los permisos de usuarios y administradores.",
        "Cifrado cuando corresponda.",
        "Protección de las transferencias de datos.",
        "Supervisión de accesos no autorizados.",
        "Gestión de incidentes de seguridad.",
        "Normas de conservación y eliminación de la información.",
      ] },
    ],
  },
  {
    title: "7. Por qué SWIVV MATCH da prioridad a la minimización de datos",
    blocks: [
      { p: "La protección de la privacidad es especialmente importante en una plataforma de citas." },
      { p: "Los perfiles, las preferencias, las conversaciones y las interacciones pueden revelar información personal muy íntima." },
      { p: "Determinada información relacionada con la vida sexual o la orientación sexual puede pertenecer a las categorías especiales de datos personales previstas en el artículo 9 del RGPD." },
      { p: "Por este motivo, SWIVV MATCH procura evitar la recopilación de información de identidad que no sea necesaria para prestar el servicio." },
      { p: "Nuestro objetivo es limitar la verificación a lo que resulte útil para garantizar el acceso exclusivo a personas adultas y proteger a nuestra comunidad." },
      { p: "En particular, damos prioridad a:" },
      { ul: [
        "Verificar que una persona es mayor de edad en lugar de recopilar sistemáticamente su identidad completa.",
        "Transmitir un resultado de verificación en lugar de una copia de un documento.",
        "Recurrir a proveedores independientes cuando sea adecuado.",
        "Limitar los plazos de conservación.",
        "Proteger la información.",
        "Actuar con transparencia frente a los usuarios.",
      ] },
    ],
  },
  {
    title: "8. Derechos de los usuarios en relación con sus datos personales",
    blocks: [
      { p: "De conformidad con el RGPD, los usuarios disponen de derechos relativos a sus datos personales, en las condiciones establecidas por la normativa aplicable." },
      { p: "Estos derechos incluyen, en particular:" },
      { p: "**Derecho de acceso:** obtener información sobre los datos personales tratados por SWIVV MATCH." },
      { p: "**Derecho de rectificación:** solicitar la corrección de datos inexactos o incompletos." },
      { p: "**Derecho de supresión:** solicitar la eliminación de determinados datos cuando se cumplan las condiciones legales." },
      { p: "**Derecho a la limitación del tratamiento:** solicitar, en determinadas situaciones, que se limite el tratamiento de los datos." },
      { p: "**Derecho de oposición:** oponerse a determinados tratamientos cuando se cumplan las condiciones legales." },
      { p: "**Derecho a la portabilidad:** recibir determinados datos en un formato estructurado y de uso común, cuando este derecho sea aplicable." },
      { p: "Las solicitudes pueden enviarse a:" },
      { p: "**contact@swivvmatch.com**" },
      { p: "Las solicitudes se examinan dentro de los plazos y de acuerdo con los procedimientos previstos por el RGPD." },
      { p: "Los usuarios también pueden presentar una reclamación ante la autoridad de control competente, en particular ante la CNIL en relación con los tratamientos que entren dentro de su ámbito de competencia." },
      { p: "Sitio web oficial de la CNIL: https://www.cnil.fr/" },
    ],
  },
  {
    title: "9. Conservación y eliminación de los datos",
    blocks: [
      { p: "SWIVV MATCH no pretende conservar la información personal durante más tiempo del necesario para las finalidades para las que se trata." },
      { p: "La información relativa a la edad y a las posibles verificaciones adicionales se conserva durante periodos adecuados a su finalidad." },
      { p: "La información necesaria para gestionar un incidente de seguridad, una denuncia o una obligación legal puede estar sujeta a un periodo de conservación específico cuando esté justificado." },
      { p: "Cuando se elimina una cuenta, los datos se suprimen o se anonimizan de acuerdo con los procedimientos aplicables, sin perjuicio de las obligaciones legales de conservación y de las necesidades legítimas relacionadas con la gestión de litigios o la seguridad." },
      { p: "Los documentos de identidad que eventualmente sean tratados por un proveedor independiente están sujetos a las normas de conservación de dicho proveedor y a la información que deba comunicarse al usuario." },
    ],
  },
  {
    title: "10. Modificaciones de nuestra política de privacidad",
    blocks: [
      { p: "Las tecnologías y normativas relativas a la protección de los datos personales evolucionan rápidamente." },
      { p: "SWIVV MATCH sigue, en particular:" },
      { ul: [
        "Las recomendaciones de la CNIL.",
        "La evolución del Reglamento General de Protección de Datos.",
        "Las directrices de la Comisión Europea.",
        "Las iniciativas europeas relativas a la identidad digital.",
        "Los trabajos relacionados con las pruebas de edad respetuosas con la privacidad.",
        "Las nuevas obligaciones aplicables a las plataformas digitales en los países donde se ofrece el servicio.",
      ] },
      { p: "La plataforma puede modificar sus procedimientos de protección de datos cuando sea necesario para reforzar la seguridad, cumplir una nueva obligación legal o mejorar la protección de los usuarios." },
      { p: "Cualquier modificación importante de esta política se comunicará a los usuarios por los medios adecuados." },
    ],
  },
  {
    title: "11. Contacto y solicitudes relacionadas con los datos personales",
    blocks: [
      { p: "Para cualquier consulta relacionada con:" },
      { ul: [
        "La protección de los datos personales.",
        "El ejercicio de los derechos previstos por el RGPD.",
        "La eliminación de una cuenta o de determinados datos.",
        "Un incidente de seguridad.",
      ] },
      { p: "Puede ponerse en contacto con nuestro equipo:" },
      { p: "**SWIVV MATCH**" },
      { p: "Sitio web: https://swivvmatch.com" },
      { p: "Correo electrónico: contact@swivvmatch.com" },
    ],
  },
  {
    title: "12. Legislación oficial y recursos de referencia",
    blocks: [
      { p: "Los siguientes textos y recursos constituyen referencias importantes para comprender el marco aplicable a la protección de los datos personales." },
      { h: "Francia" },
      { ul: [
        "**Ley francesa de Protección de Datos de 6 de enero de 1978 (Loi Informatique et Libertés)** https://www.legifrance.gouv.fr/",
        "**Comisión Nacional de Informática y Libertades (Commission nationale de l'informatique et des libertés – CNIL)** https://www.cnil.fr/",
      ] },
      { h: "Unión Europea" },
      { ul: [
        "**Reglamento General de Protección de Datos – Reglamento (UE) 2016/679** https://eur-lex.europa.eu/eli/reg/2016/679/oj",
      ] },
    ],
  },
  {
    title: "13. Compromiso de SWIVV MATCH",
    blocks: [
      { p: "La confianza de nuestra comunidad se basa, entre otras cosas, en el respeto de la privacidad." },
      { p: "SWIVV MATCH se compromete a:" },
      { ul: [
        "Proteger la confidencialidad de los datos personales de los usuarios.",
        "Limitar la recopilación a la información necesaria para el funcionamiento del servicio.",
        "No vender los datos personales.",
        "No utilizar los datos relacionados con las citas para publicidad personalizada.",
        "Respetar los derechos previstos por el RGPD.",
        "Proteger la información y limitar los accesos internos.",
        "Eliminar o anonimizar los datos de acuerdo con los plazos de conservación indicados.",
        "Adaptar sus medidas de protección en función de los requisitos legales y de los avances tecnológicos.",
      ] },
      { p: "**SWIVV MATCH – Your Match. Your Story.**" },
      { p: "Tu privacidad importa. Tu seguridad también." },
    ],
  },
];

const SECTIONS_BY_LANG: Record<Lang, Section[]> = {
  fr: SECTIONS,
  en: SECTIONS_EN,
  es: SECTIONS_ES,
};

const HERO: Record<Lang, { title: string; subtitle: string }> = {
  fr: { title: "Confidentialité des données", subtitle: "SWIVV MATCH — Dernière mise à jour : novembre 2026" },
  en: { title: "Data Privacy", subtitle: "SWIVV MATCH — Last updated: November 2026" },
  es: { title: "Privacidad de los datos", subtitle: "SWIVV MATCH — Última actualización: noviembre de 2026" },
};

// ponytail: lock + key composed from two Lucide glyphs — the hero watermark is 6% opacity, so a single lock read as a blob
function LockWithKey({ className, strokeWidth = 1 }: { className?: string; strokeWidth?: number }) {
  return (
    <span className={`inline-block ${className ?? ""}`} aria-hidden="true">
      <Lock className="h-full w-full" strokeWidth={strokeWidth} />
      <KeyRound
        className="absolute left-1/2 top-[64%] h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 -rotate-[60deg]"
        strokeWidth={strokeWidth * 1.2}
      />
    </span>
  );
}

function DataPrivacyPage() {
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
        title={HERO[lang].title}
        subtitle={HERO[lang].subtitle}
        icon={LockWithKey}
        tall
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mt-6 grid gap-3">
          {SECTIONS_BY_LANG[lang].map((s) => (
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
          <Link to="/verification-age" className={LEGAL_PILL}>
            <UserCheck className="h-4 w-4" aria-hidden="true" /> {t("Vérification de l'âge & protection des mineurs")}
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
