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
    slug: "reussir-premier-rendez-vous-conseils",
    title: "Réussir son premier rendez-vous amoureux : les conseils pour séduire, être soi-même et construire une belle histoire",
    excerpt: "Comment s'habiller, quels sujets aborder, quelles erreurs éviter — et pourquoi il faut parfois oser sortir de ses habitudes pour trouver l'amour.",
    category: "Conseils",
    author: "Équipe SWIVV",
    date: "2026-10-11",
    readTime: "12 min",
    thumbnail: "/hearts-love-banner.svg", // ponytail: unused hearts-family banner — similar to hearts-banner without duplicating it
    content: [
      "Comment s'habiller, quels sujets aborder, quelles erreurs éviter et pourquoi il faut parfois oser sortir de ses habitudes pour trouver l'amour ?",
      "Le premier rendez-vous est souvent un mélange d'excitation, d'impatience et de stress. On veut faire bonne impression, trouver les bons mots, éviter les silences gênants et, surtout, donner envie à l'autre de nous revoir.",
      "Mais au fond, une belle rencontre ne repose ni sur une tenue parfaite, ni sur des phrases toutes faites, ni sur une technique de séduction miracle. Elle commence par quelque chose de beaucoup plus simple : deux personnes qui acceptent de se découvrir, sans jouer un rôle.",
      "Que tu sois célibataire depuis quelques semaines ou plusieurs années, voici nos conseils pour aborder tes rendez-vous avec confiance, authenticité et ouverture d'esprit.",
      "1. Comment bien s'habiller pour un premier rendez-vous ?",
      "Ta tenue est l'une des premières choses que l'autre personne remarquera, mais elle ne doit pas devenir une source de pression. L'objectif n'est pas de ressembler à quelqu'un d'autre : il est de montrer le meilleur de toi-même tout en restant fidèle à ta personnalité.",
      "Pour les hommes : privilégie une chemise bien coupée, un polo élégant ou un joli pull, associé à un pantalon propre et bien ajusté. Choisis des chaussures propres et adaptées au lieu du rendez-vous. Soigne ta barbe, ta coiffure, tes ongles et ton haleine. Utilise ton parfum avec modération : quelques touches suffisent.",
      "Pour les femmes : opte pour une tenue dans laquelle tu te sens belle, confortable et confiante. Une robe élégante, un jean bien coupé avec un joli haut ou une tenue décontractée chic peuvent parfaitement convenir. Choisis des accessoires qui reflètent ta personnalité sans en faire trop. Accorde de l'attention à ta coiffure et aux petits détails qui te font te sentir bien.",
      "Le conseil qui vaut pour tout le monde : adapte ta tenue au rendez-vous. On ne s'habille pas nécessairement de la même manière pour un café en terrasse, une promenade au bord de l'eau ou un dîner dans un restaurant élégant.",
      "Et surtout, n'essaie pas de devenir quelqu'un d'autre pour plaire. La bonne personne doit pouvoir t'apprécier pour ce que tu es réellement, que tu sois un homme ou une femme.",
      "2. Quels sujets aborder pour faire naître une belle connexion ?",
      "Une conversation réussie n'est pas un interrogatoire. C'est un échange dans lequel chacun a envie de parler, d'écouter et d'en apprendre davantage sur l'autre. Pour commencer, privilégie les sujets simples, positifs et suffisamment ouverts pour permettre une véritable discussion.",
      "Les sujets qui rapprochent.",
      "Les voyages et les découvertes : « Quel endroit aimerais-tu absolument visiter un jour ? » ou « Quel est le plus beau souvenir de voyage que tu gardes ? » Les voyages permettent de découvrir les envies, la curiosité et parfois les rêves de l'autre.",
      "Les passions et les loisirs : « Qu'est-ce qui te fait vraiment perdre la notion du temps ? » ou « Comment aimes-tu occuper tes week-ends ? » Tu découvriras peut-être une passion commune, ou une activité que tu auras envie de partager.",
      "La cuisine et les plaisirs simples : « Quel est ton plat préféré ? » ou « Tu préfères un bon restaurant, un repas fait maison ou un pique-nique improvisé ? » Les sujets du quotidien peuvent sembler anodins, mais ils révèlent souvent les petites choses qui rendent la vie agréable.",
      "L'humour et les anecdotes : une histoire amusante, un souvenir embarrassant raconté avec autodérision ou une situation inattendue peuvent détendre l'atmosphère. Rire ensemble ne garantit pas une histoire d'amour, mais cela peut aider à créer une complicité naturelle.",
      "Les rêves et les projets : « Y a-t-il quelque chose que tu aimerais accomplir dans les prochaines années ? » ou « À quoi ressemble, pour toi, une journée idéale ? » Ces questions permettent de découvrir ce qui motive l'autre, sans lui demander immédiatement de dévoiler toute son intimité.",
      "Et si un silence s'installe ? Pas de panique ! Un silence de quelques secondes n'est pas un échec. Tu n'as pas besoin de parler sans interruption pour prouver que le courant passe. Rebondis sur un détail de la conversation, pose une question sincère ou profite simplement du moment. Une relation agréable doit laisser de la place aux mots, mais aussi aux silences confortables.",
      "3. Les sujets à éviter… ou à aborder avec tact",
      "Il n'existe pas de liste universelle de sujets interdits. Tout dépend du contexte, de la sensibilité de chacun et de la confiance qui s'installe. Cependant, lors d'un premier rendez-vous, certains sujets méritent d'être abordés avec davantage de délicatesse.",
      "Évite de transformer le rendez-vous en entretien d'embauche. Enchaîner les questions sur le salaire, le logement, le travail, la situation familiale et les projets de mariage peut donner à l'autre l'impression de devoir passer un examen.",
      "Ne passe pas toute la soirée à parler de ton ex. Il est normal d'avoir un passé amoureux. Mais comparer constamment la personne en face de toi à ton ancien partenaire risque de l'empêcher de trouver sa propre place.",
      "Évite les critiques et les jugements prématurés. Se moquer des goûts, du physique, du mode de vie ou des opinions de l'autre ne crée pas une atmosphère de confiance.",
      "Ne transforme pas la conversation en débat conflictuel. La politique, la religion et les sujets de société peuvent être importants, notamment lorsque les valeurs sont essentielles pour toi. Il n'est pas nécessaire de les fuir, mais mieux vaut les aborder avec respect et curiosité plutôt qu'avec la volonté d'avoir raison.",
      "Ne pose pas de questions trop intimes sans avoir établi de confiance. Les détails sur la vie sexuelle, les traumatismes, les difficultés financières ou les problèmes familiaux peuvent attendre que chacun se sente prêt à les partager. Enfin, évite de monopoliser la conversation. Parler de soi est naturel, mais écouter avec attention est tout aussi séduisant, que tu sois un homme ou une femme.",
      "4. L'honnêteté : la meilleure base pour une relation durable",
      "Lorsque l'on souhaite plaire, la tentation peut être grande d'embellir légèrement la réalité : se présenter comme plus sportif ou sportive, plus fortuné(e), plus disponible ou plus sûr(e) de soi que l'on ne l'est réellement. Pourtant, une relation construite sur une image artificielle risque de devenir épuisante.",
      "Tu n'as pas besoin d'être parfait(e) pour être aimé(e). Tu as besoin d'être sincère. Sois honnête sur ton âge, ta situation familiale, tes intentions et les aspects importants de ta vie. Si tu recherches une relation sérieuse, dis-le. Si tu préfères prendre ton temps, exprime-le également.",
      "Cela ne signifie pas que tu dois tout raconter dès le premier rendez-vous. Tu as le droit de préserver ton intimité et de partager certaines expériences lorsque la confiance s'est installée. L'essentiel est de ne pas entretenir volontairement une fausse impression sur un élément important pour ton partenaire.",
      "L'honnêteté permet de gagner du temps, d'éviter les déceptions et de rencontrer des personnes qui t'apprécient pour ce que tu es vraiment. Et n'oublie pas : toi aussi, tu as le droit de poser des questions et de vérifier que la personne en face de toi partage tes valeurs.",
      "5. Ne ferme pas la porte à une personne qui a des enfants",
      "Voici un conseil qui mérite une attention particulière : ne rejette pas automatiquement une personne simplement parce qu'elle est déjà parent. Il est compréhensible d'avoir des interrogations. Tu peux te demander si tu auras suffisamment de temps à deux, quelle sera ta place dans la vie familiale ou comment une éventuelle relation évoluera. Ces questions sont légitimes et méritent des réponses honnêtes.",
      "Mais derrière le mot « parent », il y a avant tout une personne : quelqu'un qui peut être drôle, tendre, attentionné(e), passionné(e), fidèle à ses valeurs et capable de construire une relation magnifique. Avoir des enfants ne signifie pas avoir moins d'amour à donner. Cela peut aussi témoigner d'une expérience de vie, d'un sens des responsabilités et d'une compréhension particulière de l'engagement.",
      "Et si cette rencontre t'apportait une nouvelle forme de bonheur ? En apprenant à connaître quelqu'un qui a des enfants, tu pourrais découvrir une vie plus riche que tu ne l'imaginais : des moments de complicité, des repas animés, des fêtes de famille, des rires spontanés et de nouveaux souvenirs à construire.",
      "Avec le temps, si la relation devient sérieuse et que chacun le souhaite, tu pourrais également développer un lien précieux avec ses enfants. Bien entendu, cela ne signifie pas que tu dois devenir immédiatement un parent de substitution, ni que toutes les familles recomposées sont simples à vivre. Les enfants ont leurs besoins, leur rythme et leurs propres émotions. La relation avec eux doit se construire progressivement, avec respect, patience et sans forcer les choses.",
      "Il est également important de discuter avec ton partenaire de ses disponibilités, de l'organisation familiale, de la place de l'autre parent et des attentes de chacun. Si tu sais que tu ne souhaites absolument pas avoir de rôle dans une vie familiale avec des enfants, sois honnête à ce sujet. Personne ne doit se sentir obligé d'accepter une situation qui ne lui correspond pas.",
      "En revanche, si ton hésitation vient surtout de la peur de l'inconnu, pourquoi ne pas prendre le temps de découvrir la personne avant de décider ? L'amour ne se présente pas toujours sous la forme que l'on avait imaginée. Parfois, il nous ouvre une porte vers un bonheur auquel nous n'avions simplement pas pensé.",
      "6. Ne te fie pas uniquement aux photos ou aux premières impressions",
      "L'attirance physique compte pour beaucoup de personnes, et il n'y a aucune raison de culpabiliser à ce sujet. Mais elle n'est qu'une partie de l'histoire. Une photo ne révèle pas la façon dont une personne t'écoute, son humour, sa générosité, sa sensibilité ou la manière dont elle te fait te sentir en sa présence.",
      "De même, quelqu'un qui semble réservé(e) lors des premières minutes peut se révéler passionnant(e) une fois en confiance. À l'inverse, une personne très séduisante et particulièrement à l'aise peut ne pas partager tes attentes. Essaie donc de ne pas prendre une décision définitive après quelques secondes, à moins, bien sûr, que tu ne ressentes pas d'attirance ou que quelque chose te mette mal à l'aise.",
      "Donne une chance aux échanges authentiques. Une compatibilité profonde se découvre parfois avec le temps.",
      "7. Apprends à reconnaître ce qui compte vraiment chez l'autre",
      "Au-delà de l'apparence, demande-toi comment tu te sens lorsque tu es avec cette personne. Peux-tu être toi-même ? Te sens-tu écouté(e) et respecté(e) ? Ton humour est-il apprécié ? Tes valeurs sont-elles compatibles ? Tes attentes concernant le couple, la fidélité, l'engagement ou la famille peuvent-elles s'accorder ?",
      "Il n'est pas nécessaire d'avoir les mêmes goûts pour tout partager. Deux personnes peuvent aimer des musiques différentes, pratiquer des activités distinctes et avoir des personnalités complémentaires. En revanche, le respect, la confiance, la communication et la compatibilité sur les sujets essentiels constituent de bonnes bases pour une relation épanouissante.",
      "Ne cherche pas quelqu'un qui coche toutes les cases d'une liste imaginaire. Cherche plutôt quelqu'un avec qui tu as envie de construire quelque chose de réel.",
      "8. Sois attentif ou attentive aux signaux positifs… et aux signaux d'alerte",
      "Une belle rencontre doit te permettre de te sentir respecté(e) et libre d'être toi-même. Parmi les signes encourageants : une écoute réciproque et un intérêt sincère, le respect de tes limites et de tes opinions, une communication claire même lorsqu'il existe des désaccords, une cohérence entre les paroles et les actes, et la possibilité de dire non sans subir de pression.",
      "À l'inverse, méfie-toi d'une personne qui te rabaisse, te pousse à aller trop vite, tente de contrôler tes fréquentations ou exige de l'argent. Sur un site de rencontres, protège également tes informations personnelles. Pour un premier rendez-vous, choisis un lieu public, préviens une personne de confiance et organise ton propre moyen de transport. Ne partage jamais tes coordonnées bancaires ou des informations sensibles avec quelqu'un que tu connais à peine.",
      "La confiance se construit progressivement. Tu n'as pas à sacrifier ta sécurité pour prouver ton intérêt.",
      "9. Après le rendez-vous, communique simplement",
      "Tu as passé une belle soirée ? Dis-le ! Un message sincère, sans stratégie compliquée, suffit souvent : « J'ai passé un très bon moment avec toi. J'ai beaucoup apprécié notre conversation et j'aimerais te revoir. »",
      "Si tu as besoin de temps pour réfléchir, tu peux également le dire avec respect. Et si tu ne ressens pas de connexion amoureuse, inutile de disparaître sans explication lorsque tu peux répondre simplement et avec bienveillance.",
      "Tu n'es pas obligé(e) de donner une seconde chance à quelqu'un si tu ne le souhaites pas. Mais tu peux mettre fin à un échange sans humilier l'autre personne. Ne cherche pas non plus à interpréter chaque minute d'attente avant une réponse ou chaque message. Les relations ne sont pas des jeux dans lesquels celui ou celle qui montre le moins d'intérêt gagne.",
      "Une communication honnête et équilibrée te permettra de mieux comprendre si l'envie de poursuivre est réciproque.",
      "10. Ose sortir de tes habitudes",
      "Il est naturel d'avoir des préférences. Certaines personnes sont attirées par des personnalités extraverties, d'autres par des personnes calmes. Certaines imaginent une relation avec quelqu'un qui partage toutes leurs passions, tandis que d'autres apprécient les différences. Mais attention à ne pas transformer tes préférences en barrières systématiques.",
      "Tu as toujours fréquenté le même type de personnes ? Essaie peut-être d'échanger avec quelqu'un qui possède une personnalité différente. Tu penses qu'une personne qui vit loin de chez toi ne pourrait jamais te convenir ? Discute d'abord de tes possibilités et de tes attentes.",
      "Tu as écarté des profils parce qu'ils ont des enfants, un parcours différent du tien ou des centres d'intérêt inattendus ? Prends un instant pour te demander si ces critères sont réellement incompatibles avec ton bonheur. Cela ne signifie pas qu'il faut ignorer ses limites ou accepter une relation qui ne nous convient pas. Cela signifie simplement qu'il est parfois utile de distinguer ce qui est essentiel de ce qui relève de nos habitudes.",
      "Reste fidèle à tes valeurs, mais laisse à la vie la possibilité de te surprendre.",
      "11. Ne cherche pas à tout prix à être en couple",
      "Le célibat n'est pas un échec, et être en couple n'est pas une garantie de bonheur. Profite de ta vie, entretiens tes amitiés, découvre de nouvelles activités et prends soin de toi. Plus tu apprends à te connaître, plus tu es susceptible de comprendre ce que tu recherches réellement dans une relation.",
      "N'accepte pas une histoire uniquement par peur de la solitude ou parce que tu as l'impression que le temps passe. Tu mérites une relation dans laquelle tu te sens bien, tout comme l'autre personne mérite d'être choisie pour ce qu'elle est, et non simplement pour combler un vide.",
      "L'amour ne consiste pas à trouver quelqu'un qui résoudra tous tes problèmes. Il consiste à rencontrer une personne avec laquelle tu pourras partager tes joies, traverser les difficultés et construire un avenir qui te ressemble.",
      "12. Et si ta prochaine belle histoire commençait aujourd'hui ?",
      "Faire une rencontre demande parfois de la patience. Il peut y avoir des conversations qui n'aboutissent pas, des rendez-vous décevants ou des personnes avec lesquelles la connexion ne se crée tout simplement pas. Ne laisse pas ces expériences te convaincre que l'amour n'est pas fait pour toi.",
      "Chaque échange est une occasion d'apprendre à mieux te connaître, d'affiner tes attentes et de découvrir ce qui te rend heureux ou heureuse. Reste curieux ou curieuse. Sois honnête. Prends le temps d'écouter. Respecte tes limites et celles des autres. Et surtout, ne laisse pas tes peurs décider systématiquement à ta place.",
      "La plus belle rencontre n'est pas nécessairement celle qui commence par un coup de foudre spectaculaire. C'est parfois celle qui grandit doucement, au fil des conversations, des petites attentions et de la confiance partagée.",
      "Le mot de SWIVV MATCH : chez SWIVV MATCH, nous croyons que chaque personne a une histoire qui mérite d'être découverte. Ne recherche pas seulement le profil parfait. Recherche une connexion sincère, une complicité naturelle et une personne avec laquelle tu pourras être pleinement toi-même.",
      "Ne promets pas d'être parfait(e). Sois vrai(e). Ne cherche pas à impressionner à tout prix. Cherche à comprendre et à être compris(e). Et n'oublie jamais : une belle histoire peut commencer là où tu ne l'attendais pas.",
      "SWIVV MATCH — Your Match. Your Story. Ta prochaine belle rencontre pourrait être plus proche que tu ne le penses.",
    ],
  },
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
      "7. Si pas de réponse après 2-3 jours, une seule relance polie suffit. Au-delà, passe au profil suivant : d'autres personnes à découvrir t'attendent.",
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
      "5. Une seule photo. Les profils avec plusieurs photos (jusqu'à 5) reçoivent nettement plus de likes : un portrait, une photo en activité (sport, cuisine, voyage) et une photo du quotidien.",
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
      "Sur SWIVV, le matching n'est pas un tirage au sort : chaque profil affiche un score de compatibilité, un like réciproque devient un match annoncé aux deux membres, et la conversation s'ouvre par une demande de connexion acceptée. Voici comment tout cela fonctionne, étape par étape.",
      "1. Le score de compatibilité. Chaque profil affiche un pourcentage calculé sur ta ville, ton âge, tes centres d'intérêt, ta religion et ton intention (relation sérieuse, mariage, belle histoire…). Plus tes critères se recoupent, plus le score grimpe.",
      "L'ordre d'importance dans le calcul. Tous les critères ne pèsent pas pareil : le pays compte le plus, puis la ville, puis la distance (plus c'est proche, mieux c'est noté), puis le statut matrimonial, puis ton intention et la religion à égalité, puis la taille, le poids, le fait d'avoir des enfants, celui d'en vouloir, et enfin le fait d'accepter de déménager. Les autres critères (centres d'intérêt, langues, style de vie…) comptent chacun pour un point.",
      "2. Le tri par compatibilité. Sur la page Découvrir, le tri « Compatibilité » affiche en premier les profils les plus compatibles avec toi. Tu peux aussi filtrer par intention, par âge ou par statut en ligne pour affiner la sélection.",
      "3. Le like, puis le match. Tu likes les profils qui te plaisent. Quand l'intérêt est réciproque, un match est annoncé aux deux membres par une notification et un message à l'écran. Ce match ne débloque pas la conversation : pour discuter, envoie une demande de connexion. Si elle est acceptée, l'autre membre choisit ce qu'il autorise : texte, vocaux et pièces jointes. Tout cela est gratuit, sans limite.",
      "4. Pourquoi certains profils remontent. Les profils vérifiés, avec plusieurs photos nettes (5 maximum), une bio honnête et une intention claire, sont mieux classés et reçoivent plus de likes. Les nouveaux membres portent un badge « Nouveau » pour être repérés facilement.",
      "5. Améliore tes matchs. Complète ton profil à 100 %, indique ton intention réelle et ajoute tes centres d'intérêt : chaque information affine ton score avec les bonnes personnes.",
      "Pas encore de match ? Élargis un peu tes filtres d'âge ou de distance, like chaque jour quelques profils compatibles, et personnalise ton premier message : c'est lui qui transforme un match en conversation.",
    ],
  },
  {
    slug: "arnaques-amoureuses-signaux-alerte",
    title: "Arnaques amoureuses : 8 signaux d'alerte à repérer avant de faire confiance",
    excerpt: "Déclarations trop rapides, appels vidéo évités, demandes d'argent : les 8 signaux d'alerte à connaître pour faire des rencontres en ligne en toute sécurité.",
    category: "Sécurité",
    author: "Équipe SWIVV",
    date: "2026-10-12",
    readTime: "8 min",
    thumbnail: "/hearts-trust-banner.svg",
    content: [
      "Les rencontres en ligne offrent de belles opportunités de trouver l'amour, de créer des liens sincères et de rencontrer des personnes qui nous correspondent. Mais pour profiter pleinement de cette expérience, il est important de savoir reconnaître les comportements suspects et de protéger ses informations personnelles.",
      "Sur SWIVV MATCH, nous encourageons les célibataires à faire des rencontres dans un climat de respect, de confiance et de sécurité. Voici 8 signaux d'alerte à connaître pour avancer sereinement dans ta recherche amoureuse.",
      "1. Une personne qui tombe amoureuse beaucoup trop vite",
      "Tu viens à peine de commencer à discuter et cette personne te parle déjà d'amour véritable, de mariage ou d'un avenir commun. Les sentiments peuvent naître rapidement, mais des déclarations très intenses dès les premiers échanges peuvent aussi être une technique de manipulation.",
      "Notre conseil : prends le temps de découvrir l'autre personne et laisse la relation évoluer naturellement.",
      "2. Des excuses répétées pour éviter les appels vidéo",
      "Ton interlocuteur trouve toujours une raison pour éviter un appel vidéo ou une conversation en direct. Une personne peut être timide ou avoir besoin de temps, mais des excuses répétées et incohérentes méritent ton attention.",
      "Notre conseil : privilégie une rencontre vidéo lorsque tu te sens à l'aise, avant d'investir trop émotionnellement dans la relation.",
      "3. Une demande d'argent, même présentée comme urgente",
      "C'est l'un des signaux d'alerte les plus importants. La personne te raconte une urgence médicale, un problème bancaire, un voyage impossible à financer ou une situation familiale dramatique.",
      "Notre conseil : n'envoie jamais d'argent à une personne que tu n'as pas suffisamment appris à connaître, même si son histoire semble bouleversante.",
      "4. Des incohérences dans son histoire personnelle",
      "Son âge, son métier, sa situation familiale ou son lieu de résidence changent au fil des conversations. De petites erreurs sont possibles, mais des contradictions répétées peuvent révéler une identité inventée.",
      "Notre conseil : pose des questions simples et observe si les réponses restent cohérentes dans le temps.",
      "5. Une pression pour quitter rapidement la plateforme",
      "Ton interlocuteur insiste pour passer immédiatement sur une autre application ou te demande de communiquer par un canal où tu te sens moins en sécurité.",
      "Notre conseil : ne te précipite pas. Prends le temps de vérifier que tu peux faire confiance à cette personne et utilise les fonctionnalités de signalement disponibles sur la plateforme.",
      "6. Des demandes de photos intimes ou de documents personnels",
      "Une personne te demande des photos intimes, ton adresse exacte, une copie de ta pièce d'identité ou des informations bancaires.",
      "Notre conseil : ne partage jamais de documents sensibles ni de contenus intimes sous la pression. Certaines informations peuvent être utilisées pour te faire chanter ou usurper ton identité.",
      "7. Une personne qui cherche à t'isoler ou à te culpabiliser",
      "Elle te reproche de ne pas répondre assez vite, te demande de garder ta relation secrète ou tente de t'éloigner de tes proches. Ces comportements peuvent être des signes de contrôle ou de manipulation émotionnelle.",
      "Notre conseil : une relation saine respecte ton indépendance, tes limites et ton entourage.",
      "8. Un comportement agressif lorsque tu poses des limites",
      "Tu refuses une demande et la personne devient insultante, menaçante ou te fait culpabiliser. Le respect est indispensable, même lorsque deux personnes ne sont pas d'accord.",
      "Notre conseil : ne te sens jamais obligé de poursuivre une conversation qui te met mal à l'aise. Tu peux interrompre les échanges, bloquer le profil et le signaler si nécessaire.",
      "Comment faire des rencontres en ligne en toute sécurité ?",
      "Protège tes coordonnées personnelles et tes informations financières.",
      "Prends le temps de vérifier la cohérence du profil et des échanges.",
      "Méfie-toi des demandes d'argent et des promesses extraordinaires.",
      "Pour un premier rendez-vous, choisis un lieu public et informe un proche de tes plans.",
      "Organise ton propre transport et garde la possibilité de partir à tout moment.",
      "En cas de doute, interromps les échanges et utilise les outils de blocage et de signalement disponibles.",
      "SWIVV MATCH : des rencontres fondées sur le respect et la confiance",
      "Trouver l'amour ne devrait jamais t'obliger à renoncer à ta sécurité ou à tes limites personnelles. Une belle relation se construit progressivement, grâce à l'honnêteté, au respect mutuel et à des échanges sincères.",
      "Sur SWIVV MATCH, prends le temps de découvrir les personnes, de poser tes questions et de faire confiance à ton instinct sans négliger les faits.",
      "Ta prochaine belle rencontre commence par une chose essentielle : pouvoir être toi-même, en toute confiance.",
      "Tu remarques un comportement suspect sur SWIVV MATCH ? Utilise les fonctionnalités de blocage et de signalement disponibles sur la plateforme.",
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
