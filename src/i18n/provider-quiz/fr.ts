import type { QuizQuestion } from "./types";

const fr: QuizQuestion[] = [
  {
    id: "dog-freeze",
    species: "dog",
    q: "Pendant une promenade, un chien se fige soudain, fixe un autre chien et hérisse son pelage. Que faites-vous en premier ?",
    options: [
      "Crier « NON ! » fort pour interrompre le comportement",
      "Créer calmement de la distance et détourner le chien de l'autre chien",
      "Marcher droit vers l'autre chien pour montrer qui dirige",
      "Caresser le chien répétitivement pour le rassurer",
    ],
    correct: 1,
    explain:
      "Se figer, fixer du regard et hérisser le pelage sont des signes de tension montante. La réponse la plus sûre est d'augmenter calmement la distance et de détourner l'attention.",
  },
  {
    id: "dog-calming",
    species: "dog",
    q: "Un inconnu tend la main pour caresser un chien. Le chien bâille, se lèche les babines et détourne la tête. Que vous dit-il ?",
    options: [
      "Il est fatigué et a sommeil",
      "Il a faim",
      "Il est stressé et demande de l'espace",
      "Il est joueur",
    ],
    correct: 2,
    explain:
      "Bâillements, léchage de babines et tête détournée sont des signaux d'apaisement classiques — le chien est mal à l'aise et souhaite que l'interaction cesse.",
  },
  {
    id: "dog-greeting",
    species: "dog",
    q: "Quelle est la façon la plus sûre d'aborder un chien inconnu ?",
    options: [
      "Approcher vite et caresser le dessus de sa tête",
      "Rester immobile, éviter le regard direct et laisser le chien approcher et vous sentir d'abord",
      "Faire des bruits aigus et excités pour montrer que vous êtes amical",
      "Tendre les bras et enlacer le chien pour montrer votre affection",
    ],
    correct: 1,
    explain:
      "Laisser le chien choisir d'approcher, avec une posture détendue et sans regard direct, lui donne le contrôle et évite les réactions de peur.",
  },
  {
    id: "dog-tail",
    species: "dog",
    q: "La queue d'un chien remue. Qu'est-ce que cela signifie ?",
    options: [
      "Le chien est toujours amical et content",
      "Le chien a forcément peur",
      "Un remuement de queue peut exprimer différentes émotions — il faut lire tout le corps et le contexte",
      "Le chien veut jouer à la balle",
    ],
    correct: 2,
    explain:
      "Remuer la queue exprime une excitation, pas forcément de la sympathie. Une queue haute, raide et rapide peut précéder une agression — lisez toujours l'ensemble du corps.",
  },
  {
    id: "dog-chocolate",
    species: "dog",
    q: "Un chien dont vous vous occupez a mangé du chocolat. Quelle est la bonne réaction ?",
    options: [
      "Attendre de voir si des symptômes apparaissent avant d'agir",
      "Lui donner beaucoup d'eau et son dîner habituel",
      "Lui faire vomir vous-même avec des remèdes maison",
      "Contacter immédiatement un vétérinaire ou une ligne d'urgence avec le type et la quantité ingérés",
    ],
    correct: 3,
    explain:
      "Le chocolat est toxique pour les chiens et les symptômes peuvent être retardés. La rapidité compte — appelez un vétérinaire immédiatement ; ne faites jamais vomir sans avis vétérinaire.",
  },
  {
    id: "cat-overstimulation",
    species: "cat",
    q: "Pendant une caresse, un chat fouette soudain sa queue rapidement et plaque ses oreilles en arrière. Que signifie cela ?",
    options: [
      "Le chat est surexcité — arrêtez les caresses et laissez-lui de l'espace",
      "Le chat ronronne et apprécie",
      "Le chat veut des caresses plus énergiques",
      "Le chat invite à jouer",
    ],
    correct: 0,
    explain:
      "Les coups de queue rapides et les oreilles plaquées sont des signaux d'alerte de surstimulation. Continuer peut provoquer griffure ou morsure.",
  },
  {
    id: "cat-petting",
    species: "cat",
    q: "Où la plupart des chats préfèrent-ils être caressés ?",
    options: [
      "Le ventre",
      "Les pattes",
      "La base de la queue",
      "Les joues, le menton et la base des oreilles",
    ],
    correct: 3,
    explain:
      "Les chats ont des glandes odorantes sur les joues, le menton et la tête — la plupart apprécient les caresses douces à ces endroits. Le ventre est une zone sensible que beaucoup de chats protègent.",
  },
  {
    id: "cat-hiding",
    species: "cat",
    q: "Un chat que vous gardez arrive dans votre maison et se cache sous le lit. Quelle est la meilleure approche ?",
    options: [
      "Le sortir de force pour qu'il s'habitue vite à vous",
      "Boucher la cachette pour qu'il ne puisse plus se cacher",
      "Le laisser tranquille, garder nourriture, eau et litière à proximité, et le laisser sortir en son temps",
      "Appeler son nom fort et de façon répétée jusqu'à ce qu'il réponde",
    ],
    correct: 2,
    explain:
      "Se cacher est une réaction normale d'adaptation. Forcer le contact augmente le stress ; un environnement calme et la patience laissent le chat prendre confiance à son rythme.",
  },
  {
    id: "cat-blink",
    species: "cat",
    q: "Un chat vous fait un clin d'œil lent. Quelle est la meilleure réponse ?",
    options: [
      "Le fixer intensément pour établir la confiance",
      "Lui rendre un clin d'œil lent",
      "Ciller rapidement pour refléter l'excitation",
      "L'ignorer — ça ne veut rien dire",
    ],
    correct: 1,
    explain:
      "Le clignement lent est un signal amical et non menaçant. Cligner des yeux en retour communique détente et confiance dans le langage du chat.",
  },
  {
    id: "cat-kneading",
    species: "cat",
    q: "Un chat appuie rythmiquement ses pattes avant contre vous (« pétrissage »). Que signifie ce comportement ?",
    options: [
      "Il essaie de vous faire mal",
      "Il ne fait que vous marquer comme son territoire",
      "C'est un comportement de confort et de contentement hérité de la petite enfance",
      "Il réclame à manger",
    ],
    correct: 2,
    explain:
      "Le pétrissage vient de la tétée des chatons et signale généralement que le chat se sent en sécurité et apaisé.",
  },
];

export default fr;
