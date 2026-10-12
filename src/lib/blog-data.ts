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
      "Que vous soyez célibataire depuis quelques semaines ou plusieurs années, voici nos conseils pour aborder vos rendez-vous avec confiance, authenticité et ouverture d'esprit.",
      "1. Comment bien s'habiller pour un premier rendez-vous ?",
      "Votre tenue est l'une des premières choses que l'autre personne remarquera, mais elle ne doit pas devenir une source de pression. L'objectif n'est pas de ressembler à quelqu'un d'autre : il est de montrer le meilleur de vous-même tout en restant fidèle à votre personnalité.",
      "Pour les hommes : privilégiez une chemise bien coupée, un polo élégant ou un joli pull, associé à un pantalon propre et bien ajusté. Choisissez des chaussures propres et adaptées au lieu du rendez-vous. Soignez votre barbe, votre coiffure, vos ongles et votre haleine. Utilisez votre parfum avec modération : quelques touches suffisent.",
      "Pour les femmes : optez pour une tenue dans laquelle vous vous sentez belle, confortable et confiante. Une robe élégante, un jean bien coupé avec un joli haut ou une tenue décontractée chic peuvent parfaitement convenir. Choisissez des accessoires qui reflètent votre personnalité sans en faire trop. Accordez de l'attention à votre coiffure et aux petits détails qui vous font vous sentir bien.",
      "Le conseil qui vaut pour tout le monde : adaptez votre tenue au rendez-vous. On ne s'habille pas nécessairement de la même manière pour un café en terrasse, une promenade au bord de l'eau ou un dîner dans un restaurant élégant.",
      "Et surtout, n'essayez pas de devenir quelqu'un d'autre pour plaire. La bonne personne doit pouvoir vous apprécier pour ce que vous êtes réellement, que vous soyez un homme ou une femme.",
      "2. Quels sujets aborder pour faire naître une belle connexion ?",
      "Une conversation réussie n'est pas un interrogatoire. C'est un échange dans lequel chacun a envie de parler, d'écouter et d'en apprendre davantage sur l'autre. Pour commencer, privilégiez les sujets simples, positifs et suffisamment ouverts pour permettre une véritable discussion.",
      "Les sujets qui rapprochent.",
      "Les voyages et les découvertes : « Quel endroit aimeriez-vous absolument visiter un jour ? » ou « Quel est le plus beau souvenir de voyage que vous gardez ? » Les voyages permettent de découvrir les envies, la curiosité et parfois les rêves de l'autre.",
      "Les passions et les loisirs : « Qu'est-ce qui vous fait vraiment perdre la notion du temps ? » ou « Comment aimez-vous occuper vos week-ends ? » Vous découvrirez peut-être une passion commune, ou une activité que vous aurez envie de partager.",
      "La cuisine et les plaisirs simples : « Quel est votre plat préféré ? » ou « Vous préférez un bon restaurant, un repas fait maison ou un pique-nique improvisé ? » Les sujets du quotidien peuvent sembler anodins, mais ils révèlent souvent les petites choses qui rendent la vie agréable.",
      "L'humour et les anecdotes : une histoire amusante, un souvenir embarrassant raconté avec autodérision ou une situation inattendue peuvent détendre l'atmosphère. Rire ensemble ne garantit pas une histoire d'amour, mais cela peut aider à créer une complicité naturelle.",
      "Les rêves et les projets : « Y a-t-il quelque chose que vous aimeriez accomplir dans les prochaines années ? » ou « À quoi ressemble, pour vous, une journée idéale ? » Ces questions permettent de découvrir ce qui motive l'autre, sans lui demander immédiatement de dévoiler toute son intimité.",
      "Et si un silence s'installe ? Pas de panique ! Un silence de quelques secondes n'est pas un échec. Vous n'avez pas besoin de parler sans interruption pour prouver que le courant passe. Rebondissez sur un détail de la conversation, posez une question sincère ou profitez simplement du moment. Une relation agréable doit laisser de la place aux mots, mais aussi aux silences confortables.",
      "3. Les sujets à éviter… ou à aborder avec tact",
      "Il n'existe pas de liste universelle de sujets interdits. Tout dépend du contexte, de la sensibilité de chacun et de la confiance qui s'installe. Cependant, lors d'un premier rendez-vous, certains sujets méritent d'être abordés avec davantage de délicatesse.",
      "Évitez de transformer le rendez-vous en entretien d'embauche. Enchaîner les questions sur le salaire, le logement, le travail, la situation familiale et les projets de mariage peut donner à l'autre l'impression de devoir passer un examen.",
      "Ne passez pas toute la soirée à parler de votre ex. Il est normal d'avoir un passé amoureux. Mais comparer constamment la personne en face de vous à votre ancien partenaire risque de l'empêcher de trouver sa propre place.",
      "Évitez les critiques et les jugements prématurés. Se moquer des goûts, du physique, du mode de vie ou des opinions de l'autre ne crée pas une atmosphère de confiance.",
      "Ne transformez pas la conversation en débat conflictuel. La politique, la religion et les sujets de société peuvent être importants, notamment lorsque les valeurs sont essentielles pour vous. Il n'est pas nécessaire de les fuir, mais mieux vaut les aborder avec respect et curiosité plutôt qu'avec la volonté d'avoir raison.",
      "Ne posez pas de questions trop intimes sans avoir établi de confiance. Les détails sur la vie sexuelle, les traumatismes, les difficultés financières ou les problèmes familiaux peuvent attendre que chacun se sente prêt à les partager. Enfin, évitez de monopoliser la conversation. Parler de soi est naturel, mais écouter avec attention est tout aussi séduisant, que vous soyez un homme ou une femme.",
      "4. L'honnêteté : la meilleure base pour une relation durable",
      "Lorsque l'on souhaite plaire, la tentation peut être grande d'embellir légèrement la réalité : se présenter comme plus sportif ou sportive, plus fortuné(e), plus disponible ou plus sûr(e) de soi que l'on ne l'est réellement. Pourtant, une relation construite sur une image artificielle risque de devenir épuisante.",
      "Vous n'avez pas besoin d'être parfait(e) pour être aimé(e). Vous avez besoin d'être sincère. Soyez honnête sur votre âge, votre situation familiale, vos intentions et les aspects importants de votre vie. Si vous recherchez une relation sérieuse, dites-le. Si vous préférez prendre votre temps, exprimez-le également.",
      "Cela ne signifie pas que vous devez tout raconter dès le premier rendez-vous. Vous avez le droit de préserver votre intimité et de partager certaines expériences lorsque la confiance s'est installée. L'essentiel est de ne pas entretenir volontairement une fausse impression sur un élément important pour votre partenaire.",
      "L'honnêteté permet de gagner du temps, d'éviter les déceptions et de rencontrer des personnes qui vous apprécient pour ce que vous êtes vraiment. Et n'oubliez pas : vous aussi, vous avez le droit de poser des questions et de vérifier que la personne en face de vous partage vos valeurs.",
      "5. Ne fermez pas la porte à une personne qui a des enfants",
      "Voici un conseil qui mérite une attention particulière : ne rejetez pas automatiquement une personne simplement parce qu'elle est déjà parent. Il est compréhensible d'avoir des interrogations. Vous pouvez vous demander si vous aurez suffisamment de temps à deux, quelle sera votre place dans la vie familiale ou comment une éventuelle relation évoluera. Ces questions sont légitimes et méritent des réponses honnêtes.",
      "Mais derrière le mot « parent », il y a avant tout une personne : quelqu'un qui peut être drôle, tendre, attentionné(e), passionné(e), fidèle à ses valeurs et capable de construire une relation magnifique. Avoir des enfants ne signifie pas avoir moins d'amour à donner. Cela peut aussi témoigner d'une expérience de vie, d'un sens des responsabilités et d'une compréhension particulière de l'engagement.",
      "Et si cette rencontre vous apportait une nouvelle forme de bonheur ? En apprenant à connaître quelqu'un qui a des enfants, vous pourriez découvrir une vie plus riche que vous ne l'imaginiez : des moments de complicité, des repas animés, des fêtes de famille, des rires spontanés et de nouveaux souvenirs à construire.",
      "Avec le temps, si la relation devient sérieuse et que chacun le souhaite, vous pourriez également développer un lien précieux avec ses enfants. Bien entendu, cela ne signifie pas que vous devez devenir immédiatement un parent de substitution, ni que toutes les familles recomposées sont simples à vivre. Les enfants ont leurs besoins, leur rythme et leurs propres émotions. La relation avec eux doit se construire progressivement, avec respect, patience et sans forcer les choses.",
      "Il est également important de discuter avec votre partenaire de ses disponibilités, de l'organisation familiale, de la place de l'autre parent et des attentes de chacun. Si vous savez que vous ne souhaitez absolument pas avoir de rôle dans une vie familiale avec des enfants, soyez honnête à ce sujet. Personne ne doit se sentir obligé d'accepter une situation qui ne lui correspond pas.",
      "En revanche, si votre hésitation vient surtout de la peur de l'inconnu, pourquoi ne pas prendre le temps de découvrir la personne avant de décider ? L'amour ne se présente pas toujours sous la forme que l'on avait imaginée. Parfois, il nous ouvre une porte vers un bonheur auquel nous n'avions simplement pas pensé.",
      "6. Ne vous fiez pas uniquement aux photos ou aux premières impressions",
      "L'attirance physique compte pour beaucoup de personnes, et il n'y a aucune raison de culpabiliser à ce sujet. Mais elle n'est qu'une partie de l'histoire. Une photo ne révèle pas la façon dont une personne vous écoute, son humour, sa générosité, sa sensibilité ou la manière dont elle vous fait vous sentir en sa présence.",
      "De même, quelqu'un qui semble réservé(e) lors des premières minutes peut se révéler passionnant(e) une fois en confiance. À l'inverse, une personne très séduisante et particulièrement à l'aise peut ne pas partager vos attentes. Essayez donc de ne pas prendre une décision définitive après quelques secondes, à moins, bien sûr, que vous ne ressentiez pas d'attirance ou que quelque chose vous mette mal à l'aise.",
      "Donnez une chance aux échanges authentiques. Une compatibilité profonde se découvre parfois avec le temps.",
      "7. Apprenez à reconnaître ce qui compte vraiment chez l'autre",
      "Au-delà de l'apparence, demandez-vous comment vous vous sentez lorsque vous êtes avec cette personne. Pouvez-vous être vous-même ? Vous sentez-vous écouté(e) et respecté(e) ? Votre humour est-il apprécié ? Vos valeurs sont-elles compatibles ? Vos attentes concernant le couple, la fidélité, l'engagement ou la famille peuvent-elles s'accorder ?",
      "Il n'est pas nécessaire d'avoir les mêmes goûts pour tout partager. Deux personnes peuvent aimer des musiques différentes, pratiquer des activités distinctes et avoir des personnalités complémentaires. En revanche, le respect, la confiance, la communication et la compatibilité sur les sujets essentiels constituent de bonnes bases pour une relation épanouissante.",
      "Ne cherchez pas quelqu'un qui coche toutes les cases d'une liste imaginaire. Cherchez plutôt quelqu'un avec qui vous avez envie de construire quelque chose de réel.",
      "8. Soyez attentif ou attentive aux signaux positifs… et aux signaux d'alerte",
      "Une belle rencontre doit vous permettre de vous sentir respecté(e) et libre d'être vous-même. Parmi les signes encourageants : une écoute réciproque et un intérêt sincère, le respect de vos limites et de vos opinions, une communication claire même lorsqu'il existe des désaccords, une cohérence entre les paroles et les actes, et la possibilité de dire non sans subir de pression.",
      "À l'inverse, méfiez-vous d'une personne qui vous rabaisse, vous pousse à aller trop vite, tente de contrôler vos fréquentations ou exige de l'argent. Sur un site de rencontres, protégez également vos informations personnelles. Pour un premier rendez-vous, choisissez un lieu public, prévenez une personne de confiance et organisez votre propre moyen de transport. Ne partagez jamais vos coordonnées bancaires ou des informations sensibles avec quelqu'un que vous connaissez à peine.",
      "La confiance se construit progressivement. Vous n'avez pas à sacrifier votre sécurité pour prouver votre intérêt.",
      "9. Après le rendez-vous, communiquez simplement",
      "Vous avez passé une belle soirée ? Dites-le ! Un message sincère, sans stratégie compliquée, suffit souvent : « J'ai passé un très bon moment avec vous. J'ai beaucoup apprécié notre conversation et j'aimerais vous revoir. »",
      "Si vous avez besoin de temps pour réfléchir, vous pouvez également le dire avec respect. Et si vous ne ressentez pas de connexion amoureuse, inutile de disparaître sans explication lorsque vous pouvez répondre simplement et avec bienveillance.",
      "Vous n'êtes pas obligé(e) de donner une seconde chance à quelqu'un si vous ne le souhaitez pas. Mais vous pouvez mettre fin à un échange sans humilier l'autre personne. Ne cherchez pas non plus à interpréter chaque minute d'attente avant une réponse ou chaque message. Les relations ne sont pas des jeux dans lesquels celui ou celle qui montre le moins d'intérêt gagne.",
      "Une communication honnête et équilibrée vous permettra de mieux comprendre si l'envie de poursuivre est réciproque.",
      "10. Osez sortir de vos habitudes",
      "Il est naturel d'avoir des préférences. Certaines personnes sont attirées par des personnalités extraverties, d'autres par des personnes calmes. Certaines imaginent une relation avec quelqu'un qui partage toutes leurs passions, tandis que d'autres apprécient les différences. Mais attention à ne pas transformer vos préférences en barrières systématiques.",
      "Vous avez toujours fréquenté le même type de personnes ? Essayez peut-être d'échanger avec quelqu'un qui possède une personnalité différente. Vous pensez qu'une personne qui vit loin de chez vous ne pourrait jamais vous convenir ? Discutez d'abord de vos possibilités et de vos attentes.",
      "Vous avez écarté des profils parce qu'ils ont des enfants, un parcours différent du vôtre ou des centres d'intérêt inattendus ? Prenez un instant pour vous demander si ces critères sont réellement incompatibles avec votre bonheur. Cela ne signifie pas qu'il faut ignorer ses limites ou accepter une relation qui ne nous convient pas. Cela signifie simplement qu'il est parfois utile de distinguer ce qui est essentiel de ce qui relève de nos habitudes.",
      "Restez fidèle à vos valeurs, mais laissez à la vie la possibilité de vous surprendre.",
      "11. Ne cherchez pas à tout prix à être en couple",
      "Le célibat n'est pas un échec, et être en couple n'est pas une garantie de bonheur. Profitez de votre vie, entretenez vos amitiés, découvrez de nouvelles activités et prenez soin de vous. Plus vous apprenez à vous connaître, plus vous êtes susceptible de comprendre ce que vous recherchez réellement dans une relation.",
      "N'acceptez pas une histoire uniquement par peur de la solitude ou parce que vous avez l'impression que le temps passe. Vous méritez une relation dans laquelle vous vous sentez bien, tout comme l'autre personne mérite d'être choisie pour ce qu'elle est, et non simplement pour combler un vide.",
      "L'amour ne consiste pas à trouver quelqu'un qui résoudra tous vos problèmes. Il consiste à rencontrer une personne avec laquelle vous pourrez partager vos joies, traverser les difficultés et construire un avenir qui vous ressemble.",
      "12. Et si votre prochaine belle histoire commençait aujourd'hui ?",
      "Faire une rencontre demande parfois de la patience. Il peut y avoir des conversations qui n'aboutissent pas, des rendez-vous décevants ou des personnes avec lesquelles la connexion ne se crée tout simplement pas. Ne laissez pas ces expériences vous convaincre que l'amour n'est pas fait pour vous.",
      "Chaque échange est une occasion d'apprendre à mieux vous connaître, d'affiner vos attentes et de découvrir ce qui vous rend heureux ou heureuse. Restez curieux ou curieuse. Soyez honnête. Prenez le temps d'écouter. Respectez vos limites et celles des autres. Et surtout, ne laissez pas vos peurs décider systématiquement à votre place.",
      "La plus belle rencontre n'est pas nécessairement celle qui commence par un coup de foudre spectaculaire. C'est parfois celle qui grandit doucement, au fil des conversations, des petites attentions et de la confiance partagée.",
      "Le mot de SWIVV MATCH : chez SWIVV MATCH, nous croyons que chaque personne a une histoire qui mérite d'être découverte. Ne recherchez pas seulement le profil parfait. Recherchez une connexion sincère, une complicité naturelle et une personne avec laquelle vous pourrez être pleinement vous-même.",
      "Ne promettez pas d'être parfait(e). Soyez vrai(e). Ne cherchez pas à impressionner à tout prix. Cherchez à comprendre et à être compris(e). Et n'oubliez jamais : une belle histoire peut commencer là où vous ne l'attendiez pas.",
      "SWIVV MATCH — Your Match. Your Story. Votre prochaine belle rencontre pourrait être plus proche que vous ne le pensez.",
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
