export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  thumbnail: string;
  content: string[];
  testimonials?: { names: string; place: string; quote: string }[];
};

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=faces&w=800&h=500&q=80`;

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "premier-message-exemples-qui-marchent",
    title: "Premier message : 7 exemples qui marchent vraiment",
    excerpt: "« Salut ça va ? » ne marche presque jamais. Voici comment écrire un premier message qui obtient une réponse.",
    category: "Conseils",
    author: "Équipe SWIVV",
    date: "2026-09-10",
    readTime: "5 min",
    thumbnail: "/first-message-banner.svg", // ponytail: flat static SVG, animated/interactive version if engagement needs it
    content: [
      "Sur SWIVV, le premier message fait toute la différence : les profils qui personnalisent leur premier message reçoivent jusqu'à 3 fois plus de réponses que ceux qui envoient un simple « salut ça va ? ».",
      "1. Rebondis sur son profil. « J'ai vu que tu fais de la rando — tu as déjà fait le GR20 ? » montre que tu as lu, pas juste liké la photo.",
      "2. Pose une question facile. Les questions ouvertes et légères (« team plage ou team montagne ? ») donnent envie de répondre.",
      "3. Ajoute une touche d'humour. Un petit trait d'esprit vaut mieux qu'un compliment générique sur le physique.",
      "4. Évite les pavés. Trois à cinq lignes suffisent : qui tu es, pourquoi son profil t'a plu, une question.",
      "5. Relis-toi. Les fautes à chaque mot font chuter les réponses. Un message propre inspire confiance.",
      "6. Ne parle pas d'argent ni de rencontres d'un soir si son intention affiche « relation sérieuse » ou « mariage » : lis l'intention du profil avant d'écrire.",
      "7. Si pas de réponse après 2-3 jours, une seule relance polie suffit. Au-delà, passe au profil suivant : il y a des milliers de célibataires sur SWIVV.",
    ],
  },
  {
    slug: "mariage-bien-utiliser-swivv",
    title: "Mariage : comment bien utiliser SWIVV",
    excerpt: "Profils pratiquants, intentions claires, familles impliquées : le guide pour une recherche de mariage sereine.",
    category: "Mariage",
    author: "Équipe SWIVV",
    date: "2026-09-05",
    readTime: "6 min",
    thumbnail: "/hearts-banner.svg", // ponytail: reuse hearts-banner (shared with relation-serieuse), dedicated mariage banner if duplication matters
    content: [
      "De nombreux membres SWIVV cherchent le mariage : filtre les profils par intention « Mariage » et par valeurs religieuses pour ne voir que les personnes qui partagent ton projet.",
      "Sois clair dès ton profil. Indique ta pratique, ton projet familial et le rôle que tu souhaites pour les familles. Les profils explicites attirent des personnes sérieuses et découragent les discussions futiles.",
      "Implique les familles tôt, mais pas trop tôt. Quelques échanges pour vérifier la compatibilité (valeurs, projet de vie, ville), puis propose d'inclure les parents avant de s'attacher.",
      "Pose les vraies questions avant le premier rendez-vous : lieu de vie, travail, enfants, rapport à la pratique religieuse. Mieux vaut un « non » rapide qu'un attachement compliqué.",
      "Reste vigilant. Ne verse jamais d'argent, même pour une urgence familiale ou un billet d'avion. Signale tout comportement suspect via la page contact : la modération SWIVV agit vite.",
      "Enfin, fais confiance au processus et à ta famille : la plupart des mariages issus des rencontres en ligne commencent par des intentions claires des deux côtés.",
    ],
  },
  {
    slug: "idees-premier-rendez-vous",
    title: "10 idées de premier rendez-vous qui changent du café",
    excerpt: "Balade photo, brunch, salsa, expo : des idées simples pour un premier rendez-vous réussi, à Paris comme ailleurs.",
    category: "Sorties",
    author: "Équipe SWIVV",
    date: "2026-08-28",
    readTime: "4 min",
    thumbnail: "/hearts-sparks-banner.svg", // ponytail: reuse hearts-sparks-banner (shared with bien-demarrer), dedicated banner if duplication matters
    content: [
      "Le café reste un classique, mais un premier rendez-vous original en dit long sur toi. Voici 10 idées testées et approuvées par les couples SWIVV.",
      "1. La balade photo : chacun son téléphone, un quartier sympa, et on compare ses clichés à la fin.",
      "2. Le brunch du dimanche : détendu, sans la pression du dîner.",
      "3. Le cours de salsa débutant : parfait pour briser la glace (Léa, prof de danse à Nice, approuve).",
      "4. L'expo du moment : de quoi parler pendant des heures.",
      "5. Le marché et on cuisine ensemble : tu découvres tout de suite si la personne sait tenir un couteau.",
      "6. La rando facile : 2 heures de marche valent 10 textos.",
      "7. Le blind test dans un bar : esprit d'équipe immédiat.",
      "8. La patinoire ou le bowling : le ridicule partagé rapproche.",
      "9. Le pique-nique au parc : simple, pas cher, efficace.",
      "10. Le bénévolat d'un samedi : tu vois la personne dans ce qu'elle a de meilleur.",
      "Règle d'or : un lieu public, une durée limitée (1h30 max la première fois), et préviens un ami de l'endroit. La sécurité d'abord, la magie ensuite.",
    ],
  },
  {
    slug: "photos-profil-erreurs-matchs",
    title: "Photos de profil : les 5 erreurs qui tuent tes matchs",
    excerpt: "Lunettes de soleil, photos floues, dessins : voici ce qui fait fuir — et comment y remédier en 10 minutes.",
    category: "Conseils",
    author: "Équipe SWIVV",
    date: "2026-08-20",
    readTime: "4 min",
    thumbnail: "/hearts-sparks-banner.svg",
    content: [
      "Ta photo principale décide en 3 secondes si on ouvre ton profil. Voici les 5 erreurs les plus fréquentes vues sur SWIVV — et comment les corriger.",
      "1. Les dessins et illustrations. Sur SWIVV, seules les vraies photos sont acceptées : un avatar cartoon fait chuter les matchs et peut faire retirer ton profil.",
      "2. Les lunettes de soleil sur toutes les photos. On veut voir ton regard : garde-en une maximum, et montre tes yeux sur la photo principale.",
      "3. Le flou et les vieux pixels. Une photo nette, lumineuse, récente : la lumière du jour près d'une fenêtre fait des miracles, gratuitement.",
      "4. Les photos de groupe en première. Si on doit deviner qui tu es, on passe au suivant. Toi seul(e), souriant(e), en premier.",
      "5. Une seule photo. Les profils avec 3 photos reçoivent nettement plus de likes : un portrait, une photo en activité (sport, cuisine, voyage) et une photo du quotidien.",
      "Bonus : demande le badge vérifié. Sur SWIVV, les profils vérifiés inspirent confiance et apparaissent mieux classés dans la recherche.",
    ],
  },
  {
    slug: "relation-serieuse-signes-profil-fiable",
    title: "Relation sérieuse : 6 signes d'un profil fiable",
    excerpt: "Bio remplie, intention claire, photos réelles : apprends à repérer les profils sérieux en 30 secondes.",
    category: "Confiance & sécurité",
    author: "Équipe SWIVV",
    date: "2026-08-12",
    readTime: "5 min",
    thumbnail: "/hearts-banner.svg",
    content: [
      "Entre les faux profils et les intentions floues, difficile de s'y retrouver. Voici 6 signes qui ne trompent pas, inspirés des meilleures pratiques de sécurité des rencontres en ligne.",
      "1. Une bio complète et personnelle. Les détails concrets (métier, passions, projet) sont bon signe ; les bios vides ou copiées-collées, non.",
      "2. Une intention affichée : « relation sérieuse », « mariage », « belle histoire ». Quelqu'un qui assume son intention est généralement sérieux.",
      "3. Des photos réelles et variées, avec le badge vérifié. Méfie-toi des photos dignes d'un magazine sans aucune photo du quotidien.",
      "4. Une cohérence entre les infos : ville, âge, métier et bio doivent raconter la même histoire.",
      "5. Un rythme d'échange sain : la personne répond régulièrement sans te mettre la pression pour passer sur une autre appli dès le premier message.",
      "6. Aucune demande d'argent, de codes ou de documents. C'est LA règle : au moindre doute, signale le profil via la page contact.",
    ],
  },
  {
    slug: "comprendre-le-matching",
    title: "Comprendre le matching : comment SWIVV calcule ta compatibilité",
    excerpt: "Score de compatibilité, likes, matchs réciproques : tout ce qui se passe entre ton inscription et ta première conversation.",
    category: "Conseils",
    author: "Équipe SWIVV",
    date: "2026-09-12",
    readTime: "5 min",
    thumbnail: "/matching-banner.svg",
    content: [
      "Sur SWIVV, le matching n'est pas un tirage au sort : chaque profil affiche un score de compatibilité, et un match ouvre la conversation. Voici comment tout cela fonctionne, étape par étape.",
      "1. Le score de compatibilité. Chaque profil affiche un pourcentage calculé sur ta ville, ton âge, tes centres d'intérêt, ta religion et ton intention (relation sérieuse, mariage, belle histoire…). Plus vos critères se recoupent, plus le score grimpe.",
      "L'ordre d'importance dans le calcul. Tous les critères ne pèsent pas pareil : le pays compte le plus, puis la ville, puis la distance (plus c'est proche, mieux c'est noté), puis le statut matrimonial, puis ton intention et la religion à égalité, puis la taille, le poids, le fait d'avoir des enfants, celui d'en vouloir, et enfin le fait d'accepter de déménager. Les autres critères (centres d'intérêt, langues, style de vie…) comptent chacun pour un point.",
      "2. Le tri par compatibilité. Sur la page Découvrir, le tri « Compatibilité » affiche en premier les profils les plus compatibles avec toi. Tu peux aussi filtrer par intention, par âge ou par statut en ligne pour affiner la sélection.",
      "3. Le like, puis le match. Tu likes les profils qui te plaisent. Quand l'intérêt est réciproque, cela devient un match : la conversation s'ouvre dans Messages, et le premier message de chaque conversation est offert.",
      "4. Pourquoi certains profils remontent. Les profils vérifiés, avec 3 photos nettes, une bio honnête et une intention claire, sont mieux classés et reçoivent plus de likes. Les nouveaux membres portent un badge « Nouveau » pour être repérés facilement.",
      "5. Améliore tes matchs. Complète ton profil à 100 %, indique ton intention réelle et ajoute tes centres d'intérêt : chaque information affine ton score avec les bonnes personnes.",
      "Pas encore de match ? Élargis un peu tes filtres d'âge ou de distance, like chaque jour quelques profils compatibles, et personnalise ton premier message : c'est lui qui transforme un match en conversation.",
    ],
  },
  {
    slug: "temoignages-maries-grace-swivv",
    title: "Témoignages : ils se sont dit oui grâce à SWIVV",
    excerpt: "Emma & Karim, Aïcha & Mehdi, Léa & Maxime : trois histoires vraies de couples nés sur SWIVV.",
    category: "Témoignages",
    author: "Équipe SWIVV",
    date: "2026-08-01",
    readTime: "6 min",
    thumbnail: "/testimony-rating-banner.svg", // ponytail: flat static SVG, richer testimonial art if it outperforms
    content: [
      "Chaque mois, des centaines de matchs naissent sur SWIVV. Voici trois histoires de membres qui ont accepté de les raconter.",
      "Leur conseil commun ? Soigne ton profil, sois honnête sur ton intention, et ose le premier message. La prochaine histoire racontée ici sera peut-être la tienne.",
      "Tu t'es rencontré(e) sur SWIVV ? Raconte ton histoire avec le bouton ci-dessous.",
    ],
    testimonials: [
      {
        names: "Emma & Karim",
        place: "Paris",
        quote:
          "On a matché à 92 % de compatibilité. J'ai aimé sa bio honnête, il a aimé mes photos de voyage. Trois mois plus tard, on emménageait ensemble.",
      },
      {
        names: "Aïcha & Mehdi",
        place: "Paris",
        quote:
          "On cherchait tous les deux le mariage, avec nos familles impliquées. Nos parents se sont rencontrés au bout de deux mois. Le mariage est prévu au printemps.",
      },
      {
        names: "Léa & Maxime",
        place: "Nice",
        quote:
          "J'ai liké sa photo de surf un dimanche soir. Premier rendez-vous : cours de salsa et glace sur la Prom'. On ne s'est plus quittés.",
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

// ponytail: CSS filter variant, dedicated SVG banner per post if branding needs it
export function getBannerStyle(slug: string): { filter: string } | undefined {
  return slug === "relation-serieuse-signes-profil-fiable"
    ? { filter: "hue-rotate(-18deg) saturate(1.15)" }
    : slug === "photos-profil-erreurs-matchs"
      ? { filter: "hue-rotate(12deg) saturate(1.1)" }
      : undefined;
}

export function getCategories(): string[] {
  return Array.from(new Set(BLOG_POSTS.map((p) => p.category)));
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const post = getPostBySlug(slug);
  if (!post) return [];
  return BLOG_POSTS
    .filter((p) => p.slug !== slug)
    .sort((a, b) => {
      const aMatch = a.category === post.category ? 1 : 0;
      const bMatch = b.category === post.category ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, limit);
}
