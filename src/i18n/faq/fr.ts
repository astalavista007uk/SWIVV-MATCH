import type { FaqCategory } from "./types";

const fr: FaqCategory[] = [
  {
    id: "getting-started",
    title: "Pour commencer",
    questions: [
      { id: "create-account", q: "Comment créer un compte ?", keywords: "inscription inscrire email créer", a: "Appuyez sur **Commencer** et saisissez votre e-mail et un mot de passe. Nous vous enverrons un e-mail de confirmation — cliquez sur le lien à l'intérieur pour activer votre compte. Vous pouvez parcourir les services et les annonces d'animaux perdus sans vous inscrire, mais un compte est nécessaire pour réserver, envoyer des messages ou publier." },
      { id: "no-confirmation-email", q: "Je n'ai pas reçu mon e-mail de confirmation — que faire ?", keywords: "e-mail spam vérifier reçu", a: "Vérifiez d'abord vos courriers indésirables ou spams. Si l'e-mail n'arrive pas après quelques minutes, demandez un nouveau lien de confirmation depuis l'écran de connexion. Assurez-vous que l'adresse e-mail saisie est correcte." },
      { id: "owner-vs-provider", q: "Quelle est la différence entre un propriétaire d'animal et un prestataire de services ?", keywords: "deux sitter type compte utilisateur", a: "Un **propriétaire d'animal** réserve des services, achète ou adopte des animaux et signale les animaux perdus. Un **prestataire de services** publie des services (promenade, garde, toilettage, pension, etc.) et accepte les réservations. Vous pouvez être **les deux à la fois** — votre type de compte s'adapte automatiquement selon les services que vous configurez." },
      { id: "verify-profile", q: "Comment vérifier mon profil et gagner la confiance ?", keywords: "certification badge photo bio confiance", a: "Ajoutez une photo de profil claire, complétez votre biographie et indiquez votre pays et votre ville. Les prestataires peuvent associer des certifications à chaque annonce (par exemple Premiers secours animaliers, DVM, ou Fear Free Certified) afin que les propriétaires voient vos qualifications d'un coup d'œil." },
      { id: "add-payment-method", q: "Comment ajouter un moyen de paiement ?", keywords: "carte crédit paramètres paiements", a: "Allez dans [Paramètres](/settings) → Paiements et ajoutez une carte. Vous devez avoir un moyen de paiement enregistré pour payer une réservation — si vous essayez de payer sans, nous vous y redirigerons directement." },
    ],
  },
  {
    id: "finding-booking",
    title: "Rechercher et réserver un service",
    questions: [
      { id: "how-to-search", q: "Comment rechercher un service ?", keywords: "filtre parcourir trouver sitter promeneur toiletteur vétérinaire", a: "Ouvrez [Parcourir les services](/browse) et filtrez par type de service, lieu, dates, note minimale et nombre de réservations passées. Triez par prix, note, nouveautés ou popularité pour trouver la bonne personne." },
      { id: "map-list-views", q: "Comment fonctionnent les vues carte et liste ?", keywords: "leaflet épingle bascule bureau mobile", a: "Sur ordinateur, vous pouvez afficher la **Carte + Liste** côte à côte ou la liste uniquement. Sur mobile, basculez entre la liste et une carte plein écran. Survoler ou toucher une carte met en surbrillance son repère, et les repères regroupés s'écartent pour ne rien masquer." },
      { id: "service-types", q: "Quels types de services puis-je réserver ?", keywords: "garde promenade toilettage pension garderie visite vétérinaire", a: "Sept types : **Garde d'animaux** (plage de dates chez vous), **Promenade de chiens** (par promenade, 30 ou 60 min), **Toilettage** (par séance, en salon ou à domicile), **Pension** (par nuit chez le prestataire), **Garderie** (journée complète ou demi-journée), **Visites à domicile** (courtes visites chez vous) et rendez-vous **Vétérinaire**. Chaque type a sa propre logique de date, heure et tarif." },
      { id: "booking-flow", q: "Comment fonctionne la réservation étape par étape ?", keywords: "demande accepter confirmer payer en attente", a: "Choisissez un service, sélectionnez la date/l'heure et les animaux concernés, puis envoyez une demande. Le prestataire l'examine et l'accepte ou la refuse. Une fois acceptée, vous payez via la plateforme et la réservation apparaît sur votre page [Réservations](/bookings) avec un statut en direct." },
      { id: "cancellation-policy", q: "Quelle est la politique d'annulation ?", keywords: "remboursement annuler frais 48 heures", a: "Vous obtenez un **remboursement intégral** si vous annulez au moins **48 heures** avant l'heure de début, ou si le prestataire annule. En deçà de 48 heures, un **remboursement partiel** s'applique (50 % des frais de service). Les frais de réservation suivent la même politique." },
    ],
  },
  {
    id: "becoming-provider",
    title: "Devenir prestataire de services",
    questions: [
      { id: "list-first-service", q: "Comment publier mon premier service ?", keywords: "assistant configurer créer annonce ajouter", a: "Depuis votre [Tableau de bord](/dashboard), complétez l'assistant de configuration : choisissez vos types de services, indiquez votre ville et votre pays, et rédigez une courte bio (au moins 20 caractères). Créez ensuite une annonce avec un titre, un prix, des photos et une description." },
      { id: "multiple-listings", q: "Puis-je proposer plusieurs services ?", keywords: "deux même catégorie plusieurs annonces", a: "Oui. Vous pouvez créer autant d'annonces que vous le souhaitez — même plusieurs dans la même catégorie (par exemple deux options de toilettage à prix différents). Chaque annonce est gérée séparément depuis votre tableau de bord, et vous pouvez aussi publier des animaux à vendre ou à adopter en parallèle." },
      { id: "required-profile-info", q: "Quelles informations le profil prestataire doit-il contenir ?", keywords: "certifications photos biographie horaires", a: "Au minimum : une photo de profil, un nom complet, un pays et une ville, et une bio. Sur chaque annonce, vous pouvez ajouter une galerie photo (jusqu'à 5 photos), les services spécifiques offerts, les **certifications** pertinentes, les horaires par jour de la semaine, la durée des créneaux et des détails propres au type (salon mobile, type de propriété pour la pension, etc.)." },
      { id: "edit-delete-listing", q: "Comment modifier ou supprimer une annonce ?", keywords: "pause supprimer mettre à jour", a: "Ouvrez l'annonce depuis votre tableau de bord et utilisez **Modifier** ou **Supprimer**. Vous pouvez aussi mettre une annonce en pause pour la masquer temporairement des résultats sans perdre ses détails, puis la réactiver quand vous le souhaitez." },
    ],
  },
  {
    id: "pets-sale-adoption",
    title: "Animaux à vendre et à adopter",
    questions: [
      { id: "sale-vs-adoption", q: "Quelle est la différence entre « À vendre » et « À adopter » ?", keywords: "gratuit adopter prix don", a: "Les annonces **À vendre** ont un prix fixé. Les annonces **À adopter** (parfois appelées « Gratuites ») n'ont pas de prix — le but est de confier l'animal à un bon foyer. Les deux acceptent jusqu'à 5 photos, les carnets de vaccination, les certificats et les notes de compatibilité (compatible enfants, chiens ou chats)." },
      { id: "make-offer", q: "Comment fonctionne « Faire une offre » ?", keywords: "négocier prix inférieur minimum 30 pourcent", a: "Sur une annonce À vendre, vous pouvez proposer un montant inférieur au prix demandé. L'offre minimale acceptée est de **30 % en dessous** du prix affiché — autrement dit, au moins 70 % du prix. Le vendeur accepte ou refuse ensuite votre offre. Les annonces À adopter utilisent une simple demande au lieu d'une offre." },
      { id: "offer-limit", q: "Y a-t-il une limite sur les offres ?", keywords: "20 limite quotidienne par jour plateforme", a: "Oui. Pour rester équitable, la plateforme autorise **20 offres par jour** pour l'ensemble des utilisateurs. Le compteur se réinitialise toutes les 24 heures et vous voyez le nombre restant directement sur l'annonce." },
      { id: "after-offer-accepted", q: "Que se passe-t-il après l'acceptation de mon offre ?", keywords: "séquestre code retrait confirmer réception", a: "Vous payez dans un compte **séquestre** pour sécuriser l'animal. Le vendeur génère ensuite un **code de retrait** à 4 chiffres. Lorsque vous récupérez l'animal, vous saisissez le code pour confirmer la réception et finaliser la vente. Si l'acheteur ne paie pas avant la date limite, le vendeur peut annuler et remettre en vente automatiquement." },
      { id: "adoption-flow", q: "Comment fonctionne l'adoption ?", keywords: "gratuit collecte demande accepter", a: "Les annonces À adopter ignorent le paiement et le séquestre. Vous envoyez une demande, le propriétaire actuel l'examine et l'accepte, puis vous organisez la remise directement entre vous." },
    ],
  },
  {
    id: "payments-commissions",
    title: "Paiements et commissions",
    questions: [
      { id: "fee-structure", q: "Comment sont calculés les frais et commissions ?", keywords: "18 pourcent 10 plafond 45 pourboire vente animal 8 5 adoption gratuit 0", a: "Les prestataires sont soumis à une **commission de 18 %** sur leurs gains, déduite de leur versement. Les acheteurs paient jusqu'à **10 % de frais**, plafonnés à **45 €** (ou l'équivalent dans votre devise).\n\n**Ventes d'animaux :** Les vendeurs sont soumis à une **commission de 8 %** (plafonnée à 150 €) sur le prix convenu. Les acheteurs paient **5 % de frais** (plafonnée à 80 €) en plus. Exemple : une vente de 100 € coûte 105 € à l'acheteur, et le vendeur reçoit 92 €.\n\n**Adoptions d'animaux :** Publier un animal pour adoption gratuite ou rehoming ne coûte **rien** — 0 % de commission. Nous considérons que placer un animal dans un nouveau foyer est un acte de gentillesse, et nous sommes là pour accompagner cette démarche.\n\nLes **pourboires** vont entièrement au prestataire — 0 % de commission." },
      { id: "when-providers-paid", q: "Quand les prestataires sont-ils payés ?", keywords: "versement gains libération terminé transfert", a: "Les gains sont libérés lorsqu'une réservation est marquée comme terminée. Les prestataires sont invités à connecter un compte Stripe pour les paiements dès que le traitement en direct sera activé. Vous pouvez suivre vos gains sur votre page Gains." },
      { id: "refund-policy", q: "Comment fonctionnent les remboursements ?", keywords: "argent retour rembourser annuler", a: "Les remboursements suivent la politique d'annulation : remboursement intégral si vous annulez 48 h à l'avance ou si le prestataire annule, et remboursement partiel dans les 48 h. Les remboursements approuvés reviennent sur votre moyen de paiement d'origine." },
      { id: "payment-security", q: "Mes informations de paiement sont-elles sécurisées ?", keywords: "carte détails sécurité stripe last4", a: "Nous ne stockons que les quatre derniers chiffres et la marque de votre carte — jamais le numéro complet. Le traitement des paiements est géré par notre partenaire lorsque le mode actif sera en service. Consultez nos [Conditions](/terms-and-conditions) pour tous les détails." },
    ],
  },
  {
    id: "reviews-ratings",
    title: "Avis et évaluations",
    questions: [
      { id: "how-ratings-calculated", q: "Comment les notes sont-elles calculées ?", keywords: "moyenne étoiles score", a: "La note d'un prestataire est la moyenne arithmétique de toutes les étoiles reçues sur les réservations terminées. Chaque avis compte pareillement — aucune pondération ni score caché." },
      { id: "who-can-review", q: "Qui peut laisser un avis ?", keywords: "acheteur vendeur propriétaire retour", a: "Pour les réservations de services, le **propriétaire de l'animal** peut laisser un avis une fois la réservation terminée. Pour les ventes d'animaux, **l'acheteur et le vendeur** peuvent s'évaluer mutuellement après la finalisation — les deux parties sont ainsi responsables." },
      { id: "edit-review", q: "Puis-je modifier ou mettre à jour mon avis ?", keywords: "changer mettre à jour modifier", a: "Pour les **ventes d'animaux**, oui — vous pouvez mettre à jour votre avis à tout moment. Pour les **réservations de services**, les avis ne peuvent pas être modifiés après publication, vérifiez bien avant de publier." },
      { id: "repeat-customers", q: "Que signifie « clients réguliers » sur un profil ?", keywords: "retour réservation compte indicateur", a: "C'est une estimation basée sur l'historique de réservations du prestataire, affichée pour donner une idée de la fidélité de sa clientèle. C'est un indicateur utile, pas un décompte précis." },
    ],
  },
  {
    id: "messaging",
    title: "Messagerie et communication",
    questions: [
      { id: "contact-provider", q: "Comment contacter un prestataire ou un acheteur ?", keywords: "message chat envoyer texte", a: "Utilisez le bouton **Message** sur n'importe quelle page de service, annonce d'animal, réservation ou commande. Cela ouvre une conversation privée individuelle. Vous devez être connecté. Vous pouvez aussi utiliser un lien de message direct." },
      { id: "response-time", q: "Dans quels délais puis-je attendre une réponse ?", keywords: "réponse rapide notification temps", a: "Les délais varient selon les personnes. Nous notifions l'autre partie dès l'envoi du message, donc la plupart des réponses arrivent dans la journée. Si l'attente s'éternise, une relance amicale aide." },
      { id: "send-photos", q: "Puis-je envoyer des photos dans un message ?", keywords: "pièce jointe image preuve photo", a: "Oui — vous pouvez joindre des photos dans une conversation. Pratique pour partager une preuve d'animal trouvé, des nouvelles de l'animal pendant une réservation, ou tout détail de service à confirmer visuellement." },
      { id: "notifications", q: "Comment fonctionnent les notifications de messages ?", keywords: "cloche temps réel alerte push", a: "Vous recevez une alerte cloche dans l'application pour chaque nouveau message, mise à jour de réservation ou événement important, en temps réel. Les messages ouverts sont marqués comme lus automatiquement. Vous pouvez affiner certaines préférences dans [Paramètres](/settings)." },
    ],
  },
  {
    id: "trust-safety",
    title: "Confiance et sécurité",
    questions: [
      { id: "photo-moderation", q: "Comment les photos de profil sont-elles modérées ?", keywords: "ia inapproprié avatar vérifier", a: "Les photos de profil sont vérifiées par une modération automatisée avant leur mise en ligne. Les images clairement sûres sont validées instantanément, les clairement inappropriées sont rejetées, et les cas limites sont signalés pour examen. Cela maintient l'authenticité de la communauté sans vous ralentir." },
      { id: "disputes", q: "Que faire en cas de problème avec une vente d'animal ?", keywords: "litige preuve résoudre problème séquestre", a: "Si un problème survient pendant qu'une commande est en séquestre ou terminée, l'acheteur ou le vendeur peut **ouvrir un litige** avec un motif et jusqu'à 5 photos de preuve. Notre équipe examine les détails et aide à trouver une résolution. Incluez toujours des preuves claires — cela accélère les choses." },
      { id: "report-listing", q: "Comment signaler une annonce ou un utilisateur ?", keywords: "signaler inapproprié rapport abus", a: "Si vous voyez quelque chose de suspect et qu'aucun bouton de signalement n'est visible sur la page, [contactez-nous](/contact-us) directement avec les détails et nous examinerons." },
      { id: "data-protection", q: "Mes informations personnelles sont-elles protégées ?", keywords: "rgpd données confidentialité droits", a: "Oui. Vos données sont traitées conformément à notre [Centre de confidentialité](/privacy-centre), qui explique vos droits — accès, rectification, suppression — et comment les exercer." },
    ],
  },
  {
    id: "lost-pets",
    title: "Animaux perdus",
    questions: [
      { id: "report-lost-pet", q: "Comment signaler un animal perdu ?", keywords: "créer annonce perdu disparu tableau de bord", a: "Depuis votre [Tableau de bord](/dashboard), appuyez sur **Signaler un animal perdu**. Ajoutez au moins une photo (jusqu'à deux), les détails et signes distinctifs de votre animal, ainsi que le lieu et l'heure de la disparition. Vous pouvez partir d'un animal enregistré pour pré-remplir les infos, ou tout saisir manuellement." },
      { id: "rewards", q: "Comment fonctionnent les récompenses ?", keywords: "argent promesse trouveur payer", a: "En publiant un animal perdu, vous pouvez ajouter un montant de **récompense**. Il figure sur l'annonce et sur le flyer imprimable en tant qu'engagement — vous organisez le paiement directement avec le trouveur une fois l'animal rentré." },
      { id: "found-my-pet", q: "Quelqu'un a trouvé mon animal — et ensuite ?", keywords: "réclamation trouveur preuve e-mail répondre", a: "Lorsqu'une personne appuie sur **J'ai trouvé cet animal** sur votre annonce, elle envoie des photos de preuve et un message. Vous recevez un message privé avec ces photos, une notification et une alerte e-mail. Examinez les preuves, puis répondez pour organiser la restitution." },
      { id: "print-flyer", q: "Puis-je imprimer un flyer pour mon animal perdu ?", keywords: "affiche pdf a4 partager", a: "Oui. Chaque annonce d'animal perdu propose un **flyer** imprimable — une mise en page A4 avec les deux photos côte à côte, votre numéro de contact en gras et l'adresse de la dernière apparition. Vous pouvez aussi partager l'annonce sur Facebook, X ou WhatsApp." },
    ],
  },
  {
    id: "account-privacy",
    title: "Compte et confidentialité",
    questions: [
      { id: "update-profile", q: "Comment mettre à jour mon profil ?", keywords: "modifier nom photo bio lieu", a: "Allez dans [Paramètres](/settings) pour changer votre photo, votre nom complet, votre genre, votre bio, vos coordonnées et votre lieu. Les modifications s'enregistrent instantanément." },
      { id: "manage-notifications", q: "Comment gérer mes préférences de notification et de cookies ?", keywords: "push analytique marketing préférences", a: "Certaines préférences de notification et push se règlent dans [Paramètres](/settings). Pour les cookies d'analyse et de marketing, visitez la page [Paramètres cookies](/cookies) à tout moment." },
      { id: "delete-account", q: "Comment supprimer mon compte ?", keywords: "supprimer fermer effacer données", a: "Sur votre page de profil, ouvrez l'option **Supprimer le compte**. Vous confirmez et choisissez un motif (avec une option « Autre »). Après la suppression, votre e-mail redevient disponible si vous souhaitez recréer un compte." },
      { id: "gdpr-rights", q: "Quels sont mes droits RGPD ?", keywords: "accès rectifier supprimer protection données loi", a: "Vous avez le droit d'accéder, de rectifier et de supprimer vos données personnelles, parmi d'autres. Notre [Centre de confidentialité](/privacy-centre) détaille chaque droit et la marche à suivre." },
    ],
  },
  {
    id: "general",
    title: "Général / Autres",
    questions: [
      { id: "countries-languages", q: "Quels pays et langues sont pris en charge ?", keywords: "région devise langue français", a: "PET BASE prend en charge de nombreux pays — dont les États-Unis, le Canada, le Royaume-Uni, l'Irlande, les membres de l'UE, l'Australie, la Nouvelle-Zélande et plus. L'application est disponible en plusieurs langues, et vous pouvez changer de devise et de langue depuis vos paramètres." },
      { id: "contact-support", q: "Comment contacter le support client ?", keywords: "aide support équipe e-mail", a: "Pour tout ce que cette FAQ ne couvre pas, rendez-vous sur notre page [Nous contacter](/contact-us). Choisissez un sujet, décrivez la situation et nous reviendrons vers vous." },
      { id: "give-feedback", q: "Comment donner mon avis ou suggérer une fonctionnalité ?", keywords: "suggérer idée améliorer commentaire", a: "Nous serions ravis de l'entendre. Envoyez vos retours via la page [Nous contacter](/contact-us) et sélectionnez « Question générale » ou « Autre » — vos suggestions nous aident à construire la suite." },
    ],
  },
];

export default fr;
