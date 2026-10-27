import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  getMyProfile,
  getMyRawProfile,
  getSwivvUser,
  profileCompleteness,
  saveMyProfile,
  SIGNUP_CONFIRM_MSG,
  signUpSwivv,
  trackSave,
} from "@/lib/swivv-auth";
import { type SwivvProfile } from "@/lib/swivv-data";
import { trackEvent } from "@/lib/track";
import { PW_LEVELS, pwScore } from "@/lib/swivv-password";
import { MATCH_CRITERIA_KEY } from "@/lib/swivv-store";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { CguAcceptDialog } from "@/components/cgu-accept-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {   Brain, Dumbbell, Eye, Fingerprint, Footprints, Gem, Heart, Mail, Palette, PersonStanding, Ruler, Scissors, ShieldCheck, Shirt, Smile, Sparkles, UtensilsCrossed, Zap, type LucideIcon } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { readLang, translate, useT } from "@/lib/i18n";

export const Route = createFileRoute("/inscription")({
  head: () =>
    pageHead(
      translate(readLang(), "Créer mon profil gratuit — SWIVV MATCH"),
      translate(
        readLang(),
        "Crée ton profil gratuit sur SWIVV MATCH en 2 minutes. Rencontres sérieuses, mariage ou belle histoire.",
      ),
      "/inscription",
    ),
  component: SignupPage,
});

export const LOOKING = ["Relation sérieuse", "Mariage", "Belle histoire", "Relation amoureuse", "Amitié"];
// ponytail: [m, f] tuple = gendered option, filtered by forGender; signup copy is French-only (no translated lists exist) — translators add their own pairs
export type GF = string | readonly [string, string];
export const forGender = (list: readonly GF[], gender: string): string[] =>
  list.flatMap((o) => (typeof o === "string" ? [o] : gender === "man" ? [o[0]] : gender === "woman" ? [o[1]] : [o[0], o[1]]));
const gf = (m: string, f: string, gender: string): string => (gender === "woman" ? f : m);
export const MARITAL: GF[] = ["Célibataire", ["Séparé", "Séparée"], ["Divorcé", "Divorcée"], ["Veuf", "Veuve"]];
export const DRINK = ["Non", "Occasionnellement", "Oui (vin)", "Oui (fêtes)", "Oui"];
export const SMOKE = ["Non", "Occasionnellement", "Oui"];
export const DRUGS = ["Non", "Occasionnellement", "Oui"];

// ponytail: photos ride as dataURLs in the profile row (no storage bucket yet — migrate there if rows ever approach the 8Mo TOAST ceiling); downscale at the single upload choke point so every page stops re-downloading multi-Mo originals
export function shrinkDataUrl(url: string, maxDim = 1280, q = 0.82): Promise<string> {
  if (!url.startsWith("data:image")) return Promise.resolve(url);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", q));
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

// ponytail: shared file→dataURL reader (signup + mon-profil) — object URLs + upload pipeline if 2.5Mo cap ever lifts
export function eachImageUrl(
  files: FileList | null,
  room: number,
  onUrl: (url: string) => void,
): { skipped: boolean; tooBig: boolean } {
  if (!files) return { skipped: false, tooBig: false };
  const list = Array.from(files);
  const skipped = list.length > room;
  let tooBig = false;
  list.slice(0, Math.max(0, room)).forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2_500_000) {
      tooBig = true;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      void shrinkDataUrl(String(reader.result)).then(onUrl);
    };
    reader.readAsDataURL(file);
  });
  return { skipped, tooBig };
}
export const EAT = ["Équilibrée", "De tout", "Halal", "Végétarienne", "Vegan", "Gastronomique", "Casher"];
export const JOB: GF[] = [
  "CDI",
  "CDI (télétravail)",
  "CDD",
  ["Indépendant", "Indépendante"],
  "Chef d'entreprise",
  ["Étudiant", "Étudiante"],
  ["Étudiant / saisonnier", "Étudiante / saisonnière"],
  "En recherche d'emploi",
  ["Retraité", "Retraitée"],
  "Au foyer",
];
export const INCOME: GF[] = [
  "Moins de 25 k€",
  "25–35 k€",
  "30–45 k€",
  "35–50 k€",
  "40–55 k€",
  "45–60 k€",
  "50–80 k€",
  "55–75 k€",
  "60–90 k€",
  ["Étudiant (jobs d'été)", "Étudiante (jobs d'été)"],
  ["Étudiant (bourse)", "Étudiante (bourse)"],
];
export const LIVING: GF[] = [
  ["Seul", "Seule"],
  ["Seul (appartement)", "Seule (appartement)"],
  ["Seul (maison)", "Seule (maison)"],
  "Colocation",
  "Chez mes parents",
  ["Seul avec enfant(s) (garde partagée)", "Seule avec enfant(s) (garde partagée)"],
  ["Seul sans enfant(s) (enfants chez mon ex)", "Seule sans enfant(s) (enfants chez mon ex)"],
];
export const BODY: GF[] = ["Mince", ["Moyen", "Moyenne"], "Athlétique", ["Sportif", "Sportive"], ["Musclé", "Musclée"], ["Rond", "Ronde"], ["Corpulent", "Corpulente"]];
export const ETHNI: GF[] = [
  ["Européen", "Européenne"],
  ["Maghrébin", "Maghrébine"],
  ["Africain", "Africaine"],
  "Asiatique",
  "Métisse",
  ["Latin", "Latine"],
];
export const HAIR = ["Noirs", "Bruns", "Châtains", "Blonds", "Roux", "Gris", "Blancs", "Poivre et sel", "Colorés", "Chauve"];
export const EYES = ["Marron", "Noisette", "Châtains", "Verts", "Bleus", "Gris", "Noirs"];
export const RELIGION: GF[] = [
  "Sans importance",
  "Catholique",
  ["Chrétien", "Chrétienne"],
  ["Musulman", "Musulmane"],
  "Athée",
  "Agnostique",
  ["Spirituel", "Spirituelle"],
  ["Juif pratiquant", "Juive pratiquante"],
  "Bouddhiste",
  ["Non croyant", "Non croyante"],
];
export const BORN: GF[] = [
  ["Né catholique", "Née catholique"],
  ["Né chrétien", "Née chrétienne"],
  ["Né musulman", "Née musulmane"],
  ["Né sans religion", "Née sans religion"],
  ["Né athée", "Née athée"],
  ["Né agnostique", "Née agnostique"],
  ["Converti", "Convertie"],
];
export const PRACTICE: GF[] = [
  ["Non pratiquant", "Non pratiquante"],
  ["Peu pratiquant", "Peu pratiquante"],
  ["Modéré", "Modérée"],
  ["Pratiquant", "Pratiquante"],
  ["Très pratiquant", "Très pratiquante"],
  ["Croyant non pratiquant", "Croyante non pratiquante"],
];
export const PARENTS = ["Mariés", "Divorcés", "Séparés", "Veuf / Veuve", "Remariés", "Décédés"];
export const FAMILY_VALUES = ["Très proche de ma famille", "Proche de ma famille", "Pas trop proche de ma famille", "Famille unie", "Famille nombreuse", "Petite famille", "Traditionnelle", "Moderne", "Autonome"];
export const YESNO = ["Oui", "Non"];
export const YESNOMAYBE = ["Oui", "Non", "Peut-être"];
export const RELOCATE = ["Oui", "Non", "Peut-être"] as const;
// ponytail: feminine-only static list (no Intl/JS API for nationalities) — regenerate from CLDR if it drifts; masculine forms need a CLDR-sourced list, until then NATS stays unfiltered by gender
export const NATS = [
  "Afghane",
  "Sud-Africaine",
  "Albanaise",
  "Algérienne",
  "Allemande",
  "Andorrane",
  "Angolaise",
  "Saoudienne",
  "Argentine",
  "Arménienne",
  "Australienne",
  "Autrichienne",
  "Azérie",
  "Bahamienne",
  "Bahreïnienne",
  "Bangladaise",
  "Barbadienne",
  "Belge",
  "Bélizienne",
  "Béninoise",
  "Bhoutanaise",
  "Biélorusse",
  "Birmane",
  "Bolivienne",
  "Bosniaque",
  "Bosnienne",
  "Botswanaise",
  "Brésilienne",
  "Brunéienne",
  "Bulgare",
  "Burkinabè",
  "Burundaise",
  "Cambodgienne",
  "Camerounaise",
  "Canadienne",
  "Capverdienne",
  "Centrafricaine",
  "Chilienne",
  "Chinoise",
  "Chypriote",
  "Colombienne",
  "Comorienne",
  "Congolaise",
  "Nord-Coréenne",
  "Sud-Coréenne",
  "Costaricienne",
  "Ivoirienne",
  "Croate",
  "Cubaine",
  "Danoise",
  "Djiboutienne",
  "Dominiquaise",
  "Égyptienne",
  "Émirienne",
  "Équatorienne",
  "Érythréenne",
  "Espagnole",
  "Estonienne",
  "Américaine",
  "Éthiopienne",
  "Fidjienne",
  "Finlandaise",
  "Française",
  "Gabonaise",
  "Gambienne",
  "Géorgienne",
  "Ghanéenne",
  "Grecque",
  "Grenadienne",
  "Guatémaltèque",
  "Guinéenne",
  "Équatoguinéenne",
  "Bissaoguinéenne",
  "Guyanaise",
  "Haïtienne",
  "Hondurienne",
  "Hongroise",
  "Indienne",
  "Indonésienne",
  "Irakienne",
  "Iranienne",
  "Irlandaise",
  "Islandaise",
  "Israélienne",
  "Italienne",
  "Jamaïcaine",
  "Japonaise",
  "Jordanienne",
  "Kazakhe",
  "Kényane",
  "Kirghize",
  "Kosovare",
  "Koweïtienne",
  "Laotienne",
  "Lettone",
  "Libanaise",
  "Libérienne",
  "Libyenne",
  "Liechtensteinoise",
  "Lituanienne",
  "Luxembourgeoise",
  "Macédonienne",
  "Malgache",
  "Malaisienne",
  "Malawienne",
  "Maldivienne",
  "Malienne",
  "Maltaise",
  "Marocaine",
  "Mauricienne",
  "Mauritanienne",
  "Mexicaine",
  "Micronésienne",
  "Moldave",
  "Monégasque",
  "Mongole",
  "Monténégrine",
  "Mozambicaine",
  "Namibienne",
  "Népalaise",
  "Nicaraguayenne",
  "Nigérienne",
  "Nigériane",
  "Norvégienne",
  "Néo-Zélandaise",
  "Omanaise",
  "Ougandaise",
  "Ouzbèke",
  "Pakistanaise",
  "Palestinienne",
  "Panaméenne",
  "Paraguayenne",
  "Néerlandaise",
  "Péruvienne",
  "Philippine",
  "Polonaise",
  "Portugaise",
  "Qatarienne",
  "Dominicaine",
  "Tchèque",
  "Roumaine",
  "Britannique",
  "Russe",
  "Rwandaise",
  "Lucienne",
  "Saint-Marinaise",
  "Salvadorienne",
  "Samoane",
  "Santoméenne",
  "Sénégalaise",
  "Serbe",
  "Seychelloise",
  "Sierra-Léonaise",
  "Singapourienne",
  "Slovaque",
  "Slovène",
  "Somalienne",
  "Soudanaise",
  "Sud-Soudanaise",
  "Sri-lankaise",
  "Suédoise",
  "Suisse",
  "Surinamaise",
  "Syrienne",
  "Tadjike",
  "Tanzanienne",
  "Taïwanaise",
  "Tchadienne",
  "Thaïlandaise",
  "Est-timoraise",
  "Togolaise",
  "Tongienne",
  "Trinidadienne",
  "Tunisienne",
  "Turkmène",
  "Turque",
  "Ukrainienne",
  "Uruguayenne",
  "Vanuataise",
  "Vaticane",
  "Vénézuélienne",
  "Vietnamienne",
  "Yéménite",
  "Zambienne",
  "Zimbabwéenne",
];
export const FIRSTLANGS = ["Français", "Anglais", "Arabe", "Espagnol", "Italien", "Portugais", "Allemand", "Néerlandais", "Turc", "Kabyle", "Russe", "Polonais", "Roumain", "Ukrainien", "Grec", "Suédois", "Norvégien", "Danois", "Finnois", "Hongrois", "Tchèque", "Bulgare", "Croate", "Serbe", "Albanais", "Arménien", "Persan", "Hébreu", "Hindi", "Ourdou", "Bengali", "Mandarin", "Japonais", "Coréen", "Vietnamien", "Thaï", "Indonésien", "Wolof", "Bambara", "Lingala", "Swahili", "Somali", "Catalan", "Basque", "Breton", "Corse", "Créole"];
// ponytail: short hobby ladder, free-text covers the rest — extend if matching filters by interest
export const INTERESTS = ["Voyages", "Cuisine", "Restaurants", "Sport", "Football", "Fitness", "Musculation", "Randonnée", "Natation", "Course à pied", "Cyclisme", "Lecture", "Cinéma", "Musique", "Danse", "Photographie", "Jeux vidéo", "Mode", "Jardinage", "Bricolage", "Pêche", "Camping", "Plage", "Sorties", "Théâtre", "Art", "Bénévolat", "Animaux", "Moto"];
// ponytail: one CSV string in bestFeature (same storage/display/moderation path as before) — per-atout rows if matching ever filters by atout
export const ATOUT_MAX = 5;
export type AtoutCat = { name: string; icon: LucideIcon; bg: string; items: string[] };
export const ATOUTS: AtoutCat[] = [
  { name: "Personnalité", icon: Smile, bg: "bg-pink-100 text-pink-600", items: ["Mon sens de l'humour", "Ma gentillesse", "Ma sincérité", "Mon honnêteté", "Ma loyauté", "Ma générosité", "Mon optimisme", "Ma joie de vivre", "Ma spontanéité", "Mon authenticité", "Ma douceur", "Ma patience", "Mon empathie", "Mon ouverture d'esprit", "Mon calme", "Mon esprit positif"] },
  { name: "Qualités relationnelles", icon: Heart, bg: "bg-rose-100 text-rose-600", items: ["Mon romantisme", "Mon écoute", "Mon attention aux autres", "Ma tendresse", "Mon affection", "Ma fidélité", "Ma capacité à communiquer", "Mon respect des autres", "Ma bienveillance", "Ma capacité à rassurer", "Mon côté attentionné", "Ma capacité à faire des compromis", "Mon envie de construire une relation durable", "Ma capacité à exprimer mes sentiments"] },
  { name: "Intelligence et talents", icon: Brain, bg: "bg-violet-100 text-violet-600", items: ["Mon intelligence", "Ma curiosité", "Ma créativité", "Mon esprit d'analyse", "Ma culture générale", "Mon sens de la répartie", "Mon imagination", "Ma capacité à résoudre les problèmes", "Mon talent pour apprendre rapidement", "Mon sens de l'organisation", "Mon esprit d'initiative", "Ma débrouillardise"] },
  { name: "Style de vie et énergie", icon: Zap, bg: "bg-amber-100 text-amber-600", items: ["Mon dynamisme", "Mon énergie", "Mon goût pour l'aventure", "Mon esprit sportif", "Mon côté épicurien", "Mon goût pour les voyages", "Mon amour de la nature", "Mon goût pour la découverte", "Mon indépendance", "Mon ambition", "Ma détermination", "Ma discipline", "Mon côté sociable", "Mon côté casanier", "Mon goût pour les sorties", "Mon esprit festif"] },
  { name: "Valeurs et caractère", icon: ShieldCheck, bg: "bg-emerald-100 text-emerald-600", items: ["Ma confiance en moi", "Mon courage", "Ma résilience", "Ma maturité", "Mon sens des responsabilités", "Ma fiabilité", "Mon humilité", "Mon sens de la justice", "Mon intégrité", "Ma persévérance", "Ma stabilité", "Mon esprit protecteur", "Mon sens de la famille", "Ma capacité à rebondir face aux difficultés"] },
  { name: "Charme et séduction", icon: Sparkles, bg: "bg-fuchsia-100 text-fuchsia-600", items: ["Mon sourire", "Mon regard", "Mon charme naturel", "Mon élégance", "Mon style vestimentaire", "Ma voix", "Mon charisme", "Mon allure", "Mon côté mystérieux", "Mon humour séduisant", "Mon naturel", "Mon côté irrésistible"] },
  { name: "Vie quotidienne et passions", icon: UtensilsCrossed, bg: "bg-orange-100 text-orange-600", items: ["Mes talents culinaires", "Mon talent pour faire rire", "Mon côté bricoleur", "Mon sens de l'accueil", "Mon talent artistique", "Mon amour des animaux", "Mon goût pour la musique", "Mon talent pour la danse", "Mon côté aventurier", "Mon talent pour organiser des surprises", "Mon esprit pratique", "Mon plaisir à prendre soin des autres"] },
  { name: "Visage et sourire", icon: Eye, bg: "bg-sky-100 text-sky-600", items: ["Mon sourire", "Mes yeux", "Mon regard", "Mes beaux cils", "Mes sourcils", "Mes lèvres", "Mes fossettes", "Mes traits du visage", "Mon teint", "Mon charme naturel"] },
  { name: "Cheveux et pilosité", icon: Scissors, bg: "bg-teal-100 text-teal-600", items: ["Mes cheveux", "Ma coiffure", "Mes cheveux bouclés", "Mes cheveux longs", "Mes cheveux courts", "Ma barbe", "Ma moustache", "Mon crâne rasé", "Ma chevelure poivre et sel"] },
  { name: "Silhouette et allure", icon: PersonStanding, bg: "bg-indigo-100 text-indigo-600", items: ["Ma silhouette", "Ma taille", "Ma carrure", "Mes épaules", "Mes jambes", "Ma taille fine", "Mes courbes", "Ma musculature", "Mon allure sportive", "Ma posture", "Ma démarche", "Mon élégance naturelle"] },
  { name: "Style et présentation", icon: Shirt, bg: "bg-cyan-100 text-cyan-600", items: ["Mon style vestimentaire", "Mon élégance", "Mon look décontracté", "Mon look chic", "Mon style original", "Mon sens de la mode", "Mon apparence soignée", "Mon parfum", "Mes tatouages", "Mes piercings", "Mes accessoires", "Mon charme naturel"] },
  { name: "Traits distinctifs", icon: Fingerprint, bg: "bg-lime-100 text-lime-600", items: ["Ma voix", "Mon rire", "Mes mains", "Mon sourire communicatif", "Mes grains de beauté", "Mes taches de rousseur", "Mes cheveux gris ou argentés", "Mon regard expressif", "Mon côté séduisant", "Mon charisme physique"] },
  { name: "Poitrine et décolleté", icon: Gem, bg: "bg-red-100 text-red-600", items: ["Ma poitrine", "Mes seins", "Mon décolleté", "Mon buste", "Mes pectoraux"] },
  { name: "Jambes et cuisses", icon: Footprints, bg: "bg-blue-100 text-blue-600", items: ["Mes jambes", "Mes longues jambes", "Mes cuisses", "Mes mollets", "Mes genoux", "Mes jambes musclées", "Mes jambes galbées"] },
  { name: "Fesses et hanches", icon: Palette, bg: "bg-purple-100 text-purple-600", items: ["Mes fesses", "Mon postérieur", "Mes hanches", "Mes courbes", "Ma silhouette galbée", "Mon bassin"] },
  { name: "Ventre et taille", icon: Ruler, bg: "bg-yellow-100 text-yellow-600", items: ["Mon ventre plat", "Mes abdominaux", "Ma taille fine", "Mon ventre arrondi", "Ma taille marquée"] },
  { name: "Bras et autres atouts", icon: Dumbbell, bg: "bg-stone-200 text-stone-600", items: ["Mes bras", "Mes biceps", "Mes épaules", "Mon dos", "Ma peau", "Ma silhouette athlétique", "Mes formes généreuses", "Ma musculature"] },
];
// ponytail: static French country list — regenerate from CLDR if it drifts
// ponytail: signup copy (questions, chrome, short option sets) is translated through lib/i18n —
// the long reference lists below (countries, jobs, income, religions, origins, languages, interests,
// atouts) stay French until someone needs them: add the strings to locales/{en,es}.ts and they render
// translated with no code change (Sel/Seg run every option through t()).
export const PAYS = ["Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Andorre", "Angola", "Antigua-et-Barbuda", "Arabie saoudite", "Argentine", "Arménie", "Australie", "Autriche", "Azerbaïdjan", "Bahamas", "Bahreïn", "Bangladesh", "Barbade", "Belgique", "Belize", "Bénin", "Bhoutan", "Biélorussie", "Birmanie", "Bolivie", "Bosnie-Herzégovine", "Botswana", "Brésil", "Brunei", "Bulgarie", "Burkina Faso", "Burundi", "Cambodge", "Cameroun", "Canada", "Cap-Vert", "Chili", "Chine", "Chypre", "Colombie", "Comores", "Congo", "Corée du Nord", "Corée du Sud", "Costa Rica", "Côte d'Ivoire", "Croatie", "Cuba", "Danemark", "Djibouti", "Dominique", "Égypte", "Émirats arabes unis", "Équateur", "Érythrée", "Espagne", "Eswatini", "Estonie", "États-Unis", "Éthiopie", "Fidji", "Finlande", "France", "Gabon", "Gambie", "Géorgie", "Ghana", "Grèce", "Grenade", "Guatemala", "Guinée", "Guinée équatoriale", "Guinée-Bissau", "Guyana", "Haïti", "Honduras", "Hongrie", "Inde", "Indonésie", "Irak", "Iran", "Irlande", "Islande", "Israël", "Italie", "Jamaïque", "Japon", "Jordanie", "Kazakhstan", "Kenya", "Kirghizistan", "Kiribati", "Kosovo", "Koweït", "Laos", "Lesotho", "Lettonie", "Liban", "Liberia", "Libye", "Liechtenstein", "Lituanie", "Luxembourg", "Macédoine du Nord", "Madagascar", "Malaisie", "Malawi", "Maldives", "Mali", "Malte", "Maroc", "Maurice", "Mauritanie", "Mexique", "Micronésie", "Moldavie", "Monaco", "Mongolie", "Monténégro", "Mozambique", "Myanmar", "Namibie", "Nauru", "Népal", "Nicaragua", "Niger", "Nigeria", "Norvège", "Nouvelle-Zélande", "Oman", "Ouganda", "Ouzbékistan", "Pakistan", "Palaos", "Palestine", "Panama", "Papouasie-Nouvelle-Guinée", "Paraguay", "Pays-Bas", "Pérou", "Philippines", "Pologne", "Portugal", "Qatar", "République centrafricaine", "République démocratique du Congo", "République dominicaine", "République tchèque", "Roumanie", "Royaume-Uni", "Russie", "Rwanda", "Saint-Christophe-et-Niévès", "Sainte-Lucie", "Saint-Marin", "Saint-Vincent-et-les-Grenadines", "Salomon", "Salvador", "Samoa", "Sao Tomé-et-Principe", "Sénégal", "Serbie", "Seychelles", "Sierra Leone", "Singapour", "Slovaquie", "Slovénie", "Somalie", "Soudan", "Soudan du Sud", "Sri Lanka", "Suède", "Suisse", "Suriname", "Syrie", "Tadjikistan", "Taïwan", "Tanzanie", "Tchad", "Thaïlande", "Timor oriental", "Togo", "Tonga", "Trinité-et-Tobago", "Tunisie", "Turkménistan", "Turquie", "Tuvalu", "Ukraine", "Uruguay", "Vanuatu", "Vatican", "Venezuela", "Viêt Nam", "Yémen", "Zambie", "Zimbabwe"];
// ponytail: flat list ported from swoov regions (single source for dating side) —
// department-level granularity if users ask for it
export const FRANCE_CITIES = ["Lyon", "Grenoble", "Saint-Étienne", "Clermont-Ferrand", "Annecy", "Chambéry", "Valence", "Vienne", "Dijon", "Besançon", "Belfort", "Chalon-sur-Saône", "Auxerre", "Nevers", "Mâcon", "Rennes", "Brest", "Quimper", "Vannes", "Lorient", "Saint-Malo", "Saint-Brieuc", "Orléans", "Tours", "Bourges", "Chartres", "Blois", "Châteauroux", "Dreux", "Ajaccio", "Bastia", "Porto-Vecchio", "Corte", "Calvi", "Bonifacio", "Strasbourg", "Reims", "Metz", "Nancy", "Troyes", "Mulhouse", "Colmar", "Charleville-Mézières", "Lille", "Amiens", "Calais", "Dunkerque", "Roubaix", "Tourcoing", "Beauvais", "Arras", "Paris", "Versailles", "Boulogne-Billancourt", "Saint-Denis", "Argenteuil", "Montreuil", "Nanterre", "Créteil", "Rouen", "Caen", "Le Havre", "Cherbourg", "Évreux", "Dieppe", "Alençon", "Bordeaux", "Limoges", "Poitiers", "La Rochelle", "Pau", "Bayonne", "Angoulême", "Niort", "Toulouse", "Montpellier", "Nîmes", "Perpignan", "Béziers", "Montauban", "Albi", "Carcassonne", "Nantes", "Angers", "Le Mans", "La Roche-sur-Yon", "Saint-Nazaire", "Laval", "Cholet", "Marseille", "Nice", "Toulon", "Avignon", "Aix-en-Provence", "Cannes", "Antibes", "Arles"];
// ponytail: static diploma ladder, extend if matching filters by field of study
export const EDUC = ["Sans diplôme", "Brevet", "CAP / BEP", "Baccalauréat", "Bac +2", "Licence (Bac +3)", "Master (Bac +5)", "Doctorat (Bac +8)", "Grande école"];
// ponytail: short style ladder, free-text atout kept alongside — merge if matching filters by style
export const STYLE: GF[] = [["Décontracté", "Décontractée"], ["Élégant", "Élégante"], "Classique", "Chic", ["Sportif", "Sportive"], "Bohème", "Streetwear", "Vintage", "Modeste", "Glamour"];
// ponytail: curated shortlist, extend from PCS/ISCO if matching needs it
export const METIERS: GF[] = [
  ["Infirmier", "Infirmière"],
  "Médecin",
  ["Pharmacien", "Pharmacienne"],
  ["Aide-soignant", "Aide-soignante"],
  ["Développeur", "Développeuse"],
  ["Ingénieur", "Ingénieure"],
  "Graphiste",
  ["Technicien", "Technicienne"],
  ["Électricien", "Électricienne"],
  ["Plombier", "Plombière"],
  ["Menuisier", "Menuisière"],
  ["Commercial", "Commerciale"],
  ["Vendeur", "Vendeuse"],
  "Comptable",
  ["Cuisinier", "Cuisinière"],
  ["Serveur", "Serveuse"],
  ["Boulanger", "Boulangère"],
  ["Professeur", "Professeure"],
  ["Éducateur", "Éducatrice"],
  ["Coach sportif", "Coach sportive"],
  ["Policier", "Policière"],
  ["Pompier", "Pompière"],
  "Militaire",
  ["Coiffeur", "Coiffeuse"],
  "Photographe",
  ["Livreur", "Livreuse"],
  ["Chauffeur", "Chauffeuse"],
  "Secrétaire",
  ["Consultant", "Consultante"],
  ["Entrepreneur", "Entrepreneuse"],
  "Artiste",
  ["Avocat", "Avocate"],
  "Agent d'entretien",
  ["Étudiant", "Étudiante"],
  "Sans emploi",
];

const STEPS = ["Compte", "L'essentiel", "Apparence", "Style de vie", "Famille", "Origines & photos"];

// ponytail: local draft (password never persisted) + server stash for first-login push — server-side draft if resume ever needs cross-device
const DRAFT_KEY = "swivv-signup-draft";
type SignupDraft = { f?: Record<string, string>; photos?: string[]; customPhotos?: string[]; step?: number; phase?: "pre" | "post"; qi?: number };

const inputCls =
  "w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e60050]";

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <span className="mb-1 block text-sm font-medium text-[#333]">
      {children}{" "}
      {optional ? (
        <span className="font-normal text-[#999]">(optionnel)</span>
      ) : (
        <span className="text-[#e60050]">*</span>
      )}
    </span>
  );
}

function Sel({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
}) {
  const t = useT();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">{t(placeholder)}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {t(o)}
        </option>
      ))}
    </select>
  );
}

export function Seg({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  const t = useT();
  return (
    <div className="grid grid-cols-3 gap-1 rounded-md bg-[#f2f2f2] p-1" role="radiogroup">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`rounded px-2 py-2 text-sm font-medium ${
            value === o ? "bg-white text-[#e60050] shadow-sm" : "text-[#777]"
          }`}
        >
          {t(o)}
        </button>
      ))}
    </div>
  );
}

const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
// ponytail: integer-cm/kg canonical, display units convert on the fly — decimal-canonical if matching needs precision
export const cmToFtIn = (cm: number): [string, string] => {
  let ft = Math.floor(cm / 2.54 / 12);
  let inch = Math.round(cm / 2.54 - ft * 12);
  if (inch === 12) { ft += 1; inch = 0; }
  return [String(ft), String(inch)];
};
export const ftInToCm = (ft: string, inch: string): string =>
  ft.trim() === "" && inch.trim() === "" ? "" : String(Math.round(((parseInt(ft, 10) || 0) * 12 + (parseInt(inch, 10) || 0)) * 2.54));
export const kgToSt = (kg: number): string => String(Math.round((kg / 6.35029) * 10) / 10);
export const stToKg = (st: string): string => {
  const n = parseFloat(st.replace(",", "."));
  return st.trim() === "" || !Number.isFinite(n) ? "" : String(Math.round(n * 6.35029));
};
const num = (s: string) => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : NaN;
};
function ageFromBirthdate(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NaN;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function SignupPage() {
  const nav = useNavigate();
  const t = useT();
  const { user: authUser, loading: authLoading } = useAuth();
  const [doneProfile, setDoneProfile] = useState<SwivvProfile | null | undefined>(undefined);
  // ponytail: leave-save reads the latest form via ref (unmount/pagehide closures are stale) — merge-save makes partial answers safe
  const buildRef = useRef(buildProfile);
  buildRef.current = buildProfile;
  useEffect(() => {
    const save = () => {
      trackSave(saveMyProfile(buildRef.current()));
    };
    window.addEventListener("pagehide", save);
    return () => {
      window.removeEventListener("pagehide", save);
      save();
    };
  }, []);
  const [emailLocked, setEmailLocked] = useState(false);
  const [step, setStep] = useState(0);
  // ponytail: signup question-flow position (edit mode keeps step above) — persisted in the draft alongside
  const [phase, setPhase] = useState<"pre" | "post">("pre");
  const [qi, setQi] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [showNat2, setShowNat2] = useState(false);
  const [f, setF] = useState<Record<string, string>>({
    name: "",
    email: "",
    password: "",
    confirm: "",
    nat1: "",
    nat2: "",
    gender: "",
    seeking: "",
    ageMin: "18",
    ageMax: "99",
    birthdate: "",
    city: "",
    country: "France",
    lookingFor: "",
    maritalStatus: "",
    tagline: "",
    bio: "",
    heightCm: "",
    weightKg: "",
    heightUnit: "cm",
    weightUnit: "kg",
    hairColor: "",
    eyeColor: "",
    bodyStyle: "",
    ethnicity: "",
    selfAppearance: "",
    bestFeature: "",
    occupation: "",
    education: "",
    drink: "",
    smoke: "",
    drugs: "",
    eatingHabits: "",
    employmentStatus: "",
    annualIncome: "",
    livingSituation: "",
    relocate: "",
    hasPets: "",
    petsDetails: "",
    wantsMorePets: "",
    haveChildren: "",
    wantMoreChildren: "",
    brothers: "",
    sisters: "",
    birthRank: "",
    parentsMaritalStatus: "",
    firstLanguage: "",
    otherLanguages: "",
    bornOrConverted: "",
    religion: "",
    religiousValues: "",
    familyValues: "",
    interests: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [customPhotos, setCustomPhotos] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [customAtout, setCustomAtout] = useState("");
  const [cguOpen, setCguOpen] = useState(false);
  const [consent, setConsent] = useState({ age: false, sensitive: false });
  // ponytail: acceptance is per-signup (never restored) — editing an existing profile skips it, set in the profile-load effect
  const [cguAccepted, setCguAccepted] = useState(false);
  const upd = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const req = (v: string) => v.trim().length > 0;
  // ponytail: shared field blocks (signup question flow + edit steps render the same JSX) — split into a fields file if a third consumer appears
  const genderOnly = () => (
    <div>
      <Label>{t("Tu es")}</Label>
      <div className="grid grid-cols-2 gap-1 rounded-md bg-[#f2f2f2] p-1" role="radiogroup" aria-label="Genre">
        {(
          [
            ["woman", "Une femme"],
            ["man", "Un homme"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={f.gender === v}
            onClick={() => {
              upd("gender", v);
              // ponytail: per-browser stash so home defaults work even if the profile row never saves (RLS/offline); server profile wins when present
              try {
                localStorage.setItem("swivv-signup-gender", v);
              } catch {}
            }}
            className={`rounded px-3 py-2 text-sm font-medium ${f.gender === v ? "bg-white text-[#e60050] shadow-sm" : "text-[#777]"}`}
          >
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  );
  const seekingOnly = () => (
    <div>
      <Label>{t("Tu veux rencontrer")}</Label>
      <div className="grid grid-cols-2 gap-1 rounded-md bg-[#f2f2f2] p-1" role="radiogroup" aria-label="Genre recherché">
        {(
          [
            ["woman", "Une femme"],
            ["man", "Un homme"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={f.seeking === v}
            onClick={() => upd("seeking", v)}
            className={`rounded px-3 py-2 text-sm font-medium ${f.seeking === v ? "bg-white text-[#e60050] shadow-sm" : "text-[#777]"}`}
          >
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  );
  const genderFields = () => (
    <>
      {genderOnly()}
      {f.gender !== "" && seekingOnly()}
    </>
  );
  const passwordFields = () => {
    if (hasAccount || editing) return null;
    const level = pwScore(f.password);
    const match = f.password !== "" && f.password === f.confirm;
    const mismatch = f.password !== "" && f.confirm !== "" && f.password !== f.confirm;
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("Ton mot de passe (8 caractères min)")}</Label>
          <input type="password" value={f.password} onChange={(e) => upd("password", e.target.value)} placeholder="••••••••" autoComplete="new-password" className={inputCls} />
          <div className="mt-1.5 min-h-[2.5rem]" aria-live="polite">
            <div className="flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={Math.max(level, 0)} aria-label="Force du mot de passe">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: level < 0 || i > level ? "#E5E7EB" : PW_LEVELS[level].color }} />
              ))}
            </div>
            {level >= 0 && (
              <p className="mt-1 text-xs font-medium" style={{ color: PW_LEVELS[level].color }}>
                {PW_LEVELS[level].label}
              </p>
            )}
          </div>
        </div>
        <div>
          <Label>{t("Confirme ton mot de passe")}</Label>
          <input type="password" value={f.confirm} onChange={(e) => upd("confirm", e.target.value)} placeholder="••••••••" autoComplete="new-password" className={inputCls} />
          <div className="mt-1.5 min-h-[1.25rem]" aria-live="polite">
            {match ? (
              <p role="status" className="flex items-center gap-1 text-sm font-medium" style={{ color: "#16A34A" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t("Les mots de passe correspondent.")}
              </p>
            ) : mismatch ? (
              <p className="text-sm" style={{ color: "#DC2626" }}>
                {t("Les mots de passe ne correspondent pas.")}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  };
  const natFields = () => (
    <div>
      <Label>{t("Ta nationalité")}</Label>
      <input value={f.nat1} onChange={(e) => upd("nat1", e.target.value)} placeholder="Française" autoComplete="off" maxLength={40} list="swivv-nats" className={inputCls} />
      {!showNat2 && !f.nat2 ? (
        <button type="button" onClick={() => setShowNat2(true)} className="mt-1.5 text-sm font-medium text-[#e60050] hover:underline">
          {t("+ Ajouter une seconde nationalité")}
        </button>
      ) : (
        <div className="mt-2">
          <Label optional>{t("Seconde nationalité")}</Label>
          <input value={f.nat2} onChange={(e) => upd("nat2", e.target.value)} placeholder="Marocaine" autoComplete="off" maxLength={40} list="swivv-nats" className={inputCls} />
        </div>
      )}
      <datalist id="swivv-nats">
        {NATS.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
    </div>
  );
  const heightFields = () => (
    <div>
      <div className="flex gap-2">
        {f.heightUnit === "cm" ? (
          <input value={f.heightCm} onChange={(e) => upd("heightCm", e.target.value)} placeholder="175" inputMode="numeric" aria-label="Taille en centimètres" className={inputCls} />
        ) : (
          <>
            <input value={heightFtIn[0]} onChange={(e) => upd("heightCm", ftInToCm(e.target.value, heightFtIn[1]))} placeholder="5" inputMode="numeric" aria-label="Pieds" className={inputCls} />
            <input value={heightFtIn[1]} onChange={(e) => upd("heightCm", ftInToCm(heightFtIn[0], e.target.value))} placeholder="11" inputMode="numeric" aria-label="Pouces" className={inputCls} />
          </>
        )}
        <div className="w-28 shrink-0">
          <Seg value={f.heightUnit} onChange={(v) => upd("heightUnit", v)} options={["cm", "ft"]} />
        </div>
      </div>
      {heightHint && <p className="mt-1 text-xs text-[#999]">({heightHint})</p>}
    </div>
  );
  const weightFields = () => (
    <div>
      <div className="flex gap-2">
        <input
          value={f.weightUnit === "kg" ? f.weightKg : weightSt}
          onChange={(e) => upd("weightKg", f.weightUnit === "kg" ? e.target.value : stToKg(e.target.value))}
          placeholder={f.weightUnit === "kg" ? "70" : "11"}
          inputMode="decimal"
          aria-label={f.weightUnit === "kg" ? "Poids en kilos" : "Poids en stones"}
          className={inputCls}
        />
        <div className="w-28 shrink-0">
          <Seg value={f.weightUnit} onChange={(v) => upd("weightUnit", v)} options={["kg", "st"]} />
        </div>
      </div>
      {weightHint && <p className="mt-1 text-xs text-[#999]">({weightHint})</p>}
    </div>
  );
  const langsBlock = () => (
    <div>
      <Label optional>{t("Tes autres langues")}</Label>
      {/* ponytail: native details dropdown, no outside-click close or search — custom popover if needed */}
      <details className="relative rounded-md border border-border bg-white">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-[15px] text-[#333] [&::-webkit-details-marker]:hidden">
          {csv(f.otherLanguages).length === 0 ? "Choisir…" : csv(f.otherLanguages).join(", ")}
        </summary>
        <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-white p-1 shadow-lg">
          {FIRSTLANGS.filter((l) => l !== f.firstLanguage.trim()).map((l) => (
            <label key={l} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-[#333] hover:bg-[#f2f2f2]">
              <input type="checkbox" checked={csv(f.otherLanguages).includes(l)} onChange={() => toggleLang(l)} className="h-4 w-4 accent-[#e60050]" />
              {l}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
  const interestsBlock = () => (
    <div>
      <Label>{t("Tes centres d\'intérêt")}</Label>
      <details className="relative rounded-md border border-border bg-white">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-[15px] text-[#333] [&::-webkit-details-marker]:hidden">
          {csv(f.interests).length === 0 ? "Choisir…" : csv(f.interests).join(", ")}
        </summary>
        <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-white p-1 shadow-lg">
          {INTERESTS.map((l) => (
            <label key={l} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-[#333] hover:bg-[#f2f2f2]">
              <input type="checkbox" checked={csv(f.interests).includes(l)} onChange={() => toggleInterest(l)} className="h-4 w-4 accent-[#e60050]" />
              {l}
            </label>
          ))}
        </div>
      </details>
      <div className="mt-2 flex gap-2">
        <input value={customInterest} onChange={(e) => setCustomInterest(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomInterest(); } }} placeholder={t("Ajouter ton propre loisir…")} maxLength={30} className={inputCls} />
        <button type="button" onClick={addCustomInterest} className="shrink-0 rounded-md border border-[#e60050] px-4 font-medium text-[#e60050]">
          +
        </button>
      </div>
    </div>
  );
  const photosBlock = () => (
    <div>
      <Label>{t("Tes photos (1 à 5, 2,5 Mo max)")}</Label>
      {/* ponytail: union rendered inline (photos = saved, customPhotos = this-session uploads) — extract if a third source appears */}
      {[...photos, ...customPhotos.filter((c) => !photos.includes(c))].length === 0 ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">⚠️ Sans photo, ton profil reste invisible — ajoute-en une pour apparaître.</p>
      ) : (
        <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto rounded-md border border-border p-2 sm:grid-cols-6">
          {[...photos, ...customPhotos.filter((c) => !photos.includes(c))].map((src) => {
            const selected = photos.includes(src);
            return (
              <div key={src} className="relative">
                <button
                  type="button"
                  onClick={() => togglePhoto(src)}
                  aria-pressed={selected}
                  aria-label={selected ? "Retirer cette photo" : "Choisir cette photo"}
                  className={`relative block w-full overflow-hidden rounded-md ${selected ? "ring-2 ring-[#e60050]" : "opacity-80"}`}
                >
                  <img src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  {selected && (
                    <span className="absolute right-1 top-1 rounded-full bg-[#e60050] px-1.5 text-xs font-medium text-white">
                      {photos.indexOf(src) + 1}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removePhoto(src)}
                  aria-label="Supprimer cette photo"
                  className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 text-xs font-medium text-white hover:bg-black/80"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
      <label className="mt-2 inline-block cursor-pointer rounded-md border border-[#e60050] px-4 py-2 text-sm font-medium text-[#e60050] hover:bg-[#e60050]/5">
        {t("+ Ajouter mes photos")}
        <input type="file" accept="image/*" multiple hidden onChange={(e) => { addUploads(e.target.files); e.target.value = ""; }} />
      </label>
      <p className="mt-1 text-xs text-[#999]">{photos.length}/5 photo(s) — encore {5 - photos.length} possible(s).</p>
    </div>
  );
  const consentFields = () => (
    <>
      <div className="rounded-md border border-border p-3 text-sm">
        <p className="text-[#333]">
          {cguAccepted ? t("✓ CGU détaillées acceptées.") : t("Lis et accepte les CGU détaillées pour continuer.")}{" "}
          <button type="button" onClick={() => setCguOpen(true)} className="font-medium text-[#e60050] hover:underline">
            {cguAccepted ? t("Relire") : t("Ouvrir les CGU détaillées")}
          </button>
        </p>
      </div>
      {/* ponytail: native checkboxes, no form lib — server-stamped consent if legal proof needs it */}
      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-3 text-sm text-[#333]">
        <input
          type="checkbox"
          checked={consent.age}
          onChange={(e) => setConsent({ ...consent, age: e.target.checked })}
          className="mt-1 accent-[#e60050]"
        />
        <span>
          {t("Je certifie avoir 18 ans ou plus et accepter les")}{" "}
          <Link to="/legal/terms" onClick={(e) => e.stopPropagation()} className="font-medium text-[#e60050] hover:underline">CGU détaillées</Link>,{" "}
          les <Link to="/cgv" onClick={(e) => e.stopPropagation()} className="font-medium text-[#e60050] hover:underline">Conditions Générales de Vente (CGV)</Link>{" "}
          et l&apos;utilisation des <Link to="/cookies" onClick={(e) => e.stopPropagation()} className="font-medium text-[#e60050] hover:underline">cookies</Link>.
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-3 text-sm text-[#333]">
        <input
          type="checkbox"
          checked={consent.sensitive}
          onChange={(e) => setConsent({ ...consent, sensitive: e.target.checked })}
          className="mt-1 accent-[#e60050]"
        />
        <span>
          {t("Je consens, lorsque cela est nécessaire et conformément à la réglementation applicable, au traitement de mes données personnelles sensibles ainsi qu'à l'utilisation de systèmes de filtrage et de sécurité des messages par SWIVV, aux fins de fournir, sécuriser et améliorer ses services.")}
        </span>
      </label>
    </>
  );
  // ponytail: config-driven one-question-per-screen signup (Meetic-style) — edit mode keeps the grouped steps below; per-question screens if kinds ever outgrow renderQ
  type QQ = {
    key: string;
    title: string;
    sub?: string;
    pre: boolean;
    when?: () => boolean;
    render: () => React.ReactNode;
    validate: () => string | null;
  };
  const selQ = (key: string, opts: () => readonly string[]) => (
    <Sel value={f[key]} onChange={(v) => upd(key, v)} options={opts()} placeholder="Choisir…" />
  );
  const segQ = (key: string, opts: readonly string[]) => (
    <Seg value={f[key]} onChange={(v) => upd(key, v)} options={opts} />
  );
  const inputQ = (key: string, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input value={f[key]} onChange={(e) => upd(key, e.target.value)} className={inputCls} {...props} />
  );
  const PRE_Q: QQ[] = [
    {
      key: "birthdate", title: "Quelle est ta date de naissance ?", sub: "SWIVV est réservé aux 18 ans et plus.",
      pre: true,
      render: () => <input type="date" value={f.birthdate} onChange={(e) => upd("birthdate", e.target.value)} className={inputCls} />,
      validate: () => {
        const age = ageFromBirthdate(f.birthdate);
        if (!Number.isFinite(age)) return "Ta date de naissance est obligatoire.";
        if ((age as number) < 18) return "SWIVV est réservé aux 18 ans et plus.";
        return null;
      },
    },
    {
      key: "gender", title: "Je suis… je cherche…", sub: "Pour te montrer les bons profils dès le départ.", pre: true,
      render: () => <div className="space-y-4">{genderOnly()}{seekingOnly()}</div>,
      validate: () => {
        if (!f.gender) return "Indique si tu es une femme ou un homme.";
        if (!f.seeking) return "Dis si tu veux rencontrer une femme ou un homme.";
        return null;
      },
    },
    {
      key: "ageRange", title: "Quel âge ont les profils que tu cherches ?",
      sub: "Retrouvés automatiquement dans Mes Matches.",
      pre: true,
      render: () => (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("Âge min")}</Label>
            <input type="number" value={f.ageMin} onChange={(e) => upd("ageMin", e.target.value)} min={18} max={99} className={inputCls} />
          </div>
          <div>
            <Label>{t("Âge max")}</Label>
            <input type="number" value={f.ageMax} onChange={(e) => upd("ageMax", e.target.value)} min={18} max={99} className={inputCls} />
          </div>
        </div>
      ),
      validate: () => {
        const lo = num(f.ageMin), hi = num(f.ageMax);
        if (!Number.isFinite(lo) || !Number.isFinite(hi)) return "Indique l'âge min et max recherchés.";
        if (lo < 18 || hi > 99) return "Les âges doivent être entre 18 et 99 ans.";
        if (lo > hi) return "L'âge min doit être inférieur à l'âge max.";
        return null;
      },
    },
    {
      key: "city", title: "Où habites-tu ?",
      pre: true,
      render: () => (
        <LocationAutocomplete value={f.city} onChange={(v) => upd("city", v)} onSelect={(s) => { if (s.country && PAYS.some((p) => p.toLowerCase() === s.country.trim().toLowerCase())) upd("country", s.country.trim()); }} placeholder="Paris" className={inputCls} />
      ),
      validate: () => (!req(f.city) ? "Ta ville est obligatoire." : null),
    },
    {
      key: "name", title: "Quel est ton prénom ?",
      pre: true,
      render: () => inputQ("name", { placeholder: "Camille", autoComplete: "given-name" }),
      validate: () => {
        if (!req(f.name)) return "Ton prénom est obligatoire.";
        if (f.name.includes("@")) return "Ton prénom ne peut pas être une adresse e-mail.";
        if (/\d/.test(f.name)) return "Ton prénom ne peut pas contenir de chiffres.";
        return null;
      },
    },
    {
      key: "email", title: "Quel est ton e-mail ?", sub: "Pour te connecter et recevoir tes invitations.",
      pre: true,
      render: () => (
        <input type="email" value={f.email} onChange={(e) => upd("email", e.target.value)} placeholder="camille@exemple.fr" autoComplete="email" disabled={emailLocked} className={`${inputCls} disabled:bg-[#f5f5f5] disabled:text-[#777]`} />
      ),
      validate: () => (!/.+@.+\..+/.test(f.email.trim()) ? "Un e-mail valide est obligatoire." : null),
    },
    {
      key: "password", title: "Crée ton mot de passe.",
      pre: true,
      when: () => !hasAccount,
      render: () => passwordFields() ?? <p className="text-sm text-[#777]">Compte déjà créé, on continue.</p>,
      validate: () => {
        if (hasAccount) return null;
        if (f.password.length < 8) return "Mot de passe : 8 caractères minimum.";
        if (f.password !== f.confirm) return "La confirmation du mot de passe ne correspond pas.";
        return null;
      },
    },
    {
      key: "consent", title: "Dernière étape : tes accords.",
      pre: true,
      render: () => <div className="space-y-3">{consentFields()}</div>,
      validate: () => {
        if (!cguAccepted) return "Ouvre les CGU détaillées, lis jusqu'en bas et clique Accepter.";
        if (!consent.age) return "Certifie tes 18 ans et accepte les CGU, les CGV et les cookies.";
        if (!consent.sensitive) return "Consens au traitement de tes données sensibles pour continuer.";
        return null;
      },
    },
  ];
  const POST_Q: QQ[] = [
    { key: "country", title: "Ton pays", pre: false, render: () => selQ("country", () => PAYS), validate: () => (!req(f.country) ? "Ton pays est obligatoire." : null) },
    { key: "lookingFor", title: "Que recherches-tu ?", sub: "Cette réponse apparaît sur ton profil.", pre: false, render: () => selQ("lookingFor", () => LOOKING), validate: () => (!f.lookingFor ? "Choisis ce que tu recherches." : null) },
    { key: "maritalStatus", title: "Ton statut matrimonial", pre: false, render: () => selQ("maritalStatus", () => forGender(MARITAL, f.gender)), validate: () => (!f.maritalStatus ? "Ton statut matrimonial est obligatoire." : null) },
    { key: "tagline", title: "Ta phrase d'accroche", sub: "Quelques mots suffisent pour marquer les esprits. (10 caractères min)", pre: false, render: () => inputQ("tagline", { placeholder: "Ce qui te résume en une phrase…", maxLength: 120 }), validate: () => (f.tagline.trim().length < 10 ? "Ta phrase d'accroche (10 caractères min) est obligatoire." : null) },
    { key: "bio", title: "Parle-nous de toi", sub: "Sois naturel, honnête, spontané. (20 caractères min)", pre: false, render: () => (<textarea value={f.bio} onChange={(e) => upd("bio", e.target.value)} placeholder="Parle de toi, de ton quotidien, de ce que tu cherches…" rows={4} maxLength={800} className={inputCls} />), validate: () => (f.bio.trim().length < 20 ? "Ta bio (20 caractères min) est obligatoire." : null) },
    { key: "heightCm", title: "Ta taille", pre: false, render: () => heightFields(), validate: () => { const h = num(f.heightCm); return !Number.isFinite(h) || h < 140 || h > 220 ? "Ta taille (140–220 cm) est obligatoire." : null; } },
    { key: "weightKg", title: "Ton poids", pre: false, render: () => weightFields(), validate: () => { const w = num(f.weightKg); return !Number.isFinite(w) || w < 35 || w > 200 ? "Ton poids (35–200 kg) est obligatoire." : null; } },
    { key: "hairColor", title: "Tes cheveux", pre: false, render: () => selQ("hairColor", () => HAIR), validate: () => (!f.hairColor ? "Ta couleur de cheveux est obligatoire." : null) },
    { key: "eyeColor", title: "Tes yeux", pre: false, render: () => selQ("eyeColor", () => EYES), validate: () => (!f.eyeColor ? "Ta couleur des yeux est obligatoire." : null) },
    { key: "bodyStyle", title: "Ta silhouette", pre: false, render: () => selQ("bodyStyle", () => forGender(BODY, f.gender)), validate: () => (!f.bodyStyle ? "Ta silhouette est obligatoire." : null) },
    { key: "ethnicity", title: "Tes origines", sub: "Donnée sensible, traitée uniquement pour le service.", pre: false, render: () => selQ("ethnicity", () => forGender(ETHNI, f.gender)), validate: () => (!f.ethnicity ? "Ton origine est obligatoire." : null) },
    { key: "selfAppearance", title: "Ton style", pre: false, render: () => selQ("selfAppearance", () => forGender(STYLE, f.gender)), validate: () => (!req(f.selfAppearance) ? "Ton style est obligatoire." : null) },
    { key: "bestFeature", title: "Mes plus beaux atouts", sub: "Sélectionne jusqu'à 5 qualités qui te correspondent.", pre: false, render: () => atoutsBlock(), validate: () => (selAtouts().length === 0 ? "Choisis au moins un atout (5 maximum)." : null) },
    { key: "occupation", title: "Ton métier", pre: false, render: () => selQ("occupation", () => forGender(METIERS, f.gender)), validate: () => (!req(f.occupation) ? "Ton métier est obligatoire." : null) },
    { key: "education", title: "Tes études", pre: false, render: () => selQ("education", () => EDUC), validate: () => (!f.education ? "Tes études sont obligatoires." : null) },
    { key: "drink", title: "Alcool ?", pre: false, render: () => selQ("drink", () => DRINK), validate: () => (!f.drink ? "Le champ alcool est obligatoire." : null) },
    { key: "smoke", title: "Tabac ?", pre: false, render: () => selQ("smoke", () => SMOKE), validate: () => (!f.smoke ? "Le champ tabac est obligatoire." : null) },
    { key: "drugs", title: "Drogue ?", pre: false, render: () => selQ("drugs", () => DRUGS), validate: () => (!f.drugs ? "Le champ drogue est obligatoire." : null) },
    { key: "eatingHabits", title: "Ton alimentation", pre: false, render: () => selQ("eatingHabits", () => EAT), validate: () => (!f.eatingHabits ? "Ton alimentation est obligatoire." : null) },
    { key: "employmentStatus", title: "Ta situation professionnelle", pre: false, render: () => selQ("employmentStatus", () => forGender(JOB, f.gender)), validate: () => (!f.employmentStatus ? "Ta situation professionnelle est obligatoire." : null) },
    { key: "annualIncome", title: "Tes revenus annuels", pre: false, render: () => selQ("annualIncome", () => forGender(INCOME, f.gender)), validate: () => (!f.annualIncome ? "Tes revenus sont obligatoires." : null) },
    { key: "livingSituation", title: "Ton logement", pre: false, render: () => selQ("livingSituation", () => forGender(LIVING, f.gender)), validate: () => (!f.livingSituation ? "Ton logement est obligatoire." : null) },
    { key: "relocate", title: gf("Prêt à déménager", "Prête à déménager", f.gender), pre: false, render: () => segQ("relocate", RELOCATE), validate: () => (!f.relocate ? "Dis si tu es prêt(e) à déménager." : null) },
    { key: "hasPets", title: "As-tu des animaux ?", pre: false, render: () => segQ("hasPets", YESNO), validate: () => (!f.hasPets ? "Dis si tu as des animaux." : null) },
    { key: "wantsMorePets", title: "Veux-tu (d'autres) animaux ?", pre: false, render: () => segQ("wantsMorePets", YESNOMAYBE), validate: () => (!f.wantsMorePets ? "Dis si tu veux (d'autres) animaux." : null) },
    { key: "haveChildren", title: "As-tu des enfants ?", pre: false, render: () => segQ("haveChildren", YESNO), validate: () => (!f.haveChildren ? "Dis si tu as des enfants." : null) },
    { key: "wantMoreChildren", title: "Veux-tu (d'autres) enfants ?", pre: false, render: () => segQ("wantMoreChildren", YESNOMAYBE), validate: () => (!f.wantMoreChildren ? "Dis si tu veux (d'autres) enfants." : null) },
    { key: "brothers", title: "Combien de frères as-tu ?", sub: "0 si aucun.", pre: false, render: () => inputQ("brothers", { placeholder: "1", inputMode: "numeric" }), validate: () => { const b = num(f.brothers); return !Number.isFinite(b) || b < 0 || b > 15 ? "Le nombre de frères est obligatoire (0 si aucun)." : null; } },
    { key: "sisters", title: "Combien de sœurs as-tu ?", sub: "0 si aucune.", pre: false, render: () => inputQ("sisters", { placeholder: "1", inputMode: "numeric" }), validate: () => { const si = num(f.sisters); return !Number.isFinite(si) || si < 0 || si > 15 ? "Le nombre de sœurs est obligatoire (0 si aucune)." : null; } },
    { key: "birthRank", title: "Ton rang dans la fratrie", pre: false, render: () => (<Sel value={f.birthRank} onChange={(v) => upd("birthRank", v)} options={sibTotal > 0 ? Array.from({ length: sibTotal }, (_, i) => String(i + 1)) : []} placeholder={sibTotal > 0 ? `Choisir (1 à ${sibTotal})` : "Indique d'abord frères et sœurs"} />), validate: () => { const b = num(f.brothers); const si = num(f.sisters); const r = num(f.birthRank); return !Number.isFinite(r) || r < 1 || r > b + si + 1 ? `Ton rang dans la fratrie (1 à ${b + si + 1}) est obligatoire.` : null; } },
    { key: "parentsMaritalStatus", title: "La situation de tes parents", pre: false, render: () => selQ("parentsMaritalStatus", () => PARENTS), validate: () => (!f.parentsMaritalStatus ? "La situation de tes parents est obligatoire." : null) },
    { key: "nat1", title: "Ta nationalité", pre: false, render: () => natFields(), validate: () => (!req(f.nat1) ? "Ta nationalité est obligatoire." : null) },
    { key: "firstLanguage", title: "Ta langue maternelle", pre: false, render: () => (<><input value={f.firstLanguage} onChange={(e) => upd("firstLanguage", e.target.value)} placeholder="Français" maxLength={30} list="swivv-firstlang" className={inputCls} /><datalist id="swivv-firstlang">{FIRSTLANGS.map((l) => (<option key={l} value={l} />))}</datalist></>), validate: () => (!req(f.firstLanguage) ? "Ta langue maternelle est obligatoire." : null) },
    { key: "otherLanguages", title: "Tes autres langues", pre: false, render: () => langsBlock(), validate: () => null },
    { key: "bornOrConverted", title: "Religion de naissance", pre: false, render: () => selQ("bornOrConverted", () => forGender(BORN, f.gender)), validate: () => (!f.bornOrConverted ? "Ta religion de naissance est obligatoire." : null) },
    { key: "religion", title: "Ta religion", pre: false, render: () => selQ("religion", () => forGender(RELIGION, f.gender)), validate: () => (!f.religion ? "Ta religion est obligatoire." : null) },
    { key: "religiousValues", title: "Ta pratique religieuse", pre: false, render: () => selQ("religiousValues", () => forGender(PRACTICE, f.gender)), validate: () => (!f.religiousValues ? "Ta pratique religieuse est obligatoire." : null) },
    { key: "familyValues", title: "Tes valeurs familiales", pre: false, render: () => selQ("familyValues", () => FAMILY_VALUES), validate: () => (!req(f.familyValues) ? "Tes valeurs familiales sont obligatoires." : null) },
    { key: "interests", title: "Tes centres d'intérêt", sub: "Pour de meilleurs matchs.", pre: false, render: () => interestsBlock(), validate: () => (csv(f.interests).length === 0 ? "Au moins un centre d'intérêt est obligatoire." : null) },
    { key: "photos", title: "Mets un visage sur ton nom", sub: "Une photo minimum — les profils avec photo reçoivent plus de messages.", pre: false, render: () => photosBlock(), validate: () => (photos.length === 0 ? "Choisis au moins une photo." : null) },
  ];
  const restoredRef = useRef(false);

  // Keep-empty restore from a local draft (refresh survival) — never touches password/confirm.
  const restoreDraftFields = (d: SignupDraft) => {
    if (d.f) {
      const fields = d.f;
      setF((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(fields)) {
          if (v && !next[k] && k !== "password" && k !== "confirm") next[k] = v;
        }
        return next;
      });
    }
    if (d.photos?.length) {
      const ph = d.photos;
      setPhotos((prev) => (prev.length ? prev : ph));
    }
    if (d.customPhotos?.length) {
      const cp = d.customPhotos;
      setCustomPhotos((prev) => (prev.length ? prev : cp));
    }
    if (typeof d.step === "number") setStep(Math.min(Math.max(d.step, 0), STEPS.length - 1));
    if (d.phase === "pre" || d.phase === "post") setPhase(d.phase);
    if (typeof d.qi === "number") setQi(Math.max(d.qi, 0));
  };

  const readDraft = (): SignupDraft | null => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as SignupDraft | null;
    } catch {
      return null;
    }
  };

  // Server profile, signup stash, or local draft all funnel through these two fills (keep-empty only).
  const fillFromProfile = (p: SwivvProfile, step?: number) => {
    setCguAccepted(true); // CGU already accepted when the account was created
    const keep = (cur: string, v: unknown) => cur || (v === undefined || v === null ? "" : String(v));
    const unDash = (v: unknown) => (v === "—" ? "" : (v ?? ""));
    const [n1, n2] = String(p.nationality ?? "").split(" + ");
    setF((pp) => ({
      ...pp,
      name: keep(pp.name, p.name),
      nat1: keep(pp.nat1, n1),
      nat2: keep(pp.nat2, n2),
      gender: keep(pp.gender, p.gender),
      birthdate: keep(pp.birthdate, p.birthdate),
      city: keep(pp.city, p.city),
      country: keep(pp.country, p.country),
      lookingFor: keep(pp.lookingFor, p.lookingFor),
      seeking: keep(pp.seeking, p.seeking),
      maritalStatus: keep(pp.maritalStatus, p.maritalStatus),
      tagline: keep(pp.tagline, p.tagline),
      bio: keep(pp.bio, p.bio),
      heightCm: keep(pp.heightCm, p.heightCm),
      weightKg: keep(pp.weightKg, p.weightKg),
      hairColor: keep(pp.hairColor, p.hairColor),
      eyeColor: keep(pp.eyeColor, p.eyeColor),
      bodyStyle: keep(pp.bodyStyle, p.bodyStyle),
      ethnicity: keep(pp.ethnicity, p.ethnicity),
      selfAppearance: keep(pp.selfAppearance, p.selfAppearance),
      bestFeature: keep(pp.bestFeature, p.bestFeature),
      occupation: keep(pp.occupation, p.occupation),
      education: keep(pp.education, p.education),
      drink: keep(pp.drink, p.drink),
      smoke: keep(pp.smoke, p.smoke),
      drugs: keep(pp.drugs, p.drugs),
      eatingHabits: keep(pp.eatingHabits, p.eatingHabits),
      employmentStatus: keep(pp.employmentStatus, p.employmentStatus),
      annualIncome: keep(pp.annualIncome, p.annualIncome),
      livingSituation: keep(pp.livingSituation, p.livingSituation),
      relocate: keep(pp.relocate, p.willingToRelocate === "yes" ? "Oui" : p.willingToRelocate === "no" ? "Non" : p.willingToRelocate === "maybe" ? "Peut-être" : ""),
      hasPets: keep(pp.hasPets, p.hasPets),
      petsDetails: keep(pp.petsDetails, unDash(p.petsDetails)),
      wantsMorePets: keep(pp.wantsMorePets, p.wantsMorePets),
      haveChildren: keep(pp.haveChildren, p.haveChildren),
      wantMoreChildren: keep(pp.wantMoreChildren, p.wantMoreChildren),
      brothers: keep(pp.brothers, p.brothersCount),
      sisters: keep(pp.sisters, p.sistersCount),
      birthRank: keep(pp.birthRank, p.birthRank),
      parentsMaritalStatus: keep(pp.parentsMaritalStatus, p.parentsMaritalStatus),
      firstLanguage: keep(pp.firstLanguage, p.firstLanguage),
      otherLanguages: keep(pp.otherLanguages, unDash(p.otherLanguages)),
      bornOrConverted: keep(pp.bornOrConverted, p.bornOrConverted),
      religion: keep(pp.religion, p.religion),
      religiousValues: keep(pp.religiousValues, p.religiousValues),
      familyValues: keep(pp.familyValues, p.familyValues),
      interests: keep(pp.interests, (p.interests ?? []).join(", ")),
    }));
    setPhotos((pprev) => (pprev.length ? pprev : (p.photos ?? [])));
    setStep(step ?? 1);
  };
  // ponytail: one restore for complete + partial profiles (the partial branch once recomputed first-unfilled, forgetting where you left off) — persisted below on every move
  const restorePosition = () => {
    if (!authUser) {
      setPhase("post");
      setQi(0);
      return;
    }
    let restored = false;
    try {
      const sp = JSON.parse(localStorage.getItem("swivv-flow-pos") ?? "null") as { uid?: string; phase?: string; qi?: number } | null;
      if (sp && sp.uid === authUser.id && (sp.phase === "pre" || sp.phase === "post") && typeof sp.qi === "number") {
        setPhase(sp.phase);
        setQi(Math.max(0, sp.qi));
        restored = true;
      }
    } catch {}
    if (!restored) {
      setPhase("post");
      setQi(0);
    } else {
      resumeRef.current = true;
    }
  };
  // Prefill from server profile, else signup stash / local draft — a refresh or post-confirm return never starts blank.
  useEffect(() => {
    if (authLoading) return;
    let live = true;
    if (!authUser) {
      setDoneProfile(null);
      if (!restoredRef.current) {
        restoredRef.current = true;
        const draft = readDraft();
        if (draft) restoreDraftFields(draft);
      }
      return;
    }
    getSwivvUser().then((u) => {
      if (!live || !u) return;
      setF((p) => ({
        ...p,
        name: p.name || u.name,
        email: p.email || u.email,
        nat1: p.nat1 || u.nationalities[0] || "",
        nat2: p.nat2 || u.nationalities[1] || "",
      }));
      if (u.email) setEmailLocked(true);
    });
    getMyProfile().then((p) => {
      if (!live) return;
      setDoneProfile(p);
      restoredRef.current = true;
      if (p) {
        fillFromProfile(p);
        // ponytail: restore the saved position (tab switches/mobile kills reset useState) — persisted below on every move; fresh recompute when nothing saved
        // (missing-only stats pass skips the restore so the jump effect lands on the first unanswered question, not where you left off)
        if (!missOnly) restorePosition();
        return;
      }
      // Post-confirm return with no server profile yet: restore entered data instead of blank step 0.
      let stash: SwivvProfile | null = null;
      try {
        stash = JSON.parse(localStorage.getItem("swivv-pending-profile") ?? "null") as SwivvProfile | null;
      } catch {}
      const draft = readDraft();
      if (stash && stash.name) {
        const ds = draft && typeof draft.step === "number" ? Math.min(Math.max(draft.step, 0), STEPS.length - 1) : 0;
        fillFromProfile(stash, ds);
        if (draft) restoreDraftFields({ photos: draft.photos, customPhotos: draft.customPhotos });
      } else if (draft) {
        restoreDraftFields(draft);
      } else {
        // ponytail: basic-info-only server row exists (landed on mon-profil first) — resume at post questions, not blank pre
        getMyRawProfile().then((r) => {
          if (!live || !r) return;
          setDoneProfile(r);
          fillFromProfile(r);
          if (!missOnly) restorePosition();
        });
      }
    });
    return () => {
      live = false;
    };
  }, [authLoading, authUser]);
  // Draft every keystroke/step while no server profile exists yet (logged out OR post-confirm) — refresh-proof; password never persisted.
  // ponytail: gated on restore — an unrestored mount would otherwise overwrite a good draft with blank defaults
  useEffect(() => {
    if (!restoredRef.current || doneProfile) return;
    const { password: _pw, confirm: _cf, ...rest } = f;
    void _pw;
    void _cf;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ f: rest, photos, customPhotos, step, phase, qi }));
    } catch {
      try {
        // ponytail: photo data-URLs can blow the 5MB quota — keep the text, photos get re-picked
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ f: rest, photos: [], customPhotos: [], step, phase, qi }));
      } catch {}
    }
  }, [f, photos, customPhotos, step, phase, qi, authUser, doneProfile]);
  // ponytail: 0..15 bounds duplicated with validate(), extract if they ever change
  const sibTotal = (() => {
    const b = num(f.brothers);
    const si = num(f.sisters);
    return Number.isFinite(b) && Number.isFinite(si) && b >= 0 && b <= 15 && si >= 0 && si <= 15 ? b + si + 1 : 0;
  })();
  const heightCmNum = num(f.heightCm);
  const heightFtIn: [string, string] = f.heightCm.trim() === "" || !Number.isFinite(heightCmNum) ? ["", ""] : cmToFtIn(heightCmNum);
  const heightHint = !Number.isFinite(heightCmNum) ? "" : f.heightUnit === "cm" ? `${heightFtIn[0]}′ ${heightFtIn[1]}″` : `${heightCmNum} cm`;
  const weightKgNum = num(f.weightKg);
  const weightSt = f.weightKg.trim() === "" || !Number.isFinite(weightKgNum) ? "" : kgToSt(weightKgNum);
  const weightHint = !Number.isFinite(weightKgNum) ? "" : f.weightUnit === "kg" ? `${weightSt} st` : `${weightKgNum} kg`;

  function validate(s: number): string | null {
    if (s === 0) {
      if (doneProfile) return null; // editing: account already exists
      if (!req(f.name)) return "Ton prénom est obligatoire.";
      if (f.name.includes("@")) return "Ton prénom ne peut pas être une adresse e-mail.";
      // ponytail: digits-only check — full username policing if moderation ever needs it
      if (/\d/.test(f.name)) return "Ton prénom ne peut pas contenir de chiffres.";
      if (!/.+@.+\..+/.test(f.email.trim())) return "Un e-mail valide est obligatoire.";
      if (!authUser) {
        if (f.password.length < 8) return "Mot de passe : 8 caractères minimum.";
        if (f.password !== f.confirm) return "La confirmation du mot de passe ne correspond pas.";
      }
      if (!req(f.nat1)) return "Ta nationalité est obligatoire.";
      if (!cguAccepted) return "Ouvre les CGU détaillées, lis jusqu'en bas et clique Accepter.";
      if (!consent.age) return "Certifie tes 18 ans et accepte les CGU, les CGV et les cookies.";
      if (!consent.sensitive) return "Consens au traitement de tes données sensibles pour continuer.";
      return null;
    }
    if (s === 1) {
      if (!f.gender) return "Indique si tu es une femme ou un homme.";
      if (!f.seeking) return "Dis si tu veux rencontrer une femme ou un homme.";
      const age = ageFromBirthdate(f.birthdate);
      if (!Number.isFinite(age)) return "Ta date de naissance est obligatoire.";
      if ((age as number) < 18) return "SWIVV est réservé aux 18 ans et plus.";
      if (!req(f.city)) return "Ta ville est obligatoire.";
      if (!req(f.country)) return "Ton pays est obligatoire.";
      if (!f.lookingFor) return "Choisis ce que tu recherches.";
      if (!f.maritalStatus) return "Ton statut matrimonial est obligatoire.";
      if (f.tagline.trim().length < 10) return "Ta phrase d'accroche (10 caractères min) est obligatoire.";
      if (f.bio.trim().length < 20) return "Ta bio (20 caractères min) est obligatoire.";
      return null;
    }
    if (s === 2) {
      const h = num(f.heightCm);
      if (!Number.isFinite(h) || h < 140 || h > 220) return "Ta taille (140–220 cm) est obligatoire.";
      const w = num(f.weightKg);
      if (!Number.isFinite(w) || w < 35 || w > 200) return "Ton poids (35–200 kg) est obligatoire.";
      if (!f.hairColor) return "Ta couleur de cheveux est obligatoire.";
      if (!f.eyeColor) return "Ta couleur des yeux est obligatoire.";
      if (!f.bodyStyle) return "Ta silhouette est obligatoire.";
      if (!f.ethnicity) return "Ton origine est obligatoire.";
      if (!req(f.selfAppearance)) return "Ton style est obligatoire.";
      if (selAtouts().length === 0) return "Choisis au moins un atout (5 maximum).";
      if (!req(f.occupation)) return "Ton métier est obligatoire.";
      if (!req(f.education)) return "Tes études sont obligatoires.";
      return null;
    }
    if (s === 3) {
      if (!f.drink) return "Le champ alcool est obligatoire.";
      if (!f.smoke) return "Le champ tabac est obligatoire.";
      if (!f.drugs) return "Le champ drogue est obligatoire.";
      if (!f.eatingHabits) return "Ton alimentation est obligatoire.";
      if (!f.employmentStatus) return "Ta situation professionnelle est obligatoire.";
      if (!f.annualIncome) return "Tes revenus sont obligatoires.";
      if (!f.livingSituation) return "Ton logement est obligatoire.";
      if (!f.relocate) return "Dis si tu es prêt(e) à déménager.";
      if (!f.hasPets) return "Dis si tu as des animaux.";
      if (!f.wantsMorePets) return "Dis si tu veux (d'autres) animaux.";
      return null;
    }
    if (s === 4) {
      if (!f.haveChildren) return "Dis si tu as des enfants.";
      if (!f.wantMoreChildren) return "Dis si tu veux (d'autres) enfants.";
      const b = num(f.brothers);
      if (!Number.isFinite(b) || b < 0 || b > 15) return "Le nombre de frères est obligatoire (0 si aucun).";
      const si = num(f.sisters);
      if (!Number.isFinite(si) || si < 0 || si > 15) return "Le nombre de sœurs est obligatoire (0 si aucune).";
      const r = num(f.birthRank);
      if (!Number.isFinite(r) || r < 1 || r > b + si + 1)
        return `Ton rang dans la fratrie (1 à ${b + si + 1}) est obligatoire.`;
      if (!f.parentsMaritalStatus) return "La situation de tes parents est obligatoire.";
      return null;
    }
    if (!req(f.firstLanguage)) return "Ta langue maternelle est obligatoire.";
    if (!f.bornOrConverted) return "Ta religion de naissance est obligatoire.";
    if (!f.religion) return "Ta religion est obligatoire.";
    if (!f.religiousValues) return "Ta pratique religieuse est obligatoire.";
    if (!req(f.familyValues)) return "Tes valeurs familiales sont obligatoires.";
    if (csv(f.interests).length === 0) return "Au moins un centre d'intérêt est obligatoire.";
    if (photos.length === 0) return "Choisis au moins une photo.";
    return null;
  }

  function next() {
    const e = validate(step);
    if (e) {
      setErr(e);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErr(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ponytail: same resend pattern as sign-in (no session yet, so email-keyed) — server rate-limits; the inline message is the only feedback, no toast system here
  async function resendConfirm() {
    setResendMsg(null);
    const { error } = await supabase.auth.resend({ type: "signup", email: (f.email ?? "").trim().toLowerCase() }).catch(() => ({ error: true as const }));
    setResendMsg(error ? "Envoi impossible pour le moment. Réessaie dans quelques minutes." : "E-mail renvoyé ! Vérifie ta boîte de réception (et tes spams).");
  }

  // ponytail: one render fn for both returns (quiz-flow + main) — a shared component would remount on each render; this holds no state
  function welcomeDialog() {
    return (
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e60050]/10">
            <Mail className="h-7 w-7 text-[#e60050]" />
          </div>
          <DialogHeader>
            <DialogTitle>{t("Merci pour ton inscription !")}</DialogTitle>
            <DialogDescription>
              {t("On t'a envoyé un e-mail à")}{" "}<span className="font-medium text-[#e60050]">{(f.email ?? "").trim()}</span> : {t("clique sur son lien pour confirmer ton adresse et activer ton compte.")}
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => nav({ to: "/mon-profil" })}
            className="w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white"
          >
            OK
          </button>
          <div className="border-t border-border pt-3 text-sm text-[#777]">
            {t("Pas reçu ? Vérifie tes spams, ou")}{" "}
            <button type="button" onClick={resendConfirm} className="font-medium text-[#e60050] hover:underline">
              {t("Renvoyer l'e-mail de confirmation")}
            </button>
            {resendMsg && <p className="mt-2 text-sm text-[#333]">{resendMsg}</p>}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  async function submit() {
    for (let s = 0; s < STEPS.length; s++) {
      const e = validate(s);
      if (e) {
        setStep(s);
        setErr(e);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    setBusy(true);
    try {
      // ponytail: a dead session (e.g. account deleted server-side) must take the signup path — otherwise the save runs under a ghost uid and RLS rejects it
      let authed = !!authUser;
      if (authed) {
        const { error } = await supabase.auth.getUser().catch(() => ({ error: true as const }));
        if (error) {
          await supabase.auth.signOut({ scope: "local" }).catch(() => null);
          authed = false;
        }
      }
      if (!doneProfile && !authed) {
        const signUpErr = await signUpSwivv(f.name, f.email.trim(), f.password, nats());
        if (signUpErr === SIGNUP_CONFIRM_MSG) {
          // ponytail: no session yet so the server save waits — stash locally, mon-profil shows + pushes it after confirm + sign in
          try {
            localStorage.setItem("swivv-pending-profile", JSON.stringify(buildProfile()));
          } catch {}
          saveSignupCriteria();
          setShowWelcome(true);
          return;
        }
        if (signUpErr) {
          setErr(signUpErr);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }
      const saveErr = await saveMyProfile(buildProfile());
      if (saveErr) {
        setErr(saveErr);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      nav({ to: "/mon-profil" });
    } finally {
      setBusy(false);
    }
  }

  // Editing: validate + save only the current step, stay put. Signup still uses submit().
  async function saveStep() {
    const e = validate(step);
    if (e) {
      setErr(e);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBusy(true);
    try {
      const profile = buildProfile();
      const saveErr = await saveMyProfile(profile);
      if (saveErr) {
        setErr(saveErr);
        return;
      }
      setDoneProfile(profile);
      setErr(null);
      toast.success(`Étape ${step + 1} enregistrée.`);
    } finally {
      setBusy(false);
    }
  }

  function nats() {
    return [f.nat1.trim(), f.nat2.trim()].filter(Boolean).slice(0, 2);
  }

  // ponytail: localStorage only — Matches load() reads it first and pullMatchCriteria uploads it server-side on first login; push directly if a pre-session server write ever exists
  function saveSignupCriteria() {
    if (!f.seeking) return;
    try {
      const prev = JSON.parse(localStorage.getItem(MATCH_CRITERIA_KEY) ?? "{}") as Record<string, string>;
      localStorage.setItem(MATCH_CRITERIA_KEY, JSON.stringify({ ...prev, gender: f.seeking === "man" ? "Homme" : "Femme", ageMin: f.ageMin.trim() || "18", ageMax: f.ageMax.trim() || "99" }));
    } catch {}
  }

  function buildProfile(): SwivvProfile {
    const age = ageFromBirthdate(f.birthdate);
    const b = num(f.brothers);
    const si = num(f.sisters);
    const ns = nats();
    return {
      id: doneProfile?.id ?? `moi-${Date.now().toString(36)}`,
      name: f.name.trim(),
      age,
      birthdate: f.birthdate,
      gender: f.gender as "woman" | "man",
      seeking: (f.seeking || (f.gender === "woman" ? "man" : "woman")) as "woman" | "man",
      city: f.city.trim(),
      country: f.country.trim(),
      distanceKm: 0,
      photo: photos[0],
      photos: photos.slice(0, 5),
      tagline: f.tagline.trim(),
      bio: f.bio.trim(),
      occupation: f.occupation.trim(),
      education: f.education.trim(),
      heightCm: num(f.heightCm),
      weightKg: num(f.weightKg),
      hairColor: f.hairColor,
      eyeColor: f.eyeColor,
      bodyStyle: f.bodyStyle,
      ethnicity: f.ethnicity,
      selfAppearance: f.selfAppearance.trim(),
      bestFeature: csv(f.bestFeature).slice(0, ATOUT_MAX).join(", "),
      hasPets: f.hasPets,
      petsDetails: f.petsDetails.trim() || "—",
      wantsMorePets: f.wantsMorePets,
      drink: f.drink,
      smoke: f.smoke,
      drugs: f.drugs,
      eatingHabits: f.eatingHabits,
      employmentStatus: f.employmentStatus,
      annualIncome: f.annualIncome,
      livingSituation: f.livingSituation,
      willingToRelocate: f.relocate === "Oui" ? "yes" : f.relocate === "Non" ? "no" : "maybe",
      haveChildren: f.haveChildren,
      wantMoreChildren: f.wantMoreChildren,
      brothersCount: b,
      sistersCount: si,
      birthRank: num(f.birthRank),
      parentsMaritalStatus: f.parentsMaritalStatus,
      nationality: ns.length > 1 ? `${ns[0]} + ${ns[1]}` : ns[0],
      firstLanguage: f.firstLanguage.trim(),
      otherLanguages: f.otherLanguages.trim() || "—",
      bornOrConverted: f.bornOrConverted,
      religiousValues: f.religiousValues,
      familyValues: f.familyValues.trim(),
      maritalStatus: f.maritalStatus,
      religion: f.religion,
      lookingFor: f.lookingFor,
      interests: csv(f.interests),
      languages: [f.firstLanguage.trim(), ...csv(f.otherLanguages)].filter(Boolean),
      online: true,
      isNew: true,
      joinedAt: new Date().toISOString().slice(0, 10),
      lastActive: "En ligne",
      compatibility: 100,
      verified: false,
    };
  }

  function togglePhoto(src: string) {
    setPhotos((p) => (p.includes(src) ? p.filter((x) => x !== src) : p.length >= 5 ? p : [...p, src]));
  }

  function removePhoto(src: string) {
    setCustomPhotos((c) => c.filter((x) => x !== src));
    setPhotos((p) => p.filter((x) => x !== src));
  }

  // ponytail: dataURL stored locally (no backend upload); downscale or storage bucket if quota bites
  function addUploads(files: FileList | null) {
    if (!files) return;
    setErr(null);
    const room = Math.max(0, 5 - photos.length);
    const { skipped, tooBig } = eachImageUrl(files, room, (url) => {
      setCustomPhotos((c) => (c.includes(url) ? c : [...c, url]));
      setPhotos((p) => (p.includes(url) || p.length >= 5 ? p : [...p, url]));
    });
    if (skipped) setErr("5 photos maximum. Les photos en trop ont été ignorées.");
    else if (tooBig) setErr("Photo trop lourde (2,5 Mo max). Choisis-en une plus légère.");
  }

  function toggleLang(l: string) {
    const cur = csv(f.otherLanguages);
    upd("otherLanguages", (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]).join(", "));
  }

  function toggleInterest(l: string) {
    const cur = csv(f.interests);
    upd("interests", (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]).join(", "));
  }

  function addCustomInterest() {
    const v = customInterest.trim().replace(/,+$/, "").trim();
    if (!v) return;
    if (!csv(f.interests).includes(v)) upd("interests", [...csv(f.interests), v].join(", "));
    setCustomInterest("");
  }

  const selAtouts = () => csv(f.bestFeature);
  function toggleAtout(v: string) {
    const cur = selAtouts();
    if (cur.includes(v)) upd("bestFeature", cur.filter((x) => x !== v).join(", "));
    else {
      if (cur.length >= ATOUT_MAX) {
        setErr(`Maximum ${ATOUT_MAX} atouts — retire-en un pour en ajouter un autre.`);
        return;
      }
      setErr(null);
      upd("bestFeature", [...cur, v].join(", "));
    }
  }
  function addCustomAtout() {
    const v = customAtout.trim().replace(/,+$/, "").trim().slice(0, 40);
    if (!v) return;
    const cur = selAtouts();
    if (cur.includes(v)) {
      setCustomAtout("");
      return;
    }
    if (cur.length >= ATOUT_MAX) {
      setErr(`Maximum ${ATOUT_MAX} atouts — retire-en un pour en ajouter un autre.`);
      return;
    }
    setErr(null);
    upd("bestFeature", [...cur, v].join(", "));
    setCustomAtout("");
  }
  const atoutsBlock = () => {
    const sel = selAtouts();
    return (
      <div className="space-y-3">
        <p className="text-sm text-[#555]">Sélectionne jusqu&apos;à 5 qualités qui te correspondent. Tu peux aussi ajouter un atout personnel.</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#333]">Mes atouts sélectionnés</p>
          <p className="text-sm font-medium tabular-nums text-[#e60050]" aria-live="polite">{sel.length}/{ATOUT_MAX}</p>
        </div>
        {sel.length === 0 ? (
          <p className="rounded-md border border-border bg-[#f7f7f7] px-3 py-2.5 text-sm text-[#999]">Tes choix apparaîtront ici.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sel.map((a) => (
              <button key={a} type="button" onClick={() => toggleAtout(a)} aria-label={`Retirer ${a}`} className="rounded-full bg-[#e60050]/10 px-3 py-1 text-sm font-medium text-[#e60050] hover:bg-[#e60050]/20">
                {a} ×
              </button>
            ))}
          </div>
        )}
        <div className="space-y-2">
          {ATOUTS.map((c) => {
            const n = c.items.filter((i) => sel.includes(i)).length;
            const Icon = c.icon;
            return (
              <details key={c.name} className="rounded-md border border-border bg-white">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.bg}`} aria-hidden="true">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[15px] font-medium text-[#333]">{c.name}</span>
                  {n > 0 && <span className="ml-auto rounded-full bg-[#e60050]/10 px-2 py-0.5 text-xs font-medium text-[#e60050]">{n}</span>}
                </summary>
                <div className="max-h-56 overflow-y-auto border-t border-border p-1">
                  {c.items.map((l) => (
                    <label key={l} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-[#333] hover:bg-[#f2f2f2]">
                      <input type="checkbox" checked={sel.includes(l)} onChange={() => toggleAtout(l)} className="h-4 w-4 accent-[#e60050]" />
                      {l}
                    </label>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
        <div>
          <Label optional>Un autre atout à ajouter ?</Label>
          <div className="flex gap-2">
            <input value={customAtout} onChange={(e) => setCustomAtout(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomAtout(); } }} placeholder="Ton atout personnel…" maxLength={40} className={inputCls} />
            <button type="button" onClick={addCustomAtout} className="shrink-0 rounded-md border border-[#e60050] px-4 font-medium text-[#e60050]">
              +
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- signup question flow (Meetic-style): few required questions pre-account, rest skippable after ---
  const editing = !!doneProfile;
  const hasAccount = !!authUser;
  const preQs = PRE_Q.filter((x) => !x.when || x.when());
  const postQs = POST_Q.filter((x) => !x.when || x.when());
  const flowQs = phase === "pre" ? preQs : postQs;
  const flowQ = flowQs[Math.min(qi, Math.max(flowQs.length - 1, 0))];
  // ponytail: completion across the whole signup (pre + post) — skipped questions simply stay unfilled; photo-gate if finishing ever needs more than photos
  // ponytail: thresholds mirror the validators (tagline 10, bio 20) so the missing-only revisit pass never skips an answer that would fail saving
  const isFilled = (key: string): boolean => {
    if (key === "photos") return photos.length > 0;
    if (key === "tagline") return f.tagline.trim().length >= 10;
    if (key === "bio") return f.bio.trim().length >= 20;
    if (key === "consent") return editing || (cguAccepted && consent.age && consent.sensitive);
    if (key === "password") return hasAccount || (f.password.length >= 8 && f.password === f.confirm);
    if (key === "ageRange") {
      const lo = num(f.ageMin), hi = num(f.ageMax);
      return Number.isFinite(lo) && Number.isFinite(hi) && lo >= 18 && hi <= 99 && lo <= hi;
    }
    return req(f[key] ?? "");
  };
  // ponytail: header shows profile-field % (same math as mon-profil) so both pages agree — question count stays internal for resume positioning
  const pct = profileCompleteness(buildProfile());
  // ponytail: missing-only pass (?revoir=manquantes, linked from stats) jumps over answered questions; a plain visit keeps the sequential order — param read once, no router search plumbing
  const [missOnly, setMissOnly] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("revoir") === "manquantes");
  const nextOpen = (from: number) => postQs.findIndex((q, i) => i > from && !isFilled(q.key));
  const prevOpen = (from: number) => postQs.reduce((found, q, i) => (i < from && !isFilled(q.key) ? i : found), -1);

  // ponytail: position survives tab switches (recompute-once covers first ever visit) — per-account so a shared browser never resumes someone else's spot
  const resumeRef = useRef(false);
  useEffect(() => {
    if (!authUser || !doneProfile) return;
    try {
      localStorage.setItem("swivv-flow-pos", JSON.stringify({ uid: authUser.id, phase, qi }));
    } catch {}
  }, [authUser, doneProfile, phase, qi]);
  useEffect(() => {
    if (!doneProfile || resumeRef.current) return;
    resumeRef.current = true;
    const open = postQs.findIndex((q) => !isFilled(q.key));
    setPhase("post");
    setQi(open < 0 ? postQs.length - 1 : open);
    window.scrollTo({ top: 0 });
  }, [doneProfile]);

  function qFail(e: string | null): boolean {
    if (!e) {
      setErr(null);
      return false;
    }
    // ponytail: one shared suffix, not 20 edited strings — Continuer speaks, Ignorer stays the silent bypass
    setErr(phase === "post" ? `${e} ${t("Ou clique sur Ignorer pour passer.")}` : e);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }

  function nextQ() {
    if (!flowQ) return;
    // ponytail: edit mode lets a cleared answer stay empty (re-selecting "Choisir…" un-answers it and the % drops on save) — half-filled values still validate, and pre-account creation stays fully mandatory
    if (!(editing && !isFilled(flowQ.key))) {
      if (qFail(flowQ.validate())) return;
    }
    if (phase === "pre") {
      if (qi >= preQs.length - 1) {
        void createAccount();
        return;
      }
      setQi(qi + 1);
    } else {
      // ponytail: missing-only pass jumps to the next unanswered question (n < 0 = none left → finish) — sequential otherwise
      const n = missOnly && editing ? nextOpen(qi) : qi + 1;
      if (n < 0 || n >= postQs.length) {
        void finishPost();
        return;
      }
      setQi(n);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function skipQ() {
    // ponytail: post-phase fully skippable (photos too — mon-profil previews the raw row); pre stays mandatory (no account without e-mail/password/age/consent)
    if (phase === "pre" || !flowQ) return;
    const n = missOnly && editing ? nextOpen(qi) : qi + 1;
    if (n < 0 || n >= postQs.length) {
      void finishPost();
      return;
    }
    setErr(null);
    setQi(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backQ() {
    setErr(null);
    if (missOnly && editing && phase === "post") {
      const p = prevOpen(qi);
      if (p >= 0) setQi(p);
    } else if (qi > 0) setQi(qi - 1);
    else if (phase === "post" && !editing) {
      setPhase("pre");
      setQi(preQs.length - 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function createAccount() {
    for (const qq of preQs) {
      if (qFail(qq.validate())) return;
    }
    setBusy(true);
    try {
      // ponytail: a dead session (e.g. account deleted server-side) must take the signup path — otherwise the save runs under a ghost uid and RLS rejects it
      let authed = !!authUser;
      if (authed) {
        const { error } = await supabase.auth.getUser().catch(() => ({ error: true as const }));
        if (error) {
          await supabase.auth.signOut({ scope: "local" }).catch(() => null);
          authed = false;
        }
      }
      if (!doneProfile && !authed) {
        const signUpErr = await signUpSwivv(f.name, f.email.trim(), f.password, nats());
        if (signUpErr === SIGNUP_CONFIRM_MSG) {
          // ponytail: no session yet so the server save waits — stash locally, mon-profil shows + pushes it after confirm + sign in
          try {
            localStorage.setItem("swivv-pending-profile", JSON.stringify(buildProfile()));
          } catch {}
          saveSignupCriteria();
          setShowWelcome(true);
          return;
        }
        if (signUpErr) {
          setErr(signUpErr);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }
      setErr(null);
      // ponytail: land on own profile after basic info — post questions stay skippable via Compléter; single save+nav if profile wall ever returns
      saveSignupCriteria();
      const preSaveErr = await saveMyProfile(buildProfile());
      if (preSaveErr) {
        setErr(preSaveErr);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      // ponytail: fire-and-forget analytics (never blocks signup) — swivv_events.signup_completed feeds acquisition funnels
      trackEvent("signup_completed");
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      nav({ to: "/mon-profil" });
    } finally {
      setBusy(false);
    }
  }

  async function finishPost() {
    // ponytail: no photo gate — a photoless save lands on mon-profil raw preview with a low-% nudge, not an error wall
    setBusy(true);
    try {
      const saveErr = await saveMyProfile(buildProfile());
      if (saveErr) {
        setErr(saveErr);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      nav({ to: "/mon-profil" });
    } finally {
      setBusy(false);
    }
  }

  if (doneProfile === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-md px-4 py-16 text-center text-[#777]">{t("Chargement…")}</main>
      </div>
    );
  }

  // ponytail: signup renders the question flow, edit mode the grouped steps below — shared field blocks above; split route if the branch ever grows its own chrome
  if (flowQ && (!editing || phase === "post")) {
    const lastPre = phase === "pre" && qi >= preQs.length - 1;
    const lastPost = phase === "post" && qi >= postQs.length - 1;
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-black text-white">
          <div className="flex w-full flex-wrap items-center gap-3 px-4 py-3">
            <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
            <span className="ml-auto text-sm font-medium tabular-nums text-white">
              {phase === "pre" ? t("Question {n}/{total}", { n: qi + 1, total: preQs.length }) : `${pct} %`}
            </span>
            <SwivvAuthButtons />
          </div>
          <div className="w-full px-4 pb-3">
            <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de l'inscription" className="h-1.5 overflow-hidden rounded-full bg-[#e5e5e5]">
              <div className="h-full rounded-full bg-[#e60050] transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </header>
        <main className="mx-auto flex min-h-[78vh] w-full max-w-2xl flex-col justify-center px-4 py-12">
          {phase === "post" && qi === 0 && req(f.name) && (
            <p className="text-sm text-[#777]">{t("Très bien {name}, parle-nous de toi.", { name: f.name.trim() })}</p>
          )}
          <h1 className="mt-1 text-2xl font-medium text-[#333]">{t(flowQ.title)}</h1>
          {flowQ.sub && <p className="mt-1 text-sm text-[#777]">{t(flowQ.sub)}</p>}
          <div className="mt-4 rounded-2xl bg-white p-5">{flowQ.render()}</div>
          {err && (
            <p role="alert" className="mb-4 mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">
              {t(err)}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            {!(phase === "pre" && qi === 0) && (
              <button type="button" onClick={backQ} className="rounded-md border border-[#e60050] px-6 py-3 font-medium text-[#e60050]">
                {t("← Retour")}
              </button>
            )}
            {phase === "post" && (
              <button type="button" onClick={skipQ} className="rounded-md border border-border px-6 py-3 font-medium text-[#555]">
                {t("Ignorer")}
              </button>
            )}
            <button type="button" onClick={nextQ} disabled={busy} className="flex-1 rounded-md bg-[#e60050] px-6 py-3 font-medium text-white disabled:opacity-60">
              {busy ? t("Un instant…") : lastPre ? t("Créer mon compte") : lastPost ? t("Terminer") : t("Sauvegarder et continuer")}
            </button>
          </div>
          {editing && missOnly && (
            <button
              type="button"
              onClick={() => {
                setMissOnly(false);
                setPhase("post");
                setQi(0);
                setErr(null);
                try { window.history.replaceState(null, "", "/inscription"); } catch {}
                window.scrollTo({ top: 0 });
              }}
              className="mt-3 w-full text-center text-sm font-medium text-[#e60050] hover:underline"
            >
              {t("Revoir tout mon profil")}
            </button>
          )}
        </main>
        <CguAcceptDialog
          open={cguOpen}
          onOpenChange={setCguOpen}
          onAccept={() => {
            setCguAccepted(true);
            try {
              localStorage.setItem("swivv-cgu-accepted", "1");
            } catch {}
          }}
        />
        {welcomeDialog()}
        <SwivvFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-black text-white">
        <div className="mx-auto flex flex-wrap max-w-3xl items-center gap-3 px-4 py-3">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
          <span className="ml-auto text-sm text-white/70">
            {t("Étape {n}/{total}", { n: step + 1, total: STEPS.length })}
          </span>
          <SwivvAuthButtons />
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <div className="flex gap-1" aria-hidden="true">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#e60050]" : "bg-[#e5e5e5]"}`} />
            ))}
          </div>
          <p className="mt-1 text-sm font-medium text-white">{t(STEPS[step])}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="mb-4 text-sm text-[#777]">
          Tous les champs marqués <span className="text-[#e60050]">*</span> sont obligatoires, mais tu peux passer
          chaque question avec « Ignorer » et y revenir plus tard. Seules la 2e nationalité, les autres langues
          et les détails sans objet (enfants, animaux) peuvent rester vides définitivement.
        </p>
        {err && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">
            {t(err)}
          </p>
        )}

        {step === 0 && (
          <section className="space-y-4 rounded-2xl bg-white p-5">
            <div>
              <Label>Ton prénom</Label>
              <input value={f.name} onChange={(e) => upd("name", e.target.value)} placeholder="Camille" autoComplete="given-name" className={inputCls} />
            </div>
            <div>
              <Label>Ton e-mail</Label>
              <input
                type="email"
                value={f.email}
                onChange={(e) => upd("email", e.target.value)}
                placeholder="camille@exemple.fr"
                autoComplete="email"
                disabled={emailLocked}
                className={`${inputCls} disabled:bg-[#f5f5f5] disabled:text-[#777]`}
              />
            </div>
            {passwordFields()}
            {natFields()}
            {!editing && (
              <>
                {consentFields()}
              </>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4 rounded-2xl bg-white p-5">
            {genderFields()}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ton pays</Label>
                <Sel value={f.country} onChange={(v) => upd("country", v)} options={PAYS} placeholder="Choisir…" />
              </div>
              <div>
                <Label>Ta ville</Label>
                {/* ponytail: reuse LocationAutocomplete (Nominatim); dedicated region field if matching needs it */}
                <LocationAutocomplete value={f.city} onChange={(v) => upd("city", v)} onSelect={(s) => { if (s.country && PAYS.some((p) => p.toLowerCase() === s.country.trim().toLowerCase())) upd("country", s.country.trim()); }} placeholder="Paris" className={inputCls} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ta date de naissance (18 ans min)</Label>
                <input type="date" value={f.birthdate} onChange={(e) => upd("birthdate", e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label>Tu recherches</Label>
                <Sel value={f.lookingFor} onChange={(v) => upd("lookingFor", v)} options={LOOKING} placeholder="Choisir…" />
              </div>
            </div>
            <div>
              <Label>Ton statut matrimonial</Label>
              <Sel value={f.maritalStatus} onChange={(v) => upd("maritalStatus", v)} options={forGender(MARITAL, f.gender)} placeholder="Choisir…" />
            </div>
            <div>
              <Label>Ta phrase d&apos;accroche (10 caractères min)</Label>
              <input value={f.tagline} onChange={(e) => upd("tagline", e.target.value)} placeholder="Ce qui te résume en une phrase…" maxLength={120} className={inputCls} />
            </div>
            <div>
              <Label>Ta bio (20 caractères min)</Label>
              <textarea value={f.bio} onChange={(e) => upd("bio", e.target.value)} placeholder="Parle de toi, de ton quotidien, de ce que tu cherches…" rows={4} maxLength={800} className={inputCls} />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4 rounded-2xl bg-white p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ta taille</Label>
                {heightFields()}
              </div>
              <div>
                <Label>Ton poids</Label>
                {weightFields()}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Tes cheveux</Label>
                <Sel value={f.hairColor} onChange={(v) => upd("hairColor", v)} options={HAIR} placeholder="Choisir…" />
              </div>
              <div>
                <Label>Tes yeux</Label>
                <Sel value={f.eyeColor} onChange={(v) => upd("eyeColor", v)} options={EYES} placeholder="Choisir…" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ta silhouette</Label>
                <Sel value={f.bodyStyle} onChange={(v) => upd("bodyStyle", v)} options={forGender(BODY, f.gender)} placeholder="Choisir…" />
              </div>
              <div>
                <Label>Ton origine</Label>
                <Sel value={f.ethnicity} onChange={(v) => upd("ethnicity", v)} options={forGender(ETHNI, f.gender)} placeholder="Choisir…" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ton style</Label>
                <Sel value={f.selfAppearance} onChange={(v) => upd("selfAppearance", v)} options={forGender(STYLE, f.gender)} placeholder="Choisir…" />
              </div>
              <div>
                <Label>Mes plus beaux atouts (1 à 5)</Label>
                {atoutsBlock()}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ton métier</Label>
                <Sel value={f.occupation} onChange={(v) => upd("occupation", v)} options={forGender(METIERS, f.gender)} placeholder="Choisir…" />
              </div>
              <div>
                <Label>Tes études</Label>
                <Sel value={f.education} onChange={(v) => upd("education", v)} options={EDUC} placeholder="Choisir…" />
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4 rounded-2xl bg-white p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Alcool</Label>
                <Sel value={f.drink} onChange={(v) => upd("drink", v)} options={DRINK} placeholder="Choisir…" />
              </div>
              <div>
                <Label>Tabac</Label>
                <Sel value={f.smoke} onChange={(v) => upd("smoke", v)} options={SMOKE} placeholder="Choisir…" />
              </div>
              <div>
                <Label>Drogue</Label>
                <Sel value={f.drugs} onChange={(v) => upd("drugs", v)} options={DRUGS} placeholder="Choisir…" />
              </div>
              <div>
                <Label>Alimentation</Label>
                <Sel value={f.eatingHabits} onChange={(v) => upd("eatingHabits", v)} options={EAT} placeholder="Choisir…" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ta situation professionnelle</Label>
                <Sel value={f.employmentStatus} onChange={(v) => upd("employmentStatus", v)} options={forGender(JOB, f.gender)} placeholder="Choisir…" />
              </div>
              <div>
                <Label>Tes revenus annuels</Label>
                <Sel value={f.annualIncome} onChange={(v) => upd("annualIncome", v)} options={forGender(INCOME, f.gender)} placeholder="Choisir…" />
              </div>
            </div>
            <div>
              <Label>Ton logement</Label>
              <Sel value={f.livingSituation} onChange={(v) => upd("livingSituation", v)} options={forGender(LIVING, f.gender)} placeholder="Choisir…" />
            </div>
            <div>
              <Label>{gf("Prêt à déménager", "Prête à déménager", f.gender)}</Label>
              <Seg value={f.relocate} onChange={(v) => upd("relocate", v)} options={RELOCATE} />
            </div>
            <div>
              <Label>As-tu des animaux</Label>
              <Seg value={f.hasPets} onChange={(v) => upd("hasPets", v)} options={YESNO} />
            </div>
            <div>
              <Label>Veux-tu (d&apos;autres) animaux</Label>
              <Seg value={f.wantsMorePets} onChange={(v) => upd("wantsMorePets", v)} options={YESNOMAYBE} />
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4 rounded-2xl bg-white p-5">
            <div>
              <Label>As-tu des enfants</Label>
              <Seg value={f.haveChildren} onChange={(v) => upd("haveChildren", v)} options={YESNO} />
            </div>
            <div>
              <Label>Veux-tu (d&apos;autres) enfants</Label>
              <Seg value={f.wantMoreChildren} onChange={(v) => upd("wantMoreChildren", v)} options={YESNOMAYBE} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Nombre de frères (0 si aucun)</Label>
                <input value={f.brothers} onChange={(e) => upd("brothers", e.target.value)} placeholder="1" inputMode="numeric" className={inputCls} />
              </div>
              <div>
                <Label>Nombre de sœurs (0 si aucune)</Label>
                <input value={f.sisters} onChange={(e) => upd("sisters", e.target.value)} placeholder="1" inputMode="numeric" className={inputCls} />
              </div>
              <div>
                <Label>Ton rang dans la fratrie</Label>
                <Sel value={f.birthRank} onChange={(v) => upd("birthRank", v)} options={sibTotal > 0 ? Array.from({ length: sibTotal }, (_, i) => String(i + 1)) : []} placeholder={sibTotal > 0 ? `Choisir (1 à ${sibTotal})` : "Indique d'abord frères et sœurs"} />
              </div>
            </div>
            <div>
              <Label>Situation de tes parents</Label>
              <Sel value={f.parentsMaritalStatus} onChange={(v) => upd("parentsMaritalStatus", v)} options={PARENTS} placeholder="Choisir…" />
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-4 rounded-2xl bg-white p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ta langue maternelle</Label>
                <input value={f.firstLanguage} onChange={(e) => upd("firstLanguage", e.target.value)} placeholder="Français" maxLength={30} list="swivv-firstlang" className={inputCls} />
                <datalist id="swivv-firstlang">
                  {FIRSTLANGS.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </div>
              {langsBlock()}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Religion de naissance</Label>
                <Sel value={f.bornOrConverted} onChange={(v) => upd("bornOrConverted", v)} options={forGender(BORN, f.gender)} placeholder="Choisir…" />
              </div>
              <div>
                <Label>Ta religion</Label>
                <Sel value={f.religion} onChange={(v) => upd("religion", v)} options={forGender(RELIGION, f.gender)} placeholder="Choisir…" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Ta pratique religieuse</Label>
                <Sel value={f.religiousValues} onChange={(v) => upd("religiousValues", v)} options={forGender(PRACTICE, f.gender)} placeholder="Choisir…" />
              </div>
              <div>
                <Label>Tes valeurs familiales</Label>
                <Sel value={f.familyValues} onChange={(v) => upd("familyValues", v)} options={FAMILY_VALUES} placeholder="Choisir…" />
              </div>
            </div>
            {interestsBlock()}
            {photosBlock()}
          </section>
        )}

        <div className="mt-4 flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => {
                setErr(null);
                setStep((s) => s - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-md border border-[#e60050] px-6 py-3 font-medium text-[#e60050]"
            >
              ← Retour
            </button>
          )}
          {editing ? (
            <>
              <button
                type="button"
                onClick={saveStep}
                disabled={busy}
                className="flex-1 rounded-md bg-[#e60050] px-6 py-3 font-medium text-white disabled:opacity-60"
              >
                {busy ? t("Enregistrement…") : t("Enregistrer cette étape")}
              </button>
              {step < STEPS.length - 1 && (
                <button
                  type="button"
                  onClick={next}
                  className="rounded-md border border-[#e60050] px-6 py-3 font-medium text-[#e60050]"
                >
                  Continuer →
                </button>
              )}
            </>
          ) : step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="flex-1 rounded-md bg-[#e60050] px-6 py-3 font-medium text-white"
            >
              Continuer →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="flex-1 rounded-md bg-[#e60050] px-6 py-3 font-medium text-white disabled:opacity-60"
            >
              {busy ? t("Création…") : t("Créer mon profil")}
            </button>
          )}
        </div>
        {editing && (
          <button
            type="button"
            onClick={() => nav({ to: "/mon-profil" })}
            className="mt-2 w-full text-center text-sm text-[#777] hover:text-[#333] hover:underline"
          >
            {t("Annuler et retour au profil")}
          </button>
        )}
      </main>
      <CguAcceptDialog
        open={cguOpen}
        onOpenChange={setCguOpen}
        onAccept={() => {
          setCguAccepted(true);
          try {
            localStorage.setItem("swivv-cgu-accepted", "1");
          } catch {}
        }}
      />
      {welcomeDialog()}
      <SwivvFooter />
    </div>
  );
}
