import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  BarChart3,
  Camera,
  Flame,
  Heart,
  MapPin,
  Mic,
  ShieldAlert,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/comment-ca-marche")({
  head: () =>
    pageHead(
      "Comment fonctionne SWIVV MATCH — rencontres gratuites",
      "Comment fonctionne SWIVV MATCH : inscription gratuite en 2 minutes, profil, photos, score de compatibilité, likes, matchs, messages, vocaux et conseils de sécurité.",
      "/comment-ca-marche",
    ),
  component: HowItWorksPage,
});

// ponytail: static copy, CMS if marketing edits it weekly
const SECTIONS: {
  title: string;
  icon: LucideIcon;
  tint: string;
  intro: string;
  points: string[];
}[] = [
  {
    title: "1. Compte en 2 minutes, profil à ton rythme",
    icon: UserPlus,
    tint: "bg-blue-100 text-blue-600",
    intro:
      "Crée ton compte gratuit en 2 minutes avec ton e-mail et un mot de passe, puis complète ton profil à ton rythme : tu peux t'arrêter et reprendre à tout moment.",
    points: [
      "Compte : prénom, e-mail, mot de passe (8 caractères min) et nationalité.",
      "Profil : genre, âge (18 ans min), ville, ce que tu recherches et ta présentation.",
      "Apparence, style de vie, famille, origines et valeurs : plus ton profil est complet, plus tes matchs sont pertinents.",
      "Photos : ajoute jusqu'à 5 photos de toi (1 minimum pour être visible).",
    ],
  },
  {
    title: "2. Créer un profil qui donne envie",
    icon: Sparkles,
    tint: "bg-violet-100 text-violet-600",
    intro:
      "Les profils complets reçoivent nettement plus de matchs. L'algorithme et les autres membres se basent sur ce que tu partages.",
    points: [
      "Écris une phrase d'accroche (10 caractères min) et une bio sincère (20 caractères min) : ce que tu aimes, ce que tu cherches.",
      "Indique ton intention clairement : relation sérieuse, mariage, belle histoire.",
      "Renseigne tes centres d'intérêt : ce sont eux qui déclenchent les conversations.",
    ],
  },
  {
    title: "3. Choisir de bonnes photos",
    icon: Camera,
    tint: "bg-amber-100 text-amber-600",
    intro:
      "Tes photos font la première impression. SWIVV n'accepte que de vraies photos : ni dessins, ni illustrations, ni photos de célébrités.",
    points: [
      "Mets une photo récente où l'on voit bien ton visage en première photo.",
      "Varie les contextes : portrait, en pied, en activité, avec des proches.",
      "Évite les lunettes de soleil sur toutes les photos, les filtres lourds et les photos floues.",
      "5 photos maximum, récentes de préférence : on veut te reconnaître au premier rendez-vous.",
    ],
  },
  {
    title: "4. Être honnête avec les autres",
    icon: BadgeCheck,
    tint: "bg-emerald-100 text-emerald-600",
    intro:
      "La confiance est la base des belles histoires. Un profil honnête attire des personnes qui te correspondent vraiment.",
    points: [
      "Donne ton vrai âge, ta vraie ville et ta vraie situation.",
      "Annonce ton intention réelle dès le départ : chercher le mariage en voulant juste discuter fait perdre son temps à tout le monde.",
      "Ne partage jamais tes mots de passe ni tes codes bancaires, même avec un match de confiance.",
    ],
  },
  {
    title: "5. Reconnaître les faux profils et les arnaques",
    icon: ShieldAlert,
    tint: "bg-red-100 text-red-600",
    intro:
      "La plupart des profils sont sincères, mais reste vigilant. Voici les signaux qui doivent t'alerter.",
    points: [
      "Photos trop parfaites ou de mannequin, profil presque vide, déclarations d'amour après 2 messages.",
      "La personne refuse systématiquement de se montrer ou de te rencontrer en public.",
      "Demande d'argent, de cartes cadeaux, de virement ou d'aide financière urgente : c'est toujours une arnaque.",
      "Liens externes suspects ou demande de continuer sur une autre appli dès le premier message.",
      "En cas de doute, signale le profil via « Signaler un abus » : l'équipe SWIVV vérifie et agit.",
    ],
  },
  {
    title: "6. Comment fonctionne le matching",
    icon: Heart,
    tint: "bg-pink-100 text-[#e91e63]",
    intro:
      "Swipe, découvre, like : tu parcours des profils sélectionnés, tu likes ceux qui te plaisent, et certains deviennent des matchs.",
    points: [
      "Parcours les profils par ville, âge, intention et centres d'intérêt.",
      "Like les profils qui te plaisent et écris-leur librement. Quand l'intérêt est réciproque, cela devient un match et les vocaux et les photos se débloquent.",
      "Chaque profil affiche un score de compatibilité calculé sur la ville, l'âge, les intérêts, la religion et les intentions.",
      "Personnalise ton premier message en rebondissant sur le profil : le taux de réponse triple.",
    ],
  },
  {
    title: "7. Se rencontrer en toute sécurité",
    icon: MapPin,
    tint: "bg-sky-100 text-sky-600",
    intro:
      "Quand le courant passe en messages, passe au réel — prudemment, surtout les premières fois.",
    points: [
      "Prends le temps de discuter avant de donner ton numéro ou tes réseaux.",
      "Premier rendez-vous : lieu public, en journée, et préviens un proche (lieu, heure, prénom de la personne).",
      "Garde tes propres moyens de transport pour pouvoir partir quand tu veux.",
      "Fais confiance à ton instinct : un malaise suffit à écourter ou annuler, sans justification.",
    ],
  },
  {
    title: "8. Messages vocaux et envoi d'images",
    icon: Mic,
    tint: "bg-indigo-100 text-indigo-600",
    intro:
      "Les vocaux et les images se débloquent avec un match : tu dois liker et être liké(e) en retour. Tant que ce n'est pas réciproque, seuls les messages écrits sont possibles. Pour parler de vive voix, échange ton numéro quand tu es prêt(e).",
    points: [
      "Messages vocaux : dans la conversation (popup sur le profil ou page Messages), touche le micro pour enregistrer, ■ pour envoyer, ✕ pour annuler. Tes vocaux sont écoutables des deux côtés, sur téléphone comme sur ordinateur.",
      "Signaler un vocal : touche l'icône drapeau à côté d'un message vocal et choisis le motif — la modération l'examine.",
      "Envoi d'images : dans la conversation, touche l'icône image à côté du micro pour partager une photo (5 Mo max). Les images sont visibles des deux côtés, sur téléphone comme sur ordinateur.",
      "Conservation : les messages (textes, vocaux, images) sont supprimés automatiquement après 3 mois, qu'ils aient été lus ou non, pour limiter le stockage de tes données.",
      "Le micro exige un accès autorisé dans le navigateur ; sur téléphone, utilise la version https du site.",
    ],
  },
  {
    title: "9. Mes statistiques : comprendre ce qui marche",
    icon: BarChart3,
    tint: "bg-teal-100 text-teal-600",
    intro:
      "Dans Mon compte, l'onglet Mes statistiques résume l'activité de ton profil. Choisis la période (7, 30, 90 jours ou depuis ton inscription) puis navigue entre 6 onglets.",
    points: [
      "Vue d'ensemble : visites, likes reçus et envoyés, matches mutuels, graphique jour par jour et activité récente.",
      "Mon profil : complétude en %, champs à compléter et conseils pour améliorer ton profil.",
      "Likes et interactions : réactions reçues sur tes photos, membres ayant réagi et photo qui performe le mieux.",
      "Messages et conversations : messages envoyés et reçus, vocaux, photos et taux de réponse.",
      "Visibilité et progression : ce qui fait découvrir ton profil et ce que tu peux améliorer.",
      "Sécurité et confidentialité : tes signalements, tes blocages et les membres qui t'ont bloqué.",
      "Ces chiffres restent privés : ils ne sont visibles que par toi.",
    ],
  },
  {
    title: "10. SWIVV PROGRESS : suivre ta progression",
    icon: Flame,
    tint: "bg-orange-100 text-orange-600",
    intro:
      "SWIVV PROGRESS, dans Mon compte, transforme ton activité en repères simples : régularité, succès débloqués et chiffres clés. Aucune course au volume : seuls les vrais échanges comptent.",
    points: [
      "Progression : ta série de connexion (jours actifs consécutifs et record), ton objectif de la semaine et ta prochaine étape de profil.",
      "Le calendrier des 7 derniers jours montre tes jours actifs : passe la souris sur un jour pour voir sa date.",
      "Succès : 6 badges à débloquer — Prêt à rencontrer, Première étincelle, Premier message, Échange à deux, Présence régulière, et Ambassadeur bienveillant (bientôt).",
      "Statistiques : série actuelle, conversations relancées et chiffres de la période.",
      "Un like réciproque ou une vraie conversation suffit à faire vivre ta série : revenir tous les jours n'est pas obligatoire.",
    ],
  },
];

function HowItWorksPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home">
            <SwivvLogo />
          </Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-medium text-[#333]">Découvrir comment ça marche</h1>
        <p className="mt-2 text-[#777]">
          Inscription, profil, photos, matching, sécurité et suivi de ta progression : tout ce qu'il
          faut savoir pour bien démarrer sur SWIVV et faire de belles rencontres en confiance.
        </p>

        {SECTIONS.map((s) => (
          <section
            key={s.title}
            aria-label={s.title}
            className="mt-8 rounded-2xl bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.tint}`}
                aria-hidden="true"
              >
                <s.icon className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-medium text-[#333]">{s.title}</h2>
            </div>
            <p className="mt-2 leading-relaxed text-[#555]">{s.intro}</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[#555]">
              {s.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ))}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {user ? (
            <Link
              to="/browse"
              search={{ q: "", type: "", location: "" }}
              className="flex-1 rounded-md bg-[#e91e63] px-4 py-3 text-center font-medium text-white"
            >
              Voir les profils
            </Link>
          ) : (
            <Link
              to="/inscription"
              className="flex-1 rounded-md bg-[#e91e63] px-4 py-3 text-center font-medium text-white"
            >
              Créer mon profil gratuit
            </Link>
          )}
          <Link
            to="/contact-us"
            search={{ subject: "Signaler un abus ou un faux profil" }}
            className="flex-1 rounded-md border border-[#e91e63] px-4 py-3 text-center font-medium text-[#e91e63]"
          >
            Signaler un abus
          </Link>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
