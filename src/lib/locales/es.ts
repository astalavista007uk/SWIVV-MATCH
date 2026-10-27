import type { EnKey } from "./en";

// Spanish dictionary — Record<EnKey,string> makes the compiler fail on any key the English one has and this one lacks.
export const es: Record<EnKey, string> = {
  // ── root shell ───────────────────────────────────────────────────────────
  "Page introuvable": "Página no encontrada",
  "Cette page n'existe pas ou a été déplacée.": "Esta página no existe o se ha movido.",
  "Retour à l'accueil": "Volver al inicio",
  "Ton e-mail est en attente de confirmation — clique sur le lien reçu par e-mail pour activer ton compte.":
    "Tu correo está pendiente de confirmación: haz clic en el enlace que te enviamos para activar tu cuenta.",
  "Compte banni": "Cuenta bloqueada",
  "Compte suspendu": "Cuenta suspendida",
  "Ton compte a été définitivement fermé pour non-respect du règlement.":
    "Tu cuenta se ha cerrado de forma permanente por incumplir las normas.",
  "Ton compte est suspendu jusqu'au {date}.": "Tu cuenta está suspendida hasta el {date}.",
  "Ton compte est suspendu.": "Tu cuenta está suspendida.",
  "Tu peux contester via la page contact.": "Puedes apelar desde la página de contacto.",
  "Se déconnecter": "Cerrar sesión",

  // ── auth modal + header ──────────────────────────────────────────────────
  "Connexion requise": "Inicio de sesión necesario",
  "Crée un compte ou connecte-toi pour liker ce membre.":
    "Crea una cuenta o inicia sesión para dar me gusta a este miembro.",
  "Crée un compte ou connecte-toi pour envoyer un message.":
    "Crea una cuenta o inicia sesión para enviar un mensaje.",
  "Crée ton compte gratuit ou connecte-toi pour continuer.": "Crea tu cuenta gratis o inicia sesión para continuar.",
  "Crée un compte ou connecte-toi pour ajouter ce membre à tes favoris.":
    "Crea una cuenta o inicia sesión para añadir este miembro a tus favoritos.",
  "Crée un compte ou connecte-toi pour signaler ce membre.":
    "Crea una cuenta o inicia sesión para denunciar a este miembro.",
  "Crée un compte ou connecte-toi pour bloquer ce membre.":
    "Crea una cuenta o inicia sesión para bloquear a este miembro.",
  "Crée un compte ou connecte-toi pour débloquer ce membre.":
    "Crea una cuenta o inicia sesión para desbloquear a este miembro.",
  "Créer un compte": "Crear cuenta",
  "Se connecter": "Iniciar sesión",
  "Ton e-mail": "Tu correo",
  "Ton mot de passe": "Tu contraseña",
  "Entre un e-mail valide.": "Introduce un correo válido.",
  "Entre ton mot de passe.": "Introduce tu contraseña.",
  "Rester connecté": "Mantener la sesión",
  "Connexion…": "Iniciando sesión…",
  "Crée ton compte Swivv et commence une nouvelle histoire. Avec Swivv, moins de swipe, plus de vraies rencontres.":
    "Crea tu cuenta de Swivv y empieza una nueva historia. Con Swivv, menos deslizar y más conexiones reales.",
  "Créer mon profil": "Crear mi perfil",
  "Plus tard": "Más tarde",
  "S'inscrire | Se connecter": "Registrarse | Iniciar sesión",
  "Réglages du profil": "Ajustes del perfil",
  "Mes statistiques": "Mis estadísticas",
  "Relevés d'accès": "Registros de acceso",
  Notifications: "Notificaciones",
  "Centre d'aide": "Centro de ayuda",
  Déconnexion: "Cerrar sesión",
  "Mon profil": "Mi perfil",
  "Menu du compte": "Menú de la cuenta",
  "Fermer le menu": "Cerrar el menú",

  // ── category nav ─────────────────────────────────────────────────────────
  Catégories: "Categorías",
  "Recherche avancée": "Búsqueda avanzada",
  "Près de moi": "Cerca de mí",
  "En ligne": "En línea",
  Mariage: "Matrimonio",
  "Relation sérieuse": "Relación seria",
  "Nouveaux profils": "Perfiles nuevos",
  "Photos récentes": "Fotos recientes",
  "Profils populaires": "Perfiles populares",
  Tous: "Todos",
  Femmes: "Mujeres",
  Hommes: "Hombres",

  // ── footer ───────────────────────────────────────────────────────────────
  Découvrir: "Descubrir",
  "Aide & Sécurité": "Ayuda y seguridad",
  "Confidentialité & Légal": "Privacidad y legal",
  "Découvrir comment ça marche": "Descubre cómo funciona",
  "Parcourir les profils": "Explorar perfiles",
  "En ligne maintenant": "En línea ahora",
  "Mes messages": "Mis mensajes",
  "Questions fréquentes": "Preguntas frecuentes",
  "Conseils de sécurité": "Consejos de seguridad",
  "Guide photos": "Guía de fotos",
  "Signaler un abus": "Denunciar un abuso",
  "Nous contacter": "Contactar",
  "Conditions d'utilisation": "Condiciones de uso",
  "Conditions Générales de Vente (CGV)": "Condiciones generales de venta",
  "Centre de confidentialité": "Centro de privacidad",
  Cookies: "Cookies",
  Accueil: "Inicio",
  "Blog rencontres": "Blog de citas",
  "Application mobile": "Aplicación móvil",
  "Your Match. Your Story.": "Your Match. Your Story.",
  SWIVV: "SWIVV",
  "© 2026 SWIVV. Tous droits réservés.": "© 2026 SWIVV. Todos los derechos reservados.",
  Langue: "Idioma",
  "Langue de l'interface": "Idioma de la interfaz",
  "Langue de traduction des messages": "Idioma de traducción de mensajes",
  "Les messages de la messagerie et certains textes de profil peuvent être traduits vers cette langue.":
    "Los mensajes y algunos textos del perfil se pueden traducir a este idioma.",

  // ── landing page ─────────────────────────────────────────────────────────
  "100% gratuit. Pas de carte bancaire.": "100% gratis. Sin tarjeta de crédito.",
  "Fais de belles": "Conoce a personas",
  "rencontres, gratuitement": "maravillosas, gratis",
  "SWIVV MATCH, le site de rencontres": "SWIVV MATCH, el sitio de citas que es",
  "100% gratuit": "100% gratis",
  ". Your Match. Your Story.": ". Your Match. Your Story.",
  "Commence à Swivver": "Empieza a Swivver",
  "SWIVV en chiffres": "SWIVV en cifras",
  Gratuit: "Gratis",
  "Possibilités de rencontres": "Posibles matches",
  "Des profils à découvrir": "Perfiles por descubrir",
  "Pour commencer": "Para empezar",
  "Fonctionnalités SWIVV": "Funciones de SWIVV",
  "Voir la section {n}": "Ir a la sección {n}",
  "Rejoins SWIVV en 2 minutes": "Únete a SWIVV en 2 minutos",
  "Compte gratuit en 2 minutes — complète ton profil à ton rythme.":
    "Cuenta gratis en 2 minutos: completa tu perfil a tu ritmo.",
  "Crée ton profil": "Crea tu perfil",
  "Découvre des compatibles": "Descubre personas compatibles",
  "Like, matche, discute": "Me gusta, match, conversación",
  "Un matching qui a du sens": "Un matching que tiene sentido",
  "On te montre d'abord les personnes vraiment compatibles.": "Primero te mostramos a las personas realmente compatibles.",
  "Score de compatibilité": "Puntuación de compatibilidad",
  "Profils vérifiés": "Perfiles verificados",
  "Intentions claires": "Intenciones claras",
  "Sécurité d'abord": "La seguridad primero",
  "Entends sa voix avant le premier rendez-vous": "Escucha su voz antes de la primera cita",
  "Réservés aux matchs : quand l'intérêt est réciproque, passe du texte à la voix.":
    "Solo para matches: cuando el interés es mutuo, pasa del texto a la voz.",
  "Partage de photos": "Compartir fotos",
  "Messages vocaux": "Mensajes de voz",
  "Suis tes chiffres et ta progression": "Sigue tus cifras y tu progreso",
  "Des repères concrets sur ton activité, sans classement ni pression.":
    "Datos concretos sobre tu actividad, sin rankings ni presión.",
  Statistiques: "Estadísticas",
  "SWIVV Progress": "SWIVV Progress",
  "7 derniers jours": "Últimos 7 días",
  "Profil complété": "Perfil completado",
  "Messages lus": "Mensajes leídos",
  "Appel à l'inscription": "Llamada al registro",
  "À ton tour d'écrire ton histoire": "Ahora te toca escribir tu historia",
  "Rejoins SWIVV MATCH et écris ta propre histoire. Inscription gratuite, désinscription en 1 clic.":
    "Únete a SWIVV MATCH y escribe tu propia historia. Registro gratis, baja en un clic.",
  "Je m'inscris gratuitement": "Me registro gratis",
  "Inscription gratuite": "Registro gratis",
  "SWIVV MATCH est 100% gratuit. Crée ton compte en 2 minutes et complète ton profil à ton rythme":
    "SWIVV MATCH es 100% gratis. Crea tu cuenta en 2 minutos y completa tu perfil a tu ritmo",
  "Télécharger l'application": "Descargar la aplicación",
  "Aperçu de l'application SWIVV MATCH sur mobile": "Vista previa de la aplicación SWIVV MATCH en móvil",
  "SWIVV MATCH dans ta poche": "SWIVV MATCH en tu bolsillo",
  "Emporte tes matchs partout et commence à Swivver en quelques secondes.":
    "Lleva tus matches contigo y empieza a Swivver en segundos.",
  "Déjà téléchargé ? Ne plus afficher": "¿Ya la has descargado? No mostrar",
  "Je recherche :": "Busco:",
  "Filtrer par genre": "Filtrar por género",
  "Aucun profil trouvé. Essaie un autre genre.": "No se han encontrado perfiles. Prueba otro género.",
  "Photo de {name}": "Foto de {name}",
  "Profil de {name}": "Perfil de {name}",
  "Voir le profil {n}": "Ver el perfil {n}",
  "Membre depuis le {date}": "Miembro desde {date}",
  "{pct}% compatible": "{pct}% compatible",
  "Liker {name}": "Dar me gusta a {name}",
  "Retirer le like de {name}": "Quitar me gusta a {name}",
  "View All": "Ver todo",
  Profil: "Perfil",
  Aide: "Ayuda",
  Réglages: "Ajustes",

  // ── help ─────────────────────────────────────────────────────────────────
  "Inscription, matching, messages, sécurité.": "Registro, matching, mensajes, seguridad.",
  "Comment ça marche": "Cómo funciona",
  "Le fonctionnement de SWIVV en bref.": "Cómo funciona SWIVV, en resumen.",
  "Des photos validées du premier coup.": "Fotos aprobadas a la primera.",
  "Une question ? Écris-nous directement.": "¿Una pregunta? Escríbenos directamente.",

  // ── cookies ──────────────────────────────────────────────────────────────
  "Nos cookies, sans langue de bois": "Nuestras cookies, sin rodeos",
  "SWIVV n'utilise que des cookies techniques. Pas de publicité, pas de revente.":
    "SWIVV solo usa cookies técnicas. Sin publicidad, sin reventa.",
  "Cookies utilisés": "Cookies que usamos",
  "Session : te garder connecté(e) entre deux visites.": "Sesión: te mantiene conectado entre visitas.",
  "Préférences : langue, filtres de recherche mémorisés.": "Preferencias: idioma y filtros de búsqueda guardados.",
  "Sécurité : protection contre les abus et les faux comptes.": "Seguridad: protección contra abusos y cuentas falsas.",
  "Mesures anonymes : pages visitées et site référent, via Vercel Analytics — sans cookie ni identification.":
    "Medición anónima: páginas visitadas y sitio de referencia, con Vercel Analytics, sin cookies ni identificación.",
  "Cookies que nous n'utilisons PAS": "Cookies que NO usamos",
  "Pas de cookies publicitaires ni de reciblage.": "Sin cookies publicitarias ni de retargeting.",
  "Pas de partage de ton activité amoureuse avec des tiers.": "No compartimos tu actividad sentimental con terceros.",
  "Pas de traceurs de réseaux sociaux intégrés aux profils.": "Sin rastreadores de redes sociales en los perfiles.",
  "Tu peux bloquer les cookies dans ton navigateur : le site reste consultable, mais la connexion et les filtres mémorisés ne fonctionneront plus. Questions ?":
    "Puedes bloquear las cookies en tu navegador: el sitio seguirá siendo visible, pero el inicio de sesión y los filtros guardados dejarán de funcionar. ¿Preguntas?",
  "Contacte-nous": "Escríbenos",

  // ── terms (short page) ───────────────────────────────────────────────────
  "Les règles du jeu, en langage simple. Dernière mise à jour : septembre 2026.":
    "Las reglas, en lenguaje sencillo. Última actualización: septiembre de 2026.",
  "1. Le service": "1. El servicio",
  "SWIVV est un site de rencontres : profils, likes, matchs et messagerie privée. Tout est gratuit, sans carte bancaire, sans abonnement. Il faut avoir 18 ans ou plus pour s'inscrire.":
    "SWIVV es un sitio de citas: perfiles, me gusta, matches y mensajería privada. Todo es gratis, sin tarjeta bancaria ni suscripción. Hay que tener 18 años o más para registrarse.",
  "2. Tes engagements": "2. Tus compromisos",
  "Tu publies des photos réelles et récentes de toi (ni dessins, ni célébrités), des informations exactes, et tu respectes les autres membres : pas de harcèlement, pas de discours haineux, pas de contenu sexuel non sollicité.":
    "Publicas fotos reales y recientes de ti (ni dibujos ni famosos), información veraz y respetas a los demás miembros: sin acoso, sin discursos de odio, sin contenido sexual no solicitado.",
  "3. Tolérance zéro": "3. Tolerancia cero",
  "Arnaques, demandes d'argent, faux profils et comportements abusifs entraînent un bannissement immédiat et définitif. Signale tout abus via la page contact.":
    "Las estafas, las peticiones de dinero, los perfiles falsos y los comportamientos abusivos conllevan un bloqueo inmediato y definitivo. Denuncia cualquier abuso desde la página de contacto.",
  "4. Rencontres réelles : prudence": "4. Citas reales: precaución",
  "SWIVV ne vérifie pas l'identité de chaque membre dans la vie réelle. Pour un premier rendez-vous : lieu public, durée limitée, préviens un proche. Tu restes responsable de ta sécurité.":
    "SWIVV no verifica la identidad de cada miembro en la vida real. Para una primera cita: lugar público, duración limitada, avisa a alguien cercano. Sigues siendo responsable de tu seguridad.",
  "5. Données et suppression": "5. Datos y eliminación",
  "Tes données servent uniquement au fonctionnement du service (profils, compatibilité, modération). Tu peux exporter ou supprimer tes données à tout moment, et supprimer ton compte en 1 clic.":
    "Tus datos se usan solo para el funcionamiento del servicio (perfiles, compatibilidad, moderación). Puedes exportar o eliminar tus datos en cualquier momento y eliminar tu cuenta con un clic.",
  "6. Contact": "6. Contacto",
  "Pour toute question sur ces conditions, écris-nous via la page contact. Version complète et détaillée : voir les conditions d'utilisation.":
    "Para cualquier duda sobre estas condiciones, escríbenos desde la página de contacto. Versión completa y detallada: consulta las condiciones de uso.",
  "Données et confidentialité :": "Datos y privacidad:",
  "centre de confidentialité": "centro de privacidad",

  // ── photo guide ──────────────────────────────────────────────────────────
  "Photo acceptée": "Foto aprobada",
  "Photo refusée": "Foto rechazada",
  "Tes photos font ta première impression : voici ce qui passe, ce qui casse, et ce que la loi interdit.":
    "Tus fotos dan la primera impresión: esto es lo que funciona, lo que falla y lo que prohíbe la ley.",
  "Nette ou floue ? À toi de juger": "¿Nítida o borrosa? Júzgalo tú",
  "Nette et éclairée": "Nítida y bien iluminada",
  Floue: "Borrosa",
  "Visage visible": "Rostro visible",
  "Trop sombre": "Demasiado oscura",
  "À faire": "Sí",
  "À ne jamais faire": "Nunca",
  "Une photo récente (moins d'un an) qui te ressemble aujourd'hui.": "Una foto reciente (menos de un año) que se parezca a cómo eres hoy.",
  "Ton visage bien visible sur la première photo, de face, sans lunettes de soleil.":
    "Tu rostro bien visible en la primera foto, de frente y sin gafas de sol.",
  "La lumière naturelle : près d'une fenêtre ou en extérieur, jamais à contre-jour.":
    "Luz natural: junto a una ventana o al aire libre, nunca a contraluz.",
  "Un mélange : portrait, photo en pied, et une photo en activité (sport, voyage, passion).":
    "Una mezcla: un retrato, una foto de cuerpo entero y una foto en acción (deporte, viaje, afición).",
  "Un sourire naturel — les profils souriants reçoivent nettement plus de likes.":
    "Una sonrisa natural: los perfiles sonrientes reciben bastantes más me gusta.",
  "5 photos maximum : qualité plutôt que quantité.": "Máximo 5 fotos: calidad antes que cantidad.",
  "Nudité et exhibition : torse nu suggestif, sous-vêtements, poses sexuelles — compte suspendu.":
    "Desnudos y exhibicionismo: torso desnudo sugerente, ropa interior, poses sexuales: cuenta suspendida.",
  "Contenus sexuellement explicites ou pornographiques — interdits et supprimés (CGU §7).":
    "Contenido sexualmente explícito o pornográfico: prohibido y eliminado (Condiciones §7).",
  "D'autres personnes reconnaissables sans leur consentement : chacun a un droit à l'image.":
    "Otras personas identificables sin su consentimiento: todo el mundo tiene derecho a su imagen.",
  "Des mineurs sur tes photos, dans quelque contexte que ce soit.": "Menores en tus fotos, en cualquier contexto.",
  "Photos floues, trop sombres, pixelisées ou prises de trop loin.": "Fotos borrosas, demasiado oscuras, pixeladas o tomadas desde muy lejos.",
  "Lunettes de soleil, casquette ou masque sur toutes les photos : on doit voir ton visage.":
    "Gafas de sol, gorra o mascarilla en todas las fotos: tenemos que ver tu rostro.",
  "Photos de groupe en photo principale, captures d'écran, mèmes, logos ou texte incrusté.":
    "Fotos de grupo como foto principal, capturas de pantalla, memes, logos o texto superpuesto.",
  "Photos volées : stars, influenceurs, images internet — usurpation d'identité.":
    "Fotos robadas: famosos, influencers, imágenes de internet: suplantación de identidad.",
  "Contenus violents, haineux, discriminatoires ou illégaux.": "Contenido violento, de odio, discriminatorio o ilegal.",
  "Le cadre légal, en bref": "El marco legal, en resumen",
  "Publier la photo d'une personne sans son consentement viole son droit à l'image — demande toujours l'accord des personnes reconnaissables. Les contenus interdits (CGU §7 : pornographie, mineurs, violence, usurpation) sont supprimés et peuvent entraîner la suspension du compte, voire un signalement aux autorités. En cas de doute,":
    "Publicar la foto de alguien sin su consentimiento vulnera su derecho a la imagen: pide siempre permiso a las personas identificables. El contenido prohibido (Condiciones §7: pornografía, menores, violencia, suplantación) se elimina y puede conllevar la suspensión de la cuenta o incluso una denuncia a las autoridades. Si tienes dudas,",
  "contacte la modération": "contacta con moderación",
  "avant de publier.": "antes de publicar.",
  "Vérifier mes photos avec un selfie": "Verificar mis fotos con un selfie",
  "Modifier mes photos": "Editar mis fotos",

  // ── testimonial ──────────────────────────────────────────────────────────
  "Partager votre témoignage": "Comparte vuestra historia",
  "Vous vous êtes dit oui grâce à SWIVV ? Racontez votre histoire, elle inspirera les prochains couples.":
    "¿Os dijisteis sí gracias a SWIVV? Contad vuestra historia: inspirará a las próximas parejas.",
  "Votre témoignage et vos photos doivent d'abord être validés par l'équipe SWIVV avant d'être publiés sur le blog.":
    "Vuestra historia y vuestras fotos deben ser aprobadas antes por el equipo de SWIVV para publicarse en el blog.",
  "Ton prénom": "Tu nombre",
  "Son prénom": "Su nombre",
  "Votre histoire": "Vuestra historia",
  "Comment vous êtes-vous rencontrés ? Le premier message, le premier rendez-vous, le déclic…":
    "¿Cómo os conocisteis? El primer mensaje, la primera cita, el flechazo.",
  "Photos de couple (3 maximum)": "Fotos de pareja (3 como máximo)",
  "+ Ajouter des photos": "+ Añadir fotos",
  "Photo de couple {n}": "Foto de pareja {n}",
  "Retirer la photo {n}": "Quitar la foto {n}",
  "Envoyer notre témoignage": "Enviar nuestra historia",

  // ── blog index ───────────────────────────────────────────────────────────
  "Le blog SWIVV": "El blog de SWIVV",
  "Conseils rencontres, mariage, idées de sorties et témoignages de couples.":
    "Consejos de citas, matrimonio, ideas para salir e historias de parejas.",
  "Rechercher un article…": "Buscar un artículo.",
  "Rechercher un article": "Buscar un artículo",
  "Aucun article trouvé.": "No se han encontrado artículos.",

  // ── verification ─────────────────────────────────────────────────────────
  "Vérifie ton profil": "Verifica tu perfil",
  "Prends un selfie : on le compare à ta photo de profil, sur ton appareil uniquement. Rien n'est envoyé ni stocké.":
    "Hazte un selfie: lo comparamos con tu foto de perfil, solo en tu dispositivo. No se envía ni se guarda nada.",
  "Se connecter pour vérifier mon profil": "Inicia sesión para verificar tu perfil",
  "Ajoute d'abord une": "Primero añade una",
  "photo à ton profil": "foto de perfil",
  "Modifier cette photo": "Cambiar esta foto",
  "Modifier la photo de profil": "Cambiar la foto de perfil",
  "Choisir une photo existante": "Elegir una foto existente",
  "Comparaison…": "Comparando…",
  "Vérifier que c'est bien moi": "Verificar que soy yo",
  "Accès caméra refusé — autorise-la dans les réglages du navigateur, puis réessaie.":
    "Acceso a la cámara denegado: permítelo en los ajustes del navegador y vuelve a intentarlo.",
  "Aucune caméra accessible depuis ce navigateur — choisis une photo existante ci-dessous.":
    "No hay cámara disponible en este navegador: elige una foto existente abajo.",
  "Caméra indisponible — choisis un fichier ci-dessous, ou autorise l'accès puis réessaie.":
    "Cámara no disponible: elige un archivo abajo o permite el acceso y vuelve a intentarlo.",
  "Lecture impossible. Réessaie.": "No se pudo leer. Inténtalo de nuevo.",
  "Aucun visage détecté sur ton selfie. Reprends-en un bien éclairé, de face.":
    "No se ha detectado ningún rostro en tu selfie. Haz otro bien iluminado y de frente.",
  "Vérification impossible. Réessaie.": "No se pudo verificar. Inténtalo de nuevo.",
  "Visage correspondant": "Rostro coincidente",
  "Visage différent": "Rostro diferente",
  "Aucun visage détecté": "Ningún rostro detectado",
  "Sera supprimée": "Se eliminará",
  "C'est bien toi ! Ton profil affiche désormais le badge vérifié.":
    "¡Eres tú! Tu perfil ya muestra la insignia de verificado.",
  "Ce selfie ne correspond à aucune de tes photos. Si c'est bien toi aujourd'hui, utilise-le comme nouvelle photo de profil.":
    "Este selfie no coincide con ninguna de tus fotos. Si eres tú hoy, úsalo como nueva foto de perfil.",

  // ── faq ──────────────────────────────────────────────────────────────────
  "Inscription & compte": "Registro y cuenta",
  "Matching & messages": "Matching y mensajes",
  "Mariage & relations sérieuses": "Matrimonio y relaciones serias",
  "Sécurité": "Seguridad",
  "SWIVV est-il gratuit ?": "¿SWIVV es gratis?",
  "Comment créer mon profil ?": "¿Cómo creo mi perfil?",
  "Comment supprimer mon compte ?": "¿Cómo elimino mi cuenta?",
  "Pourquoi mon profil a-t-il été refusé ?": "¿Por qué han rechazado mi perfil?",
  "Comment fonctionne le matching ?": "¿Cómo funciona el matching?",
  "Que veut dire le score de compatibilité ?": "¿Qué significa la puntuación de compatibilidad?",
  "Je n'ai pas de réponse à mon message, que faire ?": "No tengo respuesta a mi mensaje, ¿qué hago?",
  "Puis-je discuter avant un match ?": "¿Puedo hablar antes de un match?",
  "SWIVV convient-il pour trouver un mariage ?": "¿SWIVV sirve para encontrar matrimonio?",
  "Puis-je impliquer ma famille ?": "¿Puedo implicar a mi familia?",
  "Comment reconnaître un faux profil ?": "¿Cómo reconozco un perfil falso?",
  "Comment signaler un abus ?": "¿Cómo denuncio un abuso?",
  "Quels conseils pour un premier rendez-vous ?": "¿Qué consejos hay para una primera cita?",
  "Mes données sont-elles protégées ?": "¿Están protegidos mis datos?",
  "Oui. Créer ton profil, parcourir les profils, liker, matcher et discuter est gratuit et sans limite : messages écrits libres, vocaux et photos entre matchs.":
    "Sí. Crear tu perfil, explorar perfiles, dar likes, hacer match y hablar es gratis y sin límites: mensajes escritos libres, notas de voz y fotos entre matches.",
  "Clique sur « Créer mon profil » : en 2 minutes ton compte est créé (e-mail, mot de passe, infos de base). Complète ensuite ton profil à ton rythme — au moins 1 photo récente (5 maximum) pour être visible, ta bio, ton intention (relation sérieuse, mariage, belle histoire) puis tes centres d'intérêt.":
    "Haz clic en «Crear mi perfil»: tu cuenta estará lista en 2 minutos (correo, contraseña, datos básicos). Después completa tu perfil a tu ritmo: al menos 1 foto reciente (5 como máximo) para ser visible, tu bio, tu intención (relación seria, matrimonio, una bonita historia) y tus intereses.",
  "Voir le guide photos": "Ver la guía de fotos",
  "pour des photos validées du premier coup.": "para que tus fotos se aprueben a la primera.",
  "Va dans ton profil, section paramètres, puis « Supprimer mon compte ». La suppression est immédiate et définitive, en 1 clic.":
    "Ve a tu perfil, sección ajustes, y pulsa «Eliminar mi cuenta». La eliminación es inmediata y definitiva, en 1 clic.",
  "Aller aux paramètres": "Ir a los ajustes",
  "SWIVV n'accepte que les vraies photos : ni dessins, ni illustrations, ni photos de célébrités. Ajoute des photos réelles et récentes pour être validé. Les erreurs les plus fréquentes sont listées":
    "SWIVV solo acepta fotos reales: ni dibujos, ni ilustraciones, ni fotos de famosos. Añade fotos reales y recientes para que te validen. Los errores más frecuentes están en",
  "dans cet article": "este artículo",
  "Tu likes les profils qui te plaisent et tu peux déjà leur écrire. Quand l'intérêt est réciproque, cela devient un match et les vocaux et les photos se débloquent. Chaque profil affiche un score de compatibilité calculé sur la ville, l'âge, les intérêts, la religion et les intentions.":
    "Das like a los perfiles que te gustan y ya puedes escribirles. Cuando el interés es mutuo se convierte en match y se desbloquean las notas de voz y las fotos. Cada perfil muestra una puntuación de compatibilidad calculada a partir de la ciudad, la edad, los intereses, la religión y las intenciones.",
  "Comprendre le matching": "Entender el matching",
  "et": "y",
  "comment ça marche": "cómo funciona",
  "C'est un pourcentage qui résume tes points communs : même ville, âges proches, intérêts partagés, même religion, mêmes langues et même intention. Plus il est élevé, plus tu as de chances de bien t'entendre. Détails":
    "Es un porcentaje que resume lo que tenéis en común: misma ciudad, edades parecidas, intereses compartidos, misma religión, mismos idiomas y misma intención. Cuanto más alto, más probabilidades de llevarte bien. Detalles",
  "Attends 2-3 jours, envoie une seule relance polie, puis passe à autre chose. Personnalise tes premiers messages en rebondissant sur le profil : le taux de réponse triple. Exemples qui marchent":
    "Espera 2-3 días, envía un único recordatorio educado y pasa a otra cosa. Personaliza tus primeros mensajes apoyándote en el perfil: la tasa de respuesta se triplica. Ejemplos que funcionan",
  "sur le blog SWIVV": "en el blog de SWIVV",
  "Oui pour les messages écrits : tu peux écrire à qui tu veux, sans attendre de match. Les vocaux et les photos, eux, se débloquent entre matchs (intérêt réciproque) — c'est ce qui protège les membres des contenus non désirés.":
    "Sí para los mensajes escritos: puedes escribir a quien quieras sin esperar a un match. Las notas de voz y las fotos se desbloquean entre matches (interés mutuo): eso protege a los miembros de contenidos no deseados.",
  "Oui. Beaucoup de membres cherchent le mariage : filtre par intention « Mariage » et indique tes valeurs religieuses. Sois clair sur ton projet dès ton profil.":
    "Sí. Muchos miembros buscan matrimonio: filtra por la intención «Matrimonio» e indica tus valores religiosos. Sé claro con tu proyecto desde el perfil.",
  "Bien utiliser SWIVV pour le mariage": "Usar bien SWIVV para el matrimonio",
  "Bien sûr. Après quelques échanges pour vérifier la compatibilité, tu peux présenter la personne à ta famille avant d'aller plus loin. C'est même recommandé pour un projet de mariage.":
    "Claro. Tras unos cuantos mensajes para comprobar la compatibilidad, puedes presentar a la persona a tu familia antes de ir más lejos. Incluso es recomendable para un proyecto de matrimonio.",
  "Méfie-toi des photos trop parfaites sans vie quotidienne, des bios vides, des demandes rapides de changer d'application et surtout de toute demande d'argent. Les 8 signaux d'alerte sont détaillés":
    "Desconfía de las fotos demasiado perfectas sin vida cotidiana, de las bios vacías, de las peticiones rápidas de cambiar de aplicación y, sobre todo, de cualquier petición de dinero. Las 8 señales de alerta están detalladas",
  ". Privilégie les profils avec le badge vérifié.": ". Prioriza los perfiles con la insignia de verificado.",
  "Sur chaque profil et chaque conversation, utilise le bouton de signalement, ou":
    "En cada perfil y en cada conversación, usa el botón de denuncia, o",
  "écris-nous via la page contact": "escríbenos desde la página de contacto",
  ". La modération examine chaque signalement et bannit les comptes frauduleux.":
    ". La moderación revisa cada denuncia y banea las cuentas fraudulentas.",
  "Choisis un lieu public, limite la durée à 1h30, préviens un proche de l'endroit et de l'heure, et garde tes informations personnelles (adresse, travail précis) pour plus tard. Le guide complet :":
    "Elige un lugar público, limita la cita a 1h30, avisa a alguien de confianza de dónde y a qué hora y guarda tus datos personales (dirección, trabajo exacto) para más adelante. Guía completa:",
  "réussir son premier rendez-vous": "triunfar en tu primera cita",
  "nos idées de sorties": "nuestras ideas para salir",
  "Tes photos et infos ne sont visibles que par les membres connectés. Tu peux demander la suppression totale de tes données à tout moment via la page contact. Détails dans notre":
    "Tus fotos y datos solo los ven los miembros conectados. Puedes pedir la eliminación total de tus datos en cualquier momento desde la página de contacto. Detalles en nuestra",
  "politique de confidentialité": "política de privacidad",
  "On répond à tout": "Lo respondemos todo",
  "Inscription, matching, mariage, sécurité : tout ce qu'il faut savoir sur SWIVV.":
    "Registro, matching, matrimonio, seguridad: todo lo que hay que saber sobre SWIVV.",
  "Rechercher une question…": "Buscar una pregunta…",
  "Rechercher une question": "Buscar una pregunta",
  "Aucune question trouvée pour « {query} ».": "No se ha encontrado ninguna pregunta para «{query}».",
  "Toujours bloqué ?": "¿Sigues atascado?",
  "L'équipe SWIVV répond en général sous 1 à 2 jours ouvrés.":
    "El equipo de SWIVV suele responder en 1 o 2 días laborables.",

  // ── how it works ─────────────────────────────────────────────────────────
  "Inscription, profil, photos, matching, sécurité et suivi de ta progression : tout ce qu'il faut savoir pour bien démarrer sur SWIVV et faire de belles rencontres en confiance.":
    "Registro, perfil, fotos, matching, seguridad y seguimiento de tu progreso: todo lo que necesitas para empezar bien en SWIVV y hacer grandes encuentros con confianza.",
  "Voir les profils": "Ver los perfiles",
  "Créer mon profil gratuit": "Crear mi perfil gratis",
  "1. Compte en 2 minutes, profil à ton rythme": "1. Una cuenta en 2 minutos, un perfil a tu ritmo",
  "Crée ton compte gratuit en 2 minutes avec ton e-mail et un mot de passe, puis complète ton profil à ton rythme : tu peux t'arrêter et reprendre à tout moment.":
    "Crea tu cuenta gratis en 2 minutos con tu correo y una contraseña, y completa tu perfil a tu ritmo: puedes parar y retomarlo cuando quieras.",
  "Compte : prénom, e-mail, mot de passe (8 caractères min) et nationalité.":
    "Cuenta: nombre, correo, contraseña (8 caracteres mín.) y nacionalidad.",
  "Profil : genre, âge (18 ans min), ville, ce que tu recherches et ta présentation.":
    "Perfil: género, edad (18 años mín.), ciudad, lo que buscas y tu presentación.",
  "Apparence, style de vie, famille, origines et valeurs : plus ton profil est complet, plus tes matchs sont pertinents.":
    "Apariencia, estilo de vida, familia, orígenes y valores: cuanto más completo sea tu perfil, más acertados serán tus matches.",
  "Photos : ajoute jusqu'à 5 photos de toi (1 minimum pour être visible).":
    "Fotos: añade hasta 5 fotos tuyas (1 mínimo para ser visible).",
  "2. Créer un profil qui donne envie": "2. Crear un perfil que dé ganas de conocerte",
  "Les profils complets reçoivent nettement plus de matchs. L'algorithme et les autres membres se basent sur ce que tu partages.":
    "Los perfiles completos reciben bastante más matches. El algoritmo y los demás miembros se basan en lo que compartes.",
  "Écris une phrase d'accroche (10 caractères min) et une bio sincère (20 caractères min) : ce que tu aimes, ce que tu cherches.":
    "Escribe una frase de gancho (10 caracteres mín.) y una bio sincera (20 caracteres mín.): lo que te gusta y lo que buscas.",
  "Indique ton intention clairement : relation sérieuse, mariage, belle histoire.":
    "Indica tu intención con claridad: relación seria, matrimonio, una bonita historia.",
  "Renseigne tes centres d'intérêt : ce sont eux qui déclenchent les conversations.":
    "Rellena tus intereses: son los que encienden las conversaciones.",
  "3. Choisir de bonnes photos": "3. Elegir buenas fotos",
  "Tes photos font la première impression. SWIVV n'accepte que de vraies photos : ni dessins, ni illustrations, ni photos de célébrités.":
    "Tus fotos dan la primera impresión. SWIVV solo acepta fotos reales: ni dibujos, ni ilustraciones, ni fotos de famosos.",
  "Mets une photo récente où l'on voit bien ton visage en première photo.":
    "Pon una foto reciente en la que se vea bien tu cara como primera foto.",
  "Varie les contextes : portrait, en pied, en activité, avec des proches.":
    "Varía los contextos: retrato, cuerpo entero, haciendo algo, con gente cercana.",
  "Évite les lunettes de soleil sur toutes les photos, les filtres lourds et les photos floues.":
    "Evita las gafas de sol en todas las fotos, los filtros muy cargados y las fotos borrosas.",
  "5 photos maximum, récentes de préférence : on veut te reconnaître au premier rendez-vous.":
    "5 fotos como máximo, preferiblemente recientes: queremos reconocerte en la primera cita.",
  "4. Être honnête avec les autres": "4. Ser honesto con los demás",
  "La confiance est la base des belles histoires. Un profil honnête attire des personnes qui te correspondent vraiment.":
    "La confianza es la base de las grandes historias. Un perfil honesto atrae a personas que encajan de verdad contigo.",
  "Donne ton vrai âge, ta vraie ville et ta vraie situation.":
    "Da tu edad real, tu ciudad real y tu situación real.",
  "Annonce ton intention réelle dès le départ : chercher le mariage en voulant juste discuter fait perdre son temps à tout le monde.":
    "Anuncia tu intención real desde el principio: buscar matrimonio cuando solo quieres charlar hace perder el tiempo a todos.",
  "Ne partage jamais tes mots de passe ni tes codes bancaires, même avec un match de confiance.":
    "Nunca compartas tus contraseñas ni códigos bancarios, ni siquiera con un match de confianza.",
  "5. Reconnaître les faux profils et les arnaques": "5. Reconocer perfiles falsos y estafas",
  "La plupart des profils sont sincères, mais reste vigilant. Voici les signaux qui doivent t'alerter.":
    "La mayoría de los perfiles son sinceros, pero mantente alerta. Estas son las señales que deben hacerte saltar las alarmas.",
  "Photos trop parfaites ou de mannequin, profil presque vide, déclarations d'amour après 2 messages.":
    "Fotos demasiado perfectas o de modelo, perfil casi vacío, declaraciones de amor tras 2 mensajes.",
  "La personne refuse systématiquement de se montrer ou de te rencontrer en public.":
    "La persona rechaza siempre mostrarse o quedar contigo en público.",
  "Demande d'argent, de cartes cadeaux, de virement ou d'aide financière urgente : c'est toujours une arnaque.":
    "Petición de dinero, tarjetas regalo, transferencia o ayuda económica urgente: siempre es una estafa.",
  "Liens externes suspects ou demande de continuer sur une autre appli dès le premier message.":
    "Enlaces externos sospechosos o petición de seguir en otra app desde el primer mensaje.",
  "En cas de doute, signale le profil via « Signaler un abus » : l'équipe SWIVV vérifie et agit.":
    "Si tienes dudas, denuncia el perfil con «Denunciar un abuso»: el equipo de SWIVV revisa y actúa.",
  "6. Comment fonctionne le matching": "6. Cómo funciona el matching",
  "Swipe, découvre, like : tu parcours des profils sélectionnés, tu likes ceux qui te plaisent, et certains deviennent des matchs.":
    "Desliza, descubre, da like: recorres perfiles seleccionados, das like a los que te gustan y algunos se convierten en matches.",
  "Parcours les profils par ville, âge, intention et centres d'intérêt.":
    "Explora los perfiles por ciudad, edad, intención e intereses.",
  "Like les profils qui te plaisent et écris-leur librement. Quand l'intérêt est réciproque, cela devient un match et les vocaux et les photos se débloquent.":
    "Da like a los perfiles que te gustan y escríbeles libremente. Cuando el interés es mutuo se convierte en match y se desbloquean las notas de voz y las fotos.",
  "Chaque profil affiche un score de compatibilité calculé sur la ville, l'âge, les intérêts, la religion et les intentions.":
    "Cada perfil muestra una puntuación de compatibilidad calculada a partir de la ciudad, la edad, los intereses, la religión y las intenciones.",
  "Personnalise ton premier message en rebondissant sur le profil : le taux de réponse triple.":
    "Personaliza tu primer mensaje apoyándote en el perfil: la tasa de respuesta se triplica.",
  "7. Se rencontrer en toute sécurité": "7. Quedar con seguridad",
  "Quand le courant passe en messages, passe au réel — prudemment, surtout les premières fois.":
    "Cuando la conexión fluye en los mensajes, pasa a la vida real: con prudencia, sobre todo las primeras veces.",
  "Prends le temps de discuter avant de donner ton numéro ou tes réseaux.":
    "Tómate tu tiempo para hablar antes de dar tu número o tus redes.",
  "Premier rendez-vous : lieu public, en journée, et préviens un proche (lieu, heure, prénom de la personne).":
    "Primera cita: lugar público, de día, y avisa a alguien de confianza (lugar, hora, nombre de la persona).",
  "Garde tes propres moyens de transport pour pouvoir partir quand tu veux.":
    "Mantén tu propio medio de transporte para poder irte cuando quieras.",
  "Fais confiance à ton instinct : un malaise suffit à écourter ou annuler, sans justification.":
    "Confía en tu instinto: sentirte incómodo basta para acortar o cancelar, sin justificarte.",
  "8. Messages vocaux et envoi d'images": "8. Notas de voz y envío de imágenes",
  "Les vocaux et les images se débloquent avec un match : tu dois liker et être liké(e) en retour. Tant que ce n'est pas réciproque, seuls les messages écrits sont possibles. Pour parler de vive voix, échange ton numéro quand tu es prêt(e).":
    "Las notas de voz y las imágenes se desbloquean con un match: tienes que dar like y que te lo devuelvan. Mientras no sea mutuo, solo son posibles los mensajes escritos. Para hablar en voz alta, intercambia tu número cuando estés listo/a.",
  "Messages vocaux : dans la conversation (popup sur le profil ou page Messages), touche le micro pour enregistrer, ■ pour envoyer, ✕ pour annuler. Tes vocaux sont écoutables des deux côtés, sur téléphone comme sur ordinateur.":
    "Notas de voz: en la conversación (ventana del perfil o página Mensajes), toca el micrófono para grabar, ■ para enviar, ✕ para cancelar. Tus notas de voz se escuchan en ambos lados, en móvil y en ordenador.",
  "Signaler un vocal : touche l'icône drapeau à côté d'un message vocal et choisis le motif — la modération l'examine.":
    "Denunciar una nota de voz: toca el icono de bandera junto a una nota de voz y elige el motivo; la moderación lo revisa.",
  "Envoi d'images : dans la conversation, touche l'icône image à côté du micro pour partager une photo (5 Mo max). Les images sont visibles des deux côtés, sur téléphone comme sur ordinateur.":
    "Envío de imágenes: en la conversación, toca el icono de imagen junto al micrófono para compartir una foto (5 MB máx.). Las imágenes se ven en ambos lados, en móvil y en ordenador.",
  "Conservation : les messages (textes, vocaux, images) sont supprimés automatiquement après 3 mois, qu'ils aient été lus ou non, pour limiter le stockage de tes données.":
    "Conservación: los mensajes (textos, notas de voz, imágenes) se eliminan automáticamente a los 3 meses, se hayan leído o no, para limitar el almacenamiento de tus datos.",
  "Le micro exige un accès autorisé dans le navigateur ; sur téléphone, utilise la version https du site.":
    "El micrófono requiere permiso en el navegador; en el móvil, usa la versión https del sitio.",
  "9. Mes statistiques : comprendre ce qui marche": "9. Mis estadísticas: entender qué funciona",
  "Dans Mon compte, l'onglet Mes statistiques résume l'activité de ton profil. Choisis la période (7, 30, 90 jours ou depuis ton inscription) puis navigue entre 6 onglets.":
    "En Mi cuenta, la pestaña Mis estadísticas resume la actividad de tu perfil. Elige el periodo (7, 30, 90 días o desde tu registro) y navega entre 6 pestañas.",
  "Vue d'ensemble : visites, likes reçus et envoyés, matches mutuels, graphique jour par jour et activité récente.":
    "Vista general: visitas, likes recibidos y enviados, matches mutuos, gráfico día a día y actividad reciente.",
  "Mon profil : complétude en %, champs à compléter et conseils pour améliorer ton profil.":
    "Mi perfil: porcentaje de completitud, campos por completar y consejos para mejorar tu perfil.",
  "Likes et interactions : réactions reçues sur tes photos, membres ayant réagi et photo qui performe le mieux.":
    "Likes e interacciones: reacciones recibidas en tus fotos, miembros que han reaccionado y foto con mejor rendimiento.",
  "Messages et conversations : messages envoyés et reçus, vocaux, photos et taux de réponse.":
    "Mensajes y conversaciones: mensajes enviados y recibidos, notas de voz, fotos y tasa de respuesta.",
  "Visibilité et progression : ce qui fait découvrir ton profil et ce que tu peux améliorer.":
    "Visibilidad y progreso: qué hace que descubran tu perfil y qué puedes mejorar.",
  "Sécurité et confidentialité : tes signalements, tes blocages et les membres qui t'ont bloqué.":
    "Seguridad y privacidad: tus denuncias, tus bloqueos y los miembros que te han bloqueado.",
  "Ces chiffres restent privés : ils ne sont visibles que par toi.":
    "Estas cifras son privadas: solo tú puedes verlas.",
  "10. SWIVV PROGRESS : suivre ta progression": "10. SWIVV PROGRESS: sigue tu progreso",
  "SWIVV PROGRESS, dans Mon compte, transforme ton activité en repères simples : régularité, succès débloqués et chiffres clés. Aucune course au volume : seuls les vrais échanges comptent.":
    "SWIVV PROGRESS, en Mi cuenta, convierte tu actividad en referencias sencillas: constancia, logros desbloqueados y cifras clave. Sin carrera por el volumen: solo cuentan los intercambios reales.",
  "Progression : ta série de connexion (jours actifs consécutifs et record), ton objectif de la semaine et ta prochaine étape de profil.":
    "Progreso: tu racha de conexión (días activos consecutivos y récord), tu objetivo de la semana y tu siguiente paso de perfil.",
  "Le calendrier des 7 derniers jours montre tes jours actifs : passe la souris sur un jour pour voir sa date.":
    "El calendario de los últimos 7 días muestra tus días activos: pasa el ratón por un día para ver su fecha.",
  "Succès : 6 badges à débloquer — Prêt à rencontrer, Première étincelle, Premier message, Échange à deux, Présence régulière, et Ambassadeur bienveillant (bientôt).":
    "Logros: 6 insignias por desbloquear — Listo para conocer, Primera chispa, Primer mensaje, Intercambio mutuo, Presencia constante y Embajador amable (próximamente).",
  "Statistiques : série actuelle, conversations relancées et chiffres de la période.":
    "Estadísticas: racha actual, conversaciones retomadas y cifras del periodo.",
  "Un like réciproque ou une vraie conversation suffit à faire vivre ta série : revenir tous les jours n'est pas obligatoire.":
    "Un like mutuo o una conversación real bastan para mantener viva tu racha: no es obligatorio volver cada día.",
  "11. Réagir aux photos avec un émoticône": "11. Reaccionar a las fotos con un emoji",
  "Sur les photos des profils, tu peux réagir en un geste avec un émoticône. C'est plus léger qu'un message et ça dit tout de suite ce qui te plaît.":
    "En las fotos de los perfiles puedes reaccionar con un gesto usando un emoji. Es más ligero que un mensaje y dice al instante lo que te gusta.",
  "6 réactions : 😍 Craquant(e), ❤️ J'adore, 😊 Charmant(e), 🔥 Canon, 😉 Petit clin d'œil et ✨ Original(e).":
    "6 reacciones: 😍 Encantador(a), ❤️ Me encanta, 😊 Simpático(a), 🔥 Atractivo(a), 😉 Guiño y ✨ Original.",
  "Une seule réaction par photo : touche le même émoticône pour l'enlever, ou un autre pour le remplacer.":
    "Una sola reacción por foto: toca el mismo emoji para quitarla, u otro para reemplazarla.",
  "Réagir compte aussi comme un like : ton intérêt est transmis au membre. S'il te like ou réagit en retour, vous êtes en match et les vocaux et les photos se débloquent.":
    "Reaccionar también cuenta como like: tu interés se envía al miembro. Si te da like o reacciona de vuelta, estáis en match y se desbloquean las notas de voz y las fotos.",
  "Les autres voient le nombre de réactions par photo, jamais qui a réagi. Toi, tu retrouves qui a réagi à tes photos dans Mes statistiques.":
    "Los demás ven el número de reacciones por foto, nunca quién ha reaccionado. Tú puedes ver quién ha reaccionado a tus fotos en Mis estadísticas.",
  "Tu ne peux pas réagir à tes propres photos, et les réactions sont limitées en fréquence pour éviter le spam.":
    "No puedes reaccionar a tus propias fotos, y las reacciones tienen un límite de frecuencia para evitar el spam.",
  "12. Vérifier tes photos avec un selfie": "12. Verificar tus fotos con un selfie",
  "Le badge vérifié rassure les autres membres. La comparaison utilise un modèle de reconnaissance faciale directement dans ton navigateur : le selfie n'est ni envoyé ni stocké.":
    "La insignia de verificado tranquiliza a los demás miembros. La comparación usa un modelo de reconocimiento facial directamente en tu navegador: el selfie no se envía ni se guarda.",
  "Ajoute au moins une photo à ton profil, puis touche « Vérifier avec un selfie » depuis Mon profil.":
    "Añade al menos una foto a tu perfil y toca «Verificar con un selfie» desde Mi perfil.",
  "Prends un selfie avec ta caméra — ou choisis une image si elle n'est pas disponible : visage de face, bien éclairé, sans lunettes de soleil ni filtre.":
    "Hazte un selfie con la cámara (o elige una imagen si no está disponible): cara de frente, bien iluminada, sin gafas de sol ni filtro.",
  "Le selfie est comparé à chacune de tes photos : dès qu'une correspond, le badge vérifié s'affiche sur ton profil.":
    "El selfie se compara con cada una de tus fotos: en cuanto una coincide, la insignia de verificado aparece en tu perfil.",
  "Si aucune photo ne correspond, reprends le selfie ou remplace ta photo principale par le selfie en un geste.":
    "Si ninguna foto coincide, repite el selfie o sustituye tu foto principal por el selfie en un gesto.",
  "Aucune image n'est transmise au serveur pour la comparaison : seul le badge vérifié est enregistré.":
    "Ninguna imagen se envía al servidor para la comparación: solo se guarda la insignia de verificado.",
  "Photos trop anciennes, floues ou retouchées : la comparaison peut échouer, même si c'est bien toi.":
    "Fotos demasiado antiguas, borrosas o retocadas: la comparación puede fallar, aunque seas tú.",

  // ── contact ──────────────────────────────────────────────────────────────
  Contact: "Contacto",
  "Parlons-nous": "Hablemos",
  "Une question, un abus à signaler, un témoignage à partager ? Réponse en général sous 1 à 2 jours ouvrés.":
    "¿Una pregunta, un abuso que denunciar, una historia que compartir? Solemos responder en 1 o 2 días laborables.",
  "Question simple ?": "¿Una pregunta sencilla?",
  "La réponse est sûrement dans la": "La respuesta seguro que está en las",
  FAQ: "FAQ",
  "Urgence sécurité ?": "¿Emergencia de seguridad?",
  "Choisis « Signaler un abus » ci-dessous.": "Elige «Denunciar un abuso» abajo.",
  "Par e-mail": "Por correo",
  "Notre adresse": "Nuestra dirección",
  "Par téléphone": "Por teléfono",
  "Une réponse immédiate ?": "¿Una respuesta inmediata?",
  Fermer: "Cerrar",
  Discuter: "Chatear",
  Sujet: "Asunto",
  "Ton message": "Tu mensaje",
  "Documents (3 maximum)": "Documentos (3 como máximo)",
  "Décris ta demande le plus précisément possible…": "Describe tu solicitud con el máximo detalle posible…",
  "Retirer {name}": "Quitar {name}",
  "Envoi…": "Enviando…",
  "Envoyer": "Enviar",
  "Envoi impossible pour le moment — vérifie ta connexion et réessaie.":
    "No se puede enviar ahora mismo: comprueba tu conexión y vuelve a intentarlo.",
  "En cas d'urgence (menace, chantage), contacte aussi les autorités locales.":
    "En caso de emergencia (amenaza, chantaje), contacta también con las autoridades locales.",
  "Merci !": "¡Gracias!",
  "Ton message a bien été reçu, merci {name} ! L'équipe SWIVV MATCH te répondra à {email} dans les plus brefs délais.":
    "Hemos recibido tu mensaje, ¡gracias {name}! El equipo de SWIVV MATCH te responderá a {email} lo antes posible.",
  "Cordialement,": "Un saludo,",
  "L'équipe SWIVV MATCH": "El equipo de SWIVV MATCH",
  "Contacte-nous pour un autre sujet": "Contacta con nosotros por otro tema",
  "Discussion avec l'assistant SWIVV": "Conversación con el asistente de SWIVV",
  "Écris ta question…": "Escribe tu pregunta…",
  "Écris ta question à l'assistant": "Escribe tu pregunta al asistente",
  "Écrire un e-mail à l'équipe support": "Escribir un correo al equipo de soporte",
  Ouvrir: "Abrir",
  "Question sur mon compte": "Pregunta sobre mi cuenta",
  "Signaler un abus ou un faux profil": "Denunciar un abuso o un perfil falso",
  "Problème de match ou de message": "Problema con un match o un mensaje",
  "Signaler un problème technique": "Informar de un problema técnico",
  "Suggère une fonctionnalité": "Sugerir una función",
  "Supprimer mes données": "Eliminar mis datos",
  "Partenariat / Presse": "Colaboración / Prensa",
  Autre: "Otro",
  "Salut ! Je suis l'assistant SWIVV. Pose-moi une question sur les matches, les messages, les appels, ton profil… ou écris « humain » pour contacter le support.":
    "¡Hola! Soy el asistente de SWIVV. Pregúntame por los matches, los mensajes, las llamadas, tu perfil… o escribe «humano» para contactar con soporte.",
  "Hmm, je n'ai pas bien compris. Reformule ou choisis un sujet, sinon l'équipe support te répondra via le formulaire ci-dessous.":
    "Mmm, no lo he entendido bien. Reformúlalo o elige un tema; si no, el equipo de soporte te responderá con el formulario de abajo.",
  "Le % sur chaque profil vient de tes critères Mes Matches : plus tu remplis de critères correspondants, plus il grimpe. Change tes critères puis « Sauvegarder et rechercher » pour voir les chiffres se mettre à jour partout.":
    "El % de cada perfil viene de tus criterios de Mis Matches: cuantos más criterios coincidentes rellenes, más sube. Cambia tus criterios y pulsa «Guardar y buscar» para ver las cifras actualizadas en todas partes.",
  "Ouvrir Mes Matches": "Abrir Mis Matches",
  "Touche le cœur sur un profil ou glisse sa photo vers la droite dans SWIVV Swipe. Tu peux déjà lui écrire ; s'il te like en retour, c'est un match et les vocaux et photos se débloquent.":
    "Toca el corazón en un perfil o desliza su foto a la derecha en SWIVV Swipe. Ya puedes escribirle; si te devuelve el like, es un match y se desbloquean las notas de voz y las fotos.",
  "Ouvrir SWIVV Swipe": "Abrir SWIVV Swipe",
  "L'icône cœur pleine en haut affiche tes Likes reçus : les profils qui t'ont liké. C'est aussi là que naissent tes futurs matches.":
    "El icono de corazón lleno de arriba muestra tus Likes recibidos: los perfiles que te han dado like. Ahí también nacen tus futuros matches.",
  "Va dans Messages (l'enveloppe en haut), choisis une conversation et écris. Tes messages se synchronisent entre ton téléphone et ton ordinateur.":
    "Ve a Mensajes (el sobre de arriba), elige una conversación y escribe. Tus mensajes se sincronizan entre tu móvil y tu ordenador.",
  "Ouvrir Messages": "Abrir Mensajes",
  "Les appels vidéo sont réservés aux matches mutuels : sur son profil, clique « Demander un appel », confirme, et l'appel démarre dès qu'il accepte. Autorise micro et caméra dans ton navigateur (version https sur téléphone).":
    "Las videollamadas son solo para matches mutuos: en su perfil, pulsa «Solicitar una llamada», confirma y la llamada empieza en cuanto acepte. Permite micrófono y cámara en tu navegador (versión https en el móvil).",
  "Avec un match mutuel, touche le micro dans la conversation pour enregistrer un vocal, ■ pour envoyer, ✕ pour annuler. Écoutable des deux côtés, sur téléphone comme ordinateur.":
    "Con un match mutuo, toca el micrófono en la conversación para grabar una nota de voz, ■ para enviar, ✕ para cancelar. Se escucha en ambos lados, en móvil y en ordenador.",
  "Ajoute jusqu'à 5 photos (2,5 Mo max) : directement sur Mon Profil en cliquant + sous ta photo principale, ou à l'étape 6 de l'inscription. La première photo devient ta photo principale.":
    "Añade hasta 5 fotos (2,5 MB máx.): directamente en Mi Perfil pulsando + bajo tu foto principal, o en el paso 6 del registro. La primera foto se convierte en tu foto principal.",
  "Crée ton compte depuis « Créer mon profil » en 2 minutes (18 ans minimum, CGU à lire jusqu'en bas et 2 cases à cocher), puis complète ton profil à ton rythme.":
    "Crea tu cuenta desde «Crear mi perfil» en 2 minutos (18 años mínimos, condiciones que leer hasta el final y 2 casillas que marcar) y completa tu perfil a tu ritmo.",
  "SWIVV est réservé aux 18 ans et plus : tu le certifies en cochant la première case à l'inscription.":
    "SWIVV es solo para mayores de 18 años: lo certificas marcando la primera casilla del registro.",
  "Tout est en bas de page : CGU détaillées, CGV, cookies, confidentialité. Tu dois les accepter (case à cocher) pour t'inscrire.":
    "Todo está al pie de página: condiciones detalladas, condiciones de venta, cookies, privacidad. Debes aceptarlas (casilla) para registrarte.",
  "Les distances sont de vraies distances route depuis ta ville (Paris → Nice ≈ 930 km). Vérifie que ta ville est bien renseignée dans ton profil si un chiffre te surprend.":
    "Las distancias son distancias reales por carretera desde tu ciudad (París → Niza ≈ 930 km). Comprueba que tu ciudad esté bien indicada en tu perfil si alguna cifra te sorprende.",
  "Affine par âge, ville, taille, style de vie et bien plus dans Mes Matches, puis « Sauvegarder et rechercher ». Tes critères sont conservés pour la prochaine visite.":
    "Afina por edad, ciudad, altura, estilo de vida y mucho más en Mis Matches, y pulsa «Guardar y buscar». Tus criterios se conservan para la próxima visita.",
  "Mes Matches": "Mis Matches",
  "Indique ta langue maternelle et tes autres langues à l'inscription (47 langues proposées) et filtre dessus dans Mes Matches.":
    "Indica tu lengua materna y tus otros idiomas en el registro (47 idiomas disponibles) y filtra por ellos en Mis Matches.",
  "Tu peux supprimer ton compte depuis Paramètres : profil, photos et données sont effacés. Cette action est définitive.":
    "Puedes eliminar tu cuenta desde Ajustes: el perfil, las fotos y los datos se borran. Esta acción es definitiva.",
  Paramètres: "Ajustes",
  "Sur la page du profil : Bloquer (il disparaît et ne peut plus te contacter) ou Signaler (notre modération examine). En cas de danger immédiat, contacte aussi les autorités.":
    "En la página del perfil: Bloquear (desaparece y ya no puede contactarte) o Denunciar (nuestra moderación lo revisa). En caso de peligro inmediato, contacta también con las autoridades.",
  "Premier rendez-vous : lieu public, préviens un proche, garde tes moyens de transport. Le détail est dans « Comment ça marche », section 7.":
    "Primera cita: lugar público, avisa a alguien de confianza, mantén tu medio de transporte. Los detalles están en «Cómo funciona», sección 7.",
  "Conseils sécurité": "Consejos de seguridad",
  "Gère likes, messages et nouveautés depuis Paramètres. Si tu ne reçois rien sur téléphone, vérifie aussi les autorisations du navigateur.":
    "Gestiona likes, mensajes y novedades desde Ajustes. Si no recibes nada en el móvil, revisa también los permisos del navegador.",
  "Tout est gratuit sur SWIVV : inscription, profils, likes, matchs et messages, sans carte bancaire. Les CGV le confirment.":
    "Todo es gratis en SWIVV: registro, perfiles, likes, matches y mensajes, sin tarjeta bancaria. Las condiciones de venta lo confirman.",
  "Invite tes amis célibataires depuis la page d'accueil : plus de profils de qualité, plus de belles rencontres.":
    "Invita a tus amigos solteros desde la página de inicio: más perfiles de calidad, más grandes encuentros.",
  "Essaie d'abord : recharger la page (Ctrl+Maj+R), te reconnecter, ou un autre navigateur. Si ça persiste, décris-le dans le formulaire ci-dessous avec ton téléphone et ton navigateur.":
    "Prueba primero: recarga la página (Ctrl+Mayús+R), vuelve a iniciar sesión o usa otro navegador. Si sigue igual, descríbelo en el formulario de abajo con tu móvil y tu navegador.",
  "Utilise « Mot de passe oublié » sur l'écran de connexion pour recevoir un lien de réinitialisation. Vérifie tes spams.":
    "Usa «He olvidado mi contraseña» en la pantalla de inicio de sesión para recibir un enlace de restablecimiento. Revisa el spam.",
  "Raconte ta belle histoire sur la page Témoignage : elle pourra inspirer la communauté.":
    "Cuenta tu bonita historia en la página Testimonios: puede inspirar a la comunidad.",
  "Partager mon témoignage": "Compartir mi testimonio",
  "Dans SWIVV Swipe, glisse la photo vers la droite pour liker, vers la gauche pour passer. La carte suit ton doigt et la suivante apparaît dessous.":
    "En SWIVV Swipe, desliza la foto a la derecha para dar like y a la izquierda para pasar. La tarjeta sigue tu dedo y la siguiente aparece debajo.",
  "SWIVV Swipe": "SWIVV Swipe",
  "Je transmets aux humains ! Utilise le formulaire ci-dessous, l'équipe SWIVV répond en général sous 1 à 2 jours ouvrés.":
    "¡Te paso con los humanos! Usa el formulario de abajo: el equipo de SWIVV suele responder en 1 o 2 días laborables.",

  // ── terms of sale (CGV) ──────────────────────────────────────────────────
  "Conditions Générales de Vente et de Services — SWIVV": "Condiciones Generales de Venta y de Servicios — SWIVV",
  "Dernière mise à jour : 22 septembre 2026.": "Última actualización: 22 de septiembre de 2026.",
  "Bienvenue sur SWIVV, une plateforme de rencontre et de mise en relation permettant aux personnes majeures de découvrir d'autres utilisateurs, d'échanger et de faire de nouvelles rencontres.":
    "Bienvenido a SWIVV, una plataforma de citas y contacto que permite a las personas adultas descubrir a otros usuarios, conversar y hacer nuevos encuentros.",
  "Les présentes Conditions Générales de Vente et de Services (« CGV ») définissent les conditions applicables aux services proposés par SWIVV.":
    "Las presentes Condiciones Generales de Venta y de Servicios (las «Condiciones») definen las condiciones aplicables a los servicios ofrecidos por SWIVV.",
  "Document lié :": "Documento relacionado:",
  "conditions d'utilisation": "condiciones de uso",
  "1. IDENTIFICATION": "1. IDENTIFICACIÓN",
  "Le service est exploité sous le nom :": "El servicio se explota bajo el nombre:",
  "Adresse : 10 Rue Thureau Dangin — 75015 Paris — France.": "Dirección: 10 Rue Thureau Dangin — 75015 París — Francia.",
  "Téléphone : +33 (0)6 60 36 82 20.": "Teléfono: +33 (0)6 60 36 82 20.",
  "SWIVV est actuellement lancé sous la forme d'un MVP (Minimum Viable Product).":
    "SWIVV se lanza actualmente como MVP (Minimum Viable Product).",
  "2. SERVICE GRATUIT": "2. SERVICIO GRATUITO",
  "Dans le cadre de son lancement actuel, l'ensemble des fonctionnalités proposées par SWIVV est gratuit.":
    "En el marco de su lanzamiento actual, todas las funcionalidades ofrecidas por SWIVV son gratuitas.",
  "L'utilisateur n'a actuellement :": "El usuario actualmente no tiene:",
  "aucun abonnement à souscrire ;": "ninguna suscripción que contratar;",
  "aucun paiement à effectuer ;": "ningún pago que realizar;",
  "aucun frais d'inscription ;": "ningún gasto de registro;",
  "aucun frais de création de profil ;": "ningún gasto de creación de perfil;",
  "aucun renouvellement automatique ;": "ninguna renovación automática;",
  "aucun achat obligatoire pour utiliser le service.": "ninguna compra obligatoria para usar el servicio.",
  "Aucune carte bancaire ou autre moyen de paiement n'est actuellement nécessaire pour utiliser SWIVV.":
    "Actualmente no se necesita ninguna tarjeta bancaria ni otro medio de pago para usar SWIVV.",
  "3. ABSENCE DE SERVICES PAYANTS": "3. AUSENCIA DE SERVICIOS DE PAGO",
  "SWIVV ne commercialise actuellement aucun abonnement premium, fonctionnalité payante, crédit virtuel, boost, option payante ou service nécessitant un paiement.":
    "SWIVV no comercializa actualmente ninguna suscripción premium, funcionalidad de pago, crédito virtual, boost, opción de pago ni servicio que requiera pago.",
  "En conséquence, aucune somme ne peut être facturée à l'utilisateur dans le cadre des fonctionnalités actuellement proposées gratuitement.":
    "En consecuencia, no se puede facturar ninguna cantidad al usuario por las funcionalidades que actualmente se ofrecen gratis.",
  "4. ÉVOLUTION FUTURE DES SERVICES": "4. EVOLUCIÓN FUTURA DE LOS SERVICIOS",
  "SWIVV pourra ultérieurement proposer des fonctionnalités ou services payants.":
    "SWIVV podrá ofrecer más adelante funcionalidades o servicios de pago.",
  "Dans ce cas, aucune somme ne sera facturée à un utilisateur sans que celui-ci ait été clairement informé :":
    "En ese caso, no se facturará ninguna cantidad al usuario sin haberle informado claramente:",
  "du service concerné ;": "del servicio en cuestión;",
  "de son prix ;": "de su precio;",
  "de la durée éventuelle de l'engagement ;": "de la posible duración del compromiso;",
  "des modalités de paiement ;": "de las modalidades de pago;",
  "des conditions de résiliation ;": "de las condiciones de cancelación;",
  "des conditions applicables au droit de rétractation lorsqu'il existe ;":
    "de las condiciones aplicables al derecho de desistimiento cuando exista;",
  "des autres informations légalement requises.": "de las demás informaciones exigidas por ley.",
  "Les conditions applicables aux services payants feront, le cas échéant, l'objet d'une mise à jour des présentes conditions et/ou de conditions contractuelles spécifiques.":
    "En su caso, las condiciones aplicables a los servicios de pago serán objeto de una actualización de estas Condiciones o de condiciones contractuales específicas.",
  "Les prix des services payants devront être présentés de manière claire et compréhensible avant tout achat. Les règles françaises imposent notamment que les prix soient communiqués avant la conclusion du contrat et exprimés en euros TTC lorsqu'ils sont applicables.":
    "Los precios de los servicios de pago deberán presentarse de forma clara y comprensible antes de cualquier compra. La normativa francesa exige en particular que los precios se comuniquen antes de la celebración del contrato y se expresen en euros con IVA incluido cuando corresponda.",
  "5. AUCUN ENGAGEMENT FINANCIER": "5. NINGÚN COMPROMISO ECONÓMICO",
  "La création d'un compte SWIVV et l'utilisation des fonctionnalités actuellement disponibles n'entraînent aucun engagement financier pour l'utilisateur.":
    "La creación de una cuenta SWIVV y el uso de las funcionalidades actualmente disponibles no implican ningún compromiso económico para el usuario.",
  "L'utilisateur peut utiliser le service sans fournir de coordonnées bancaires.":
    "El usuario puede usar el servicio sin facilitar datos bancarios.",
  "6. CRÉATION D'UN COMPTE": "6. CREACIÓN DE UNA CUENTA",
  "Lorsque la création d'un compte est nécessaire pour accéder aux fonctionnalités de SWIVV, l'utilisateur doit fournir les informations demandées par la plateforme.":
    "Cuando sea necesario crear una cuenta para acceder a las funcionalidades de SWIVV, el usuario deberá facilitar la información solicitada por la plataforma.",
  "L'utilisateur s'engage à fournir des informations exactes et à ne pas utiliser l'identité d'une autre personne.":
    "El usuario se compromete a facilitar información exacta y a no usar la identidad de otra persona.",
  "Les conditions relatives à la création et à l'utilisation d'un compte sont détaillées dans les Conditions Générales d'Utilisation (CGU) de SWIVV.":
    "Las condiciones relativas a la creación y uso de una cuenta se detallan en las Condiciones Generales de Uso de SWIVV.",
  "7. SUPPRESSION DU COMPTE": "7. ELIMINACIÓN DE LA CUENTA",
  "L'utilisateur peut supprimer son compte directement depuis son espace personnel.":
    "El usuario puede eliminar su cuenta directamente desde su espacio personal.",
  "Pour supprimer son compte, il suffit de :": "Para eliminar tu cuenta, basta con:",
  "1. se connecter à son compte SWIVV ;": "1. iniciar sesión en tu cuenta SWIVV;",
  "2. ouvrir la page « Paramètres » / « Settings » ;": "2. abrir la página «Paramètres» / «Settings»;",
  "3. sélectionner l'option de suppression du compte ;": "3. seleccionar la opción de eliminación de la cuenta;",
  "4. confirmer la demande de suppression.": "4. confirmar la solicitud de eliminación.",
  "Aucune lettre, demande postale ou procédure administrative n'est nécessaire pour supprimer son compte.":
    "No se necesita ninguna carta, solicitud postal ni procedimiento administrativo para eliminar la cuenta.",
  "La suppression du compte entraîne la désactivation du profil et la suppression ou l'anonymisation des données concernées, sous réserve des données qui doivent légalement être conservées.":
    "La eliminación de la cuenta conlleva la desactivación del perfil y la eliminación o anonimización de los datos afectados, sin perjuicio de los datos que deban conservarse legalmente.",
  "8. ABSENCE DE RÉSILIATION D'ABONNEMENT": "8. AUSENCIA DE CANCELACIÓN DE SUSCRIPCIÓN",
  "Dans la mesure où SWIVV est actuellement entièrement gratuit et ne propose aucun abonnement payant, aucune procédure spécifique de résiliation d'abonnement n'est actuellement applicable.":
    "Dado que SWIVV es actualmente totalmente gratuito y no ofrece ninguna suscripción de pago, no se aplica actualmente ningún procedimiento específico de cancelación de suscripción.",
  "La suppression du compte depuis la page Paramètres / Settings constitue le moyen simple de mettre fin à l'utilisation du service.":
    "Eliminar la cuenta desde la página Paramètres / Settings es la forma sencilla de dejar de usar el servicio.",
  "9. RÉCLAMATIONS": "9. RECLAMACIONES",
  "Pour toute question, demande ou réclamation concernant SWIVV, l'utilisateur peut contacter :":
    "Para cualquier pregunta, solicitud o reclamación sobre SWIVV, el usuario puede contactar con:",
  "SWIVV s'efforcera de traiter les demandes dans un délai raisonnable.":
    "SWIVV se esforzará por atender las solicitudes en un plazo razonable.",
  "10. DONNÉES PERSONNELLES": "10. DATOS PERSONALES",
  "Les données personnelles collectées dans le cadre de l'utilisation de SWIVV sont traitées conformément à la Politique de confidentialité de SWIVV.":
    "Los datos personales recogidos en el marco del uso de SWIVV se tratan de conformidad con la Política de privacidad de SWIVV.",
  "Cette politique précise notamment les catégories de données collectées, les finalités des traitements, les durées de conservation et les droits des utilisateurs.":
    "Esa política detalla en particular las categorías de datos recogidos, las finalidades de los tratamientos, los plazos de conservación y los derechos de los usuarios.",
  "11. PROPRIÉTÉ INTELLECTUELLE": "11. PROPIEDAD INTELECTUAL",
  "Le nom SWIVV, son identité visuelle, son logo, son interface, ses éléments graphiques, ses textes et les éléments techniques de la plateforme peuvent être protégés par les règles relatives à la propriété intellectuelle.":
    "El nombre SWIVV, su identidad visual, su logotipo, su interfaz, sus elementos gráficos, sus textos y los elementos técnicos de la plataforma pueden estar protegidos por las normas de propiedad intelectual.",
  "Toute utilisation non autorisée de ces éléments est interdite.":
    "Queda prohibido cualquier uso no autorizado de estos elementos.",
  "12. MODIFICATION DES CONDITIONS": "12. MODIFICACIÓN DE LAS CONDICIONES",
  "SWIVV peut modifier les présentes Conditions Générales de Vente et de Services notamment en cas :":
    "SWIVV puede modificar estas Condiciones Generales de Venta y de Servicios, en particular en caso de:",
  "d'évolution du service ;": "evolución del servicio;",
  "d'introduction de nouvelles fonctionnalités ;": "introducción de nuevas funcionalidades;",
  "d'introduction de services payants ;": "introducción de servicios de pago;",
  "de modification de la réglementation applicable.": "modificación de la normativa aplicable.",
  "La version publiée sur le site est la version applicable à la date de consultation.":
    "La versión publicada en el sitio es la aplicable en la fecha de consulta.",
  "Lorsque la réglementation l'exige, les utilisateurs seront informés des modifications importantes.":
    "Cuando la normativa lo exija, se informará a los usuarios de los cambios importantes.",
  "13. DROIT APPLICABLE": "13. DERECHO APLICABLE",
  "Les présentes Conditions Générales de Vente et de Services sont soumises au droit français, sous réserve des dispositions impératives qui pourraient être applicables à l'utilisateur en raison de son pays de résidence.":
    "Estas Condiciones Generales de Venta y de Servicios se rigen por el derecho francés, sin perjuicio de las disposiciones imperativas que puedan aplicarse al usuario por razón de su país de residencia.",
  "14. RÈGLEMENT DES LITIGES": "14. RESOLUCIÓN DE LITIGIOS",
  "En cas de différend concernant les services proposés par SWIVV, l'utilisateur est invité à contacter préalablement SWIVV afin de rechercher une solution amiable.":
    "En caso de discrepancia sobre los servicios ofrecidos por SWIVV, se invita al usuario a contactar previamente con SWIVV para buscar una solución amistosa.",
  "Les règles de règlement des litiges et de compétence juridictionnelle applicables sont celles prévues par la législation en vigueur.":
    "Las normas de resolución de litigios y de competencia judicial aplicables son las previstas por la legislación vigente.",
  "15. NULLITÉ PARTIELLE": "15. NULIDAD PARCIAL",
  "Si une disposition des présentes conditions est déclarée nulle ou inapplicable, les autres dispositions demeureront applicables dans la mesure permise par la loi.":
    "Si alguna disposición de estas Condiciones se declara nula o inaplicable, las demás disposiciones seguirán siendo aplicables en la medida permitida por la ley.",
  "16. CONTACT": "16. CONTACTO",
  "Pour toute question concernant les présentes conditions ou le fonctionnement de SWIVV :":
    "Para cualquier pregunta sobre estas Condiciones o el funcionamiento de SWIVV:",
  "SWIVV MATCH — 10 Rue Thureau Dangin — 75015 Paris — France — Téléphone : +33 (0)6 60 36 82 20.":
    "SWIVV MATCH — 10 Rue Thureau Dangin — 75015 Paris — Francia — Teléfono: +33 (0)6 60 36 82 20.",

  // ── privacy centre ───────────────────────────────────────────────────────
  "Tes données t'appartiennent. Voici ce que SWIVV collecte, pourquoi, et comment reprendre le contrôle.":
    "Tus datos son tuyos. Esto es lo que recoge SWIVV, por qué y cómo recuperar el control.",
  "Ce que voient les membres": "Lo que ven los miembros",
  "Tes photos, prénom, âge, ville, bio et centres d'intérêt. Ton e-mail et ta position exacte restent privés.":
    "Tus fotos, nombre, edad, ciudad, bio e intereses. Tu correo y tu ubicación exacta siguen siendo privados.",
  "Ce que SWIVV utilise": "Lo que usa SWIVV",
  "Tes préférences et tes likes servent uniquement à calculer tes scores de compatibilité. Jamais revendues, jamais partagées à des annonceurs.":
    "Tus preferencias y likes solo sirven para calcular tus puntuaciones de compatibilidad. Nunca se venden ni se comparten con anunciantes.",
  "Exporter mes données": "Exportar mis datos",
  "Reçois un document clair et illustré de tes données (profil, photos, activité).":
    "Recibe un documento claro e ilustrado con tus datos (perfil, fotos, actividad).",
  "Tout supprimer": "Eliminarlo todo",
  "Supprime ton compte en 1 clic depuis tes Paramètres. Tes photos et messages sont effacés.":
    "Elimina tu cuenta en 1 clic desde tus Ajustes. Tus fotos y mensajes se borran.",
  "Généré !": "¡Generado!",
  "Télécharger en PDF": "Descargar en PDF",
  "Connecte-toi pour télécharger tes données": "Inicia sesión para descargar tus datos",
  "Format JSON": "Formato JSON",
  "Aller aux Paramètres": "Ir a los Ajustes",
  "En résumé": "En resumen",
  "Pas de publicité ciblée avec tes données de rencontres.":
    "Sin publicidad dirigida con tus datos de citas.",
  "Pas de géolocalisation précise affichée (ville + distance en km uniquement).":
    "No se muestra geolocalización precisa (solo ciudad + distancia en km).",
  "Messages privés : visibles uniquement par toi et ton match.":
    "Mensajes privados: visibles solo para ti y tu match.",
  "Politique de confidentialité détaillée": "Política de privacidad detallada",
  "1. Données collectées": "1. Datos recogidos",
  "Compte : prénom, e-mail, âge, ville. Profil public : photos, bio, centres d'intérêt, intention. Usage : likes, matchs, messages, préférences de recherche. Les messages privés ne sont lisibles que par toi et ton match, plus la modération en cas de signalement.":
    "Cuenta: nombre, correo, edad, ciudad. Perfil público: fotos, bio, intereses, intención. Uso: likes, matches, mensajes, preferencias de búsqueda. Los mensajes privados solo los pueden leer tú y tu match, además de la moderación en caso de denuncia.",
  "2. Utilisation": "2. Uso",
  "Tes données servent uniquement à : afficher ton profil aux membres, calculer tes compatibilités, assurer la modération et la sécurité, et te contacter pour le support. Aucune revente, aucun partage à des annonceurs, aucune publicité ciblée avec tes données de rencontres.":
    "Tus datos solo sirven para: mostrar tu perfil a los miembros, calcular tus compatibilidades, garantizar la moderación y la seguridad, y contactarte para el soporte. Sin reventa, sin cesión a anunciantes, sin publicidad dirigida con tus datos de citas.",
  "3. Visibilité": "3. Visibilidad",
  "Ton profil public (photos, prénom, âge, ville, bio) est visible par les membres connectés uniquement. Ton e-mail, ta position exacte et tes signalements restent strictement privés. Seule ta ville et une distance approximative en km sont affichées.":
    "Tu perfil público (fotos, nombre, edad, ciudad, bio) solo lo ven los miembros conectados. Tu correo, tu ubicación exacta y tus denuncias siguen siendo estrictamente privados. Solo se muestran tu ciudad y una distancia aproximada en km.",
  "4. Conservation": "4. Conservación",
  "Tes données sont conservées tant que ton compte est actif. Après suppression du compte, ton profil public, tes photos et tes conversations sont effacés, sous réserve des durées légales (ex. journaux de modération en cas d'abus).":
    "Tus datos se conservan mientras tu cuenta esté activa. Tras eliminar la cuenta, tu perfil público, tus fotos y tus conversaciones se borran, sin perjuicio de los plazos legales (p. ej. registros de moderación en caso de abuso).",
  "5. Tes droits": "5. Tus derechos",
  "Accès, rectification, export, suppression : écris-nous via la page contact en précisant ta demande et l'e-mail de ton compte. Réponse sous 30 jours. Tu peux aussi supprimer ton compte toi-même en 1 clic depuis ton profil.":
    "Acceso, rectificación, exportación, supresión: escríbenos desde la página de contacto indicando tu solicitud y el correo de tu cuenta. Respuesta en 30 días. También puedes eliminar tu cuenta tú mismo en 1 clic desde tu perfil.",
  "6. Cookies": "6. Cookies",
  "SWIVV utilise uniquement des cookies techniques (session, préférences, sécurité). Aucun cookie publicitaire. Détails sur la page cookies.":
    "SWIVV solo usa cookies técnicas (sesión, preferencias, seguridad). Ninguna cookie publicitaria. Detalles en la página de cookies.",
  "7. Sécurité": "7. Seguridad",
  "Connexions chiffrées, mots de passe jamais stockés en clair, accès internes limités. En cas de faille avérée, les membres concernés sont informés conformément à la réglementation.":
    "Conexiones cifradas, contraseñas nunca almacenadas en claro, accesos internos limitados. En caso de brecha confirmada, se informa a los miembros afectados conforme a la normativa.",
  "8. Contact": "8. Contacto",
  "Pour exercer tes droits ou poser une question : page contact, objet « Supprimer mes données » ou « Question confidentialité ».":
    "Para ejercer tus derechos o hacer una pregunta: página de contacto, asunto «Eliminar mis datos» o «Pregunta de privacidad».",
  "Mes données SWIVV": "Mis datos SWIVV",
  "Mes données": "Mis datos",
  "Exporté le {date}": "Exportado el {date}",
  "Likes envoyés": "Likes enviados",
  Matchs: "Matches",
  "Profils bloqués": "Perfiles bloqueados",
  "Visites reçues": "Visitas recibidas",
  "Mes photos ({n})": "Mis fotos ({n})",
  "Photo {n}": "Foto {n}",
  "Photo {n} illisible": "Foto {n} ilegible",
  Prénom: "Nombre",
  Âge: "Edad",
  Ville: "Ciudad",
  Pays: "País",
  Présentation: "Presentación",
  Bio: "Bio",
  Recherche: "Busca",
  Statut: "Estado civil",
  Enfants: "Hijos",
  Métier: "Profesión",
  Religion: "Religión",
  Langues: "Idiomas",
  "Centres d'intérêt": "Intereses",

  // ── browse ───────────────────────────────────────────────────────────────
  Intention: "Busco",
  Toutes: "Todas",
  "Âge minimum": "Edad mínima",
  "Âge maximum": "Edad máxima",
  "Distance max": "Distancia máx.",
  "Distance maximale": "Distancia máxima",
  Illimitée: "Ilimitada",
  Trier: "Ordenar",
  "Trier les profils": "Ordenar los perfiles",
  Compatibilité: "Compatibilidad",
  Popularité: "Popularidad",
  Distance: "Distancia",
  "Âge - Croissant": "Edad - Ascendente",
  "Âge - Décroissant": "Edad - Descendente",
  "Ajouts Récents": "Añadidos recientes",
  "1 profil": "1 perfil",
  "{n} profils": "{n} perfiles",
  photos: "fotos",
  "que j'ai liké": "a los que he dado like",
  "qui m'ont liké": "que me han dado like",
  "Retirer le filtre {category}": "Quitar el filtro {category}",
  "Chargement des derniers profils…": "Cargando los últimos perfiles…",
  "Chargement…": "Cargando…",
  "Du plus proche au plus loin — règle la distance max ci-dessus.":
    "Del más cercano al más lejano: ajusta la distancia máx. arriba.",
  "Connectés en ce moment.": "Conectados ahora mismo.",
  "Les plus visités d'abord.": "Los más visitados primero.",
  "Les derniers inscrits d'abord.": "Los últimos registrados primero.",
  "Les photos des derniers inscrits.": "Las fotos de los últimos registrados.",
  "Photo ajoutée le {date}": "Foto añadida el {date}",
  "Déliker {name}": "Quitar el like a {name}",
  "Like réciproque": "Like mutuo",
  "{name} t'as Liké": "A {name} le gustas",
  "{name} a réagi sur tes photos": "{name} ha reaccionado a tus fotos",
  "Voir plus de profils": "Ver más perfiles",
  "Aucun profil avec ces filtres. Élargis ta recherche.":
    "Ningún perfil con estos filtros. Amplía tu búsqueda.",
  "Tu ne peux pas réagir à tes propres photos.": "No puedes reaccionar a tus propias fotos.",
  "Réaction non enregistrée. Réessaie.": "Reacción no guardada. Inténtalo de nuevo.",
  "Choisir une réaction": "Elegir una reacción",
  "Réagir : {label}": "Reaccionar: {label}",
  "Ta réaction : {label} — changer": "Tu reacción: {label} — cambiar",
  "Réagir à cette photo": "Reaccionar a esta foto",
  "Craquant(e)": "Encantador(a)",
  "J'adore": "Me encanta",
  "Charmant(e)": "Simpático(a)",
  Canon: "Atractivo(a)",
  "Petit clin d'œil": "Guiño",
  "Original(e)": "Original",
  "Relation amoureuse": "Relación amorosa",
  "Belle histoire": "Una bonita historia",

  // ── blog ─────────────────────────────────────────────────────────────────
  Conseils: "Consejos",
  Sorties: "Planes",
  "Confiance & sécurité": "Confianza y seguridad",
  "Équipe SWIVV": "Equipo SWIVV",
  "Réussir son premier rendez-vous amoureux : les conseils pour séduire, être soi-même et construire une belle histoire":
    "Triunfar en tu primera cita: consejos para gustar, ser tú mismo y construir una bonita historia",
  "Comment s'habiller, quels sujets aborder, quelles erreurs éviter — et pourquoi il faut parfois oser sortir de ses habitudes pour trouver l'amour.":
    "Cómo vestirte, de qué hablar, qué errores evitar y por qué a veces hay que salir de la rutina para encontrar el amor.",
  "Premier message : 7 exemples qui marchent vraiment": "Primer mensaje: 7 ejemplos que funcionan de verdad",
  "« Salut ça va ? » ne marche presque jamais. Voici comment écrire un premier message qui obtient une réponse.":
    "«Hola, ¿qué tal?» casi nunca funciona. Así se escribe un primer mensaje que recibe respuesta.",
  "Mariage : comment bien utiliser SWIVV": "Matrimonio: cómo usar bien SWIVV",
  "Profils pratiquants, intentions claires, familles impliquées : le guide pour une recherche de mariage sereine.":
    "Perfiles practicantes, intenciones claras, familias implicadas: la guía para buscar matrimonio con tranquilidad.",
  "10 idées de premier rendez-vous qui changent du café": "10 ideas de primera cita que van más allá del café",
  "Balade photo, brunch, salsa, expo : des idées simples pour un premier rendez-vous réussi, à Paris comme ailleurs.":
    "Paseo fotográfico, brunch, salsa, exposición: ideas sencillas para una primera cita exitosa, en París o donde sea.",
  "Photos de profil : les 5 erreurs qui tuent tes matchs": "Fotos de perfil: los 5 errores que matan tus matches",
  "Lunettes de soleil, photos floues, dessins : voici ce qui fait fuir — et comment y remédier en 10 minutes.":
    "Gafas de sol, fotos borrosas, dibujos: esto es lo que ahuyenta a la gente y cómo remediarlo en 10 minutos.",
  "Relation sérieuse : 6 signes d'un profil fiable": "Relación seria: 6 señales de un perfil fiable",
  "Bio remplie, intention claire, photos réelles : apprends à repérer les profils sérieux en 30 secondes.":
    "Bio completa, intención clara, fotos reales: aprende a detectar perfiles serios en 30 segundos.",
  "Comprendre le matching : comment SWIVV calcule ta compatibilité":
    "Entender el matching: cómo calcula SWIVV tu compatibilidad",
  "Score de compatibilité, likes, matchs réciproques : tout ce qui se passe entre ton inscription et ta première conversation.":
    "Puntuación de compatibilidad, likes, matches mutuos: todo lo que ocurre entre tu registro y tu primera conversación.",
  "Arnaques amoureuses : 8 signaux d'alerte à repérer avant de faire confiance":
    "Estafas amorosas: 8 señales de alerta que detectar antes de confiar",
  "Déclarations trop rapides, appels vidéo évités, demandes d'argent : les 8 signaux d'alerte à connaître pour faire des rencontres en ligne en toute sécurité.":
    "Declaraciones demasiado rápidas, videollamadas evitadas, peticiones de dinero: las 8 señales de alerta que debes conocer para ligar online con seguridad.",
  "Témoignage {n}": "Testimonio {n}",
  "Trouve ton Swivv": "Encuentra tu Swivv",
  "Inscription gratuite, sans carte bancaire.": "Registro gratis, sin tarjeta bancaria.",
  "Tous les articles": "Todos los artículos",
  "Lien copié !": "¡Enlace copiado!",
  Partager: "Compartir",
  "Articles similaires": "Artículos similares",

  // ── my profile ───────────────────────────────────────────────────────────
  "Connexion perdue": "Conexión perdida",
  "Impossible de charger ton profil sans connexion. Tes données sont en sécurité — réessaie quand internet revient.":
    "No se puede cargar tu perfil sin conexión. Tus datos están a salvo: vuelve a intentarlo cuando vuelva internet.",
  Réessayer: "Volver a intentarlo",
  "Crée ton profil SWIVV": "Crea tu perfil SWIVV",
  "Crée ton profil complet pour le voir ici.": "Crea tu perfil completo para verlo aquí.",
  "Se connecter / S'inscrire": "Iniciar sesión / Registrarse",
  "Bravo ! Ton profil SWIVV est 100 % complet 🎉": "¡Bien hecho! Tu perfil de SWIVV está 100 % completo 🎉",
  "Ton profil est à {pct} % — ajoute ta photo et tes détails pour recevoir plus de messages.":
    "Tu perfil está al {pct} %: añade tu foto y tus datos para recibir más mensajes.",
  "Compléter mon profil": "Completar mi perfil",
  "Vérifier avec un selfie": "Verificar con un selfie",
  "Modifier mon profil": "Editar mi perfil",
  "Photos mises à jour.": "Fotos actualizadas.",
  "Clique sur Mes Matches pour définir ton Swivv parfait{e} !":
    "¡Toca Mis Matches para definir tu Swivv perfecto!",
  "Connecte-toi ou inscris-toi pour voir à quel point tu matches avec {name}.":
    "Inicia sesión o regístrate para ver lo bien que encajas con {name}.",

  // ── profile fields / sections ────────────────────────────────────────────
  "Photos vérifiées": "Fotos verificadas",
  Nouveau: "Nuevo",
  Principale: "Principal",
  "Aucune photo - Clique sur le bouton + en bas pour ajouter tes photos.":
    "Sin fotos: toca el botón + de abajo para añadir tus fotos.",
  "Faire de cette photo la principale": "Hacer que esta sea la foto principal",
  "Voir photo {n}": "Ver foto {n}",
  "Supprimer la photo {n}": "Eliminar la foto {n}",
  "Ajouter des photos": "Añadir fotos",
  "Enregistrement…": "Guardando…",
  "Enregistrer les photos": "Guardar las fotos",
  "Garde au moins 1 photo.": "Mantén al menos 1 foto.",
  "5 photos maximum. Les photos en trop ont été ignorées.": "5 fotos como máximo. Las fotos sobrantes se han ignorado.",
  "Photo trop lourde (2,5 Mo max). Choisis-en une plus légère.":
    "Foto demasiado pesada (2,5 MB máx.). Elige una más ligera.",
  "Voir l'original": "Ver el original",
  Traduire: "Traducir",
  "Traduction indisponible. Réessaie.": "Traducción no disponible. Inténtalo de nuevo.",
  Apparence: "Apariencia",
  "Style de vie": "Estilo de vida",
  Famille: "Familia",
  "Origines et valeurs": "Orígenes y valores",
  "Origines & valeurs": "Orígenes y valores",
  Études: "Estudios",
  Taille: "Altura",
  "Statut matrimonial": "Estado civil",
  Cheveux: "Pelo",
  Yeux: "Ojos",
  Poids: "Peso",
  Silhouette: "Complexión",
  Origine: "Origen",
  Style: "Estilo",
  "Plus beaux atouts": "Mejores rasgos",
  Alcool: "Alcohol",
  Tabac: "Tabaco",
  Drogue: "Drogas",
  Alimentation: "Alimentación",
  Emploi: "Empleo",
  "Revenus annuels": "Ingresos anuales",
  Logement: "Vivienda",
  "Prêt à déménager": "Dispuesto a mudarse",
  Animaux: "Mascotas",
  "Veut (d'autres) animaux": "Quiere (más) mascotas",
  "Veut (d'autres) enfants": "Quiere (más) hijos",
  "Frères et sœurs": "Hermanos",
  "Rang dans la fratrie": "Posición entre hermanos",
  Parents: "Padres",
  Nationalité: "Nacionalidad",
  "Langue maternelle": "Lengua materna",
  "Autres langues": "Otros idiomas",
  "Religion de naissance": "Religión de nacimiento",
  "Pratique religieuse": "Práctica religiosa",
  "Valeurs familiales": "Valores familiares",
  "Type de relation recherché": "Tipo de relación buscada",
  "Situation matrimoniale": "Estado civil",
  "Titre du profil": "Título del perfil",
  "Couleur de cheveux": "Color de pelo",
  "Couleur des yeux": "Color de ojos",
  Atout: "Mejor rasgo",
  Profession: "Profesión",
  Revenus: "Ingresos",
  Mobilité: "Movilidad",
  "Autres animaux souhaités": "Otras mascotas deseadas",
  "Autres enfants souhaités": "Otros hijos deseados",
  Frères: "Hermanos",
  Sœurs: "Hermanas",
  "Situation des parents": "Estado civil de los padres",
  "Parcours religieux": "Trayectoria religiosa",
  "Valeurs religieuses": "Valores religiosos",
  "Date de naissance": "Fecha de nacimiento",
  Genre: "Género",
  Nom: "Nombre",

  // ── access logs ──────────────────────────────────────────────────────────
  "Mon accès et mes relevés": "Mi acceso y mis recibos",
  "Formule actuelle": "Plan actual",
  "Montant mensuel": "Importe mensual",
  "Accès gratuit actif": "Acceso gratuito activo",
  "Profite gratuitement des fonctionnalités actuellement disponibles sur SWIVV MATCH. Retrouve ci-dessous tes relevés mensuels récapitulant ton accès gratuit à la plateforme. Toute évolution future de nos offres te sera communiquée clairement. Aucun paiement n'est requis et aucun abonnement payant ne sera activé sans ton accord explicite.":
    "Disfruta gratis de las funcionalidades disponibles ahora en SWIVV MATCH. Abajo tienes tus recibos mensuales que resumen tu acceso gratuito a la plataforma. Cualquier cambio futuro en nuestras ofertas se te comunicará con claridad. No se requiere ningún pago y no se activará ninguna suscripción de pago sin tu consentimiento explícito.",
  "Historique de mes relevés": "Historial de mis recibos",
  "Connecte-toi": "Inicia sesión",
  "pour voir tes relevés mensuels d'accès gratuit.": "para ver tus recibos mensuales de acceso gratuito.",
  "Aucun relevé pour le moment : ton premier relevé sera disponible à la fin de ton premier mois complet (compte créé le {date}).":
    "Aún no hay ningún recibo: el primero estará disponible al final de tu primer mes completo (cuenta creada el {date}).",
  "Relevé mensuel d'accès gratuit · 0,00 € · Gratuit · émis le {date}":
    "Recibo mensual de acceso gratuito · 0,00 € · Gratis · emitido el {date}",
  Voir: "Ver",
  "Télécharger le PDF": "Descargar el PDF",
  "SWIVV est entièrement gratuit : aucun abonnement, aucun paiement, donc aucune facture.":
    "SWIVV es totalmente gratuito: sin suscripción, sin pago, así que sin factura.",
  "Si des options payantes voient le jour, elles feront l'objet de factures séparées.":
    "Si aparecen opciones de pago, se facturarán por separado.",
  "Voir les conditions tarifaires (CGV)": "Ver las condiciones tarifarias (Condiciones de venta)",

  // ── settings ─────────────────────────────────────────────────────────────
  "Connecte-toi pour gérer tes paramètres.": "Inicia sesión para gestionar tus ajustes.",
  Compte: "Cuenta",
  "Ton adresse e-mail": "Tu dirección de correo",
  "Changer d'adresse e-mail": "Cambiar de correo electrónico",
  Modifier: "Editar",
  "Nouveau mot de passe": "Nueva contraseña",
  "Mot de passe actuel": "Contraseña actual",
  "Nouveau mot de passe (8 caractères min)": "Nueva contraseña (8 caracteres mín.)",
  "Confirme le nouveau mot de passe": "Confirma la nueva contraseña",
  "Changer de mot de passe": "Cambiar de contraseña",
  "Modifier mon profil complet": "Editar mi perfil completo",
  "Zone dangereuse": "Zona peligrosa",
  "Masquer mon profil": "Ocultar mi perfil",
  "Invisible des autres utilisateurs jusqu'à réactivation.": "Invisible para los demás usuarios hasta que lo reactives.",
  "Ton profil ne sera plus visible par les autres utilisateurs. Continuer ?":
    "Tu perfil dejará de ser visible para los demás usuarios. ¿Continuar?",
  "Oui, masquer": "Sí, ocultarlo",
  "Supprime ton profil, tes likes, tes matchs et tes messages. Irréversible.":
    "Elimina tu perfil, tus likes, tus matches y tus mensajes. Irreversible.",
  "Suppression…": "Eliminando…",
  "Supprimer mon compte": "Eliminar mi cuenta",
  "Confirmer la suppression du compte": "Confirmar la eliminación de la cuenta",
  "Swivv Out ?": "¿Swivv Out?",
  "Tu es sûr de vouloir partir ? Ton profil, tes likes, tes matchs et tes messages seront effacés. Irréversible.":
    "¿Seguro que quieres irte? Tu perfil, tus likes, tus matches y tus mensajes se borrarán. Irreversible.",
  "Pourquoi nous quittes-tu ?": "¿Por qué te vas?",
  "Motif de suppression": "Motivo de eliminación",
  "Dis-nous en plus…": "Cuéntanos más…",
  Rester: "Quedarme",
  "Swivv Out": "Swivv Out",
  "J'ai trouvé quelqu'un": "He encontrado a alguien",
  "Pas assez de profils près de moi": "No hay suficientes perfiles cerca de mí",
  "Je n'utilise plus l'application": "Ya no uso la aplicación",
  "Problème technique": "Problema técnico",
  Annuler: "Cancelar",
  "Entre un prénom.": "Introduce un nombre.",
  "Ton prénom ne peut pas être une adresse e-mail.": "Tu nombre no puede ser una dirección de correo.",
  "Ton prénom ne peut pas contenir de chiffres.": "Tu nombre no puede contener números.",
  "Sauvegarde impossible. Réessaie.": "No se pudo guardar. Inténtalo de nuevo.",
  "Prénom mis à jour.": "Nombre actualizado.",
  "Entre une adresse e-mail valide.": "Introduce una dirección de correo válida.",
  "Changement impossible. Réessaie.": "No se pudo cambiar. Inténtalo de nuevo.",
  "Vérifie ta nouvelle adresse e-mail pour confirmer le changement.":
    "Revisa tu nueva dirección de correo para confirmar el cambio.",
  "Mot de passe : 8 caractères minimum.": "Contraseña: 8 caracteres mínimo.",
  "Les deux mots de passe ne correspondent pas.": "Las dos contraseñas no coinciden.",
  "Connecte-toi pour changer de mot de passe.": "Inicia sesión para cambiar la contraseña.",
  "Ancien mot de passe incorrect.": "La contraseña actual es incorrecta.",
  "Mot de passe mis à jour.": "Contraseña actualizada.",
  "La suppression a échoué, réessaie dans un instant.": "No se pudo eliminar, inténtalo de nuevo en un momento.",

  // ── notifications ────────────────────────────────────────────────────────
  "Non lues": "No leídas",
  Messages: "Mensajes",
  "Likes et matchs": "Likes y matches",
  "Activité du profil": "Actividad del perfil",
  "Compte et sécurité": "Cuenta y seguridad",
  "Tout marquer comme lu": "Marcar todo como leído",
  Filtres: "Filtros",
  "Impossible de charger tes notifications.": "No se pudieron cargar tus notificaciones.",
  "Tu es à jour ! Aucune nouvelle notification pour le moment.":
    "¡Estás al día! No hay notificaciones nuevas por ahora.",
  "Marquer comme lu": "Marcar como leída",
  "Supprimer cette notification": "Eliminar esta notificación",
  Supprimer: "Eliminar",
  "Afficher plus": "Mostrar más",
  "Notifications e-mail": "Notificaciones por correo",
  "Nouveaux messages": "Mensajes nuevos",
  "Reçois un e-mail lorsque tu reçois un nouveau message.": "Recibe un correo cuando recibas un mensaje nuevo.",
  "On t'a liké": "Alguien te ha dado like",
  "Reçois un e-mail lorsqu'un membre aime ton profil.": "Recibe un correo cuando a un miembro le guste tu perfil.",
  "Nouveaux matchs": "Matches nuevos",
  "Reçois un e-mail lorsqu'un nouveau match est créé.": "Recibe un correo cuando se cree un match nuevo.",
  "Interactions sur ton profil": "Interacciones en tu perfil",
  "Reçois un résumé de l'activité sur ton profil et de tes conversations.":
    "Recibe un resumen de la actividad de tu perfil y de tus conversaciones.",
  "Notifications en temps réel": "Notificaciones en tiempo real",
  "Reçois une alerte dès qu'un nouveau message arrive.": "Recibe un aviso en cuanto llegue un mensaje nuevo.",
  "Sois averti lorsqu'un membre aime ton profil.": "Recibe un aviso cuando a un miembro le guste tu perfil.",
  "Quelqu'un a consulté ton profil": "Alguien ha visto tu perfil",
  "Sois averti lorsqu'un membre consulte ton profil.": "Recibe un aviso cuando un miembro vea tu perfil.",
  "Réactions à tes photos": "Reacciones a tus fotos",
  "Sois averti lorsqu'un membre réagit à l'une de tes photos.": "Recibe un aviso cuando un miembro reaccione a una de tus fotos.",
  "Badge de messages non lus": "Insignia de mensajes no leídos",
  "Afficher un badge sur l'icône Messages lorsque tu reçois des messages non lus.":
    "Muestra una insignia en el icono Mensajes cuando recibas mensajes no leídos.",
  "Résumé d'activité": "Resumen de actividad",
  "Fréquence du résumé": "Frecuencia del resumen",
  "Un e-mail récapitulatif, seulement en cas d'activité réelle.":
    "Un correo resumen, solo cuando haya actividad real.",
  Quotidien: "Diario",
  Hebdomadaire: "Semanal",
  Désactivé: "Desactivado",
  "Offres et nouveautés SWIVV": "Ofertas y novedades de SWIVV",
  "E-mails marketing": "Correos de marketing",
  "Reçois occasionnellement nos nouveautés, conseils et offres SWIVV MATCH. Désinscription possible à tout moment ici.":
    "Recibe de vez en cuando nuestras novedades, consejos y ofertas de SWIVV MATCH. Puedes darte de baja aquí cuando quieras.",

  // ── matches ──────────────────────────────────────────────────────────────
  "Connecte-toi pour découvrir tes matches.": "Inicia sesión para descubrir tus matches.",
  "Sélectionne tes critères puis sauvegarde : ils définissent ton % de compatibilité partout sur le site, et les profils correspondants s'affichent ci-dessous, meilleurs en premier.":
    "Elige tus criterios y guarda: definen tu % de compatibilidad en todo el sitio, y los perfiles que coinciden aparecen abajo, los mejores primero.",
  "Dis-nous qui tu cherches, on te montre les meilleurs profils en premier. Tes critères enregistrés dans Mes Matches sont chargés par défaut.":
    "Dinos a quién buscas y te mostraremos los mejores perfiles primero. Tus criterios guardados en Mis Matches se cargan por defecto.",
  Réinitialiser: "Restablecer",
  "Taille min – max": "Altura mín. – máx.",
  "Poids min – max": "Peso mín. – máx.",
  "Choisir…": "Elegir…",
  Indifférent: "Sin preferencia",
  "Peu importe": "Cualquiera",
  "Taille min en centimètres": "Altura mínima en centímetros",
  "Taille max en centimètres": "Altura máxima en centímetros",
  "Taille min en pieds": "Altura mínima en pies",
  "Taille max en pieds": "Altura máxima en pies",
  "Taille min en pouces": "Altura mínima en pulgadas",
  "Taille max en pouces": "Altura máxima en pulgadas",
  "Poids min": "Peso mínimo",
  "Poids max": "Peso máximo",
  "1 critère rempli dans cette section": "1 criterio rellenado en esta sección",
  "{n} critères remplis dans cette section": "{n} criterios rellenados en esta sección",
  "Sauvegarder mes critères": "Guardar mis criterios",
  "Critères sauvegardés ✓": "Criterios guardados ✓",
  Résultats: "Resultados",
  "1 profil, meilleur match en premier": "1 perfil, el mejor match primero",
  "{n} profils, meilleur match en premier": "{n} perfiles, el mejor match primero",
  "Aucun profil avec ces critères. Élargis ta recherche.":
    "Ningún perfil con estos criterios. Amplía tu búsqueda.",
  "Je recherche": "Busco",
  "Âge min": "Edad mín.",
  "Âge max": "Edad máx.",
  "Distance max (km)": "Distancia máx. (km)",
  "Taille min (cm)": "Altura mín. (cm)",
  "Taille max (cm)": "Altura máx. (cm)",
  "Poids min (kg)": "Peso mín. (kg)",
  "Poids max (kg)": "Peso máx. (kg)",
  "Style vestimentaire": "Estilo de vestir",
  "Situation pro": "Situación laboral",
  "Déménagement accepté": "Dispuesto a mudarse",
  "Niveau d'études": "Nivel de estudios",
  "L'essentiel": "Lo esencial",

  // ── swivv progress ───────────────────────────────────────────────────────
  "Succès débloqué : {name}": "Logro desbloqueado: {name}",
  "{n} succès débloqués": "{n} logros desbloqueados",
  "Retrouve-les dans l'onglet Succès.": "Encuéntralos en la pestaña Logros.",
  "Connecte-toi pour voir ta progression.": "Inicia sesión para ver tu progreso.",
  "Des repères pour avancer à ton rythme, sans pression ni classement.":
    "Referencias sencillas para avanzar a tu ritmo, sin presión ni clasificación.",
  "Ta progression": "Tu progreso",
  "Certaines données n'ont pas pu être chargées.": "No se han podido cargar algunos datos.",
  "Chargement de ta progression…": "Cargando tu progreso…",
  "Sections de SWIVV Progress": "Secciones de SWIVV Progress",
  Progression: "Progreso",
  Succès: "Logros",
  "Série de connexion": "Racha de conexión",
  "jours d'affilée": "días seguidos",
  "jour d'affilée": "día seguido",
  "Record : {n} j": "Récord: {n} d",
  "Activité des 7 derniers jours": "Actividad de los últimos 7 días",
  "activité qualifiante": "actividad válida",
  "aucune activité qualifiante": "ninguna actividad válida",
  "(aujourd'hui)": "(hoy)",
  "Un like réciproque ou une vraie conversation suffit à démarrer ta série. Aucune obligation de revenir chaque jour.":
    "Un like mutuo o una conversación real bastan para empezar tu racha. No hace falta volver cada día.",
  "Tu construis ton parcours vers des rencontres sincères, un échange à la fois.":
    "Construyes tu camino hacia encuentros sinceros, intercambio a intercambio.",
  "Complétude du profil": "Perfil completo",
  "Profil complété à {pct} %": "Perfil completado al {pct} %",
  "Ce score mesure la complétude, pas ton attractivité.": "Esta puntuación mide la completitud, no tu atractivo.",
  "Prochaine étape": "Siguiente paso",
  "Compléter « {label} »": "Completar «{label}»",
  "Profil complet, bravo.": "Perfil completo, ¡bien hecho!",
  "Objectif de la semaine": "Objetivo de la semana",
  "Répondre à au moins une conversation entamée par l'autre personne.":
    "Responder al menos a una conversación iniciada por la otra persona.",
  "Objectif atteint": "Objetivo alcanzado",
  "Objectif non atteint": "Objetivo no alcanzado",
  "Objectif atteint : {n} conversations relancées cette semaine.":
    "Objetivo alcanzado: {n} conversaciones retomadas esta semana.",
  "0 pour l'instant — une seule réponse suffit, sans envoi massif.":
    "0 por ahora: una sola respuesta basta, sin envíos masivos.",
  "Ouvrir mes messages": "Abrir mis mensajes",
  "En un coup d'œil": "De un vistazo",
  "Matches mutuels": "Matches mutuos",
  "Conversations suivies": "Conversaciones activas",
  "Succès débloqués": "Logros desbloqueados",
  "{n} débloqués sur {total}. Chaque succès ne se débloque qu'une fois.":
    "{n} desbloqueados de {total}. Cada logro se desbloquea solo una vez.",
  "Privé par défaut": "Privado por defecto",
  "{name} — {state}": "{name} — {state}",
  débloqué: "desbloqueado",
  verrouillé: "bloqueado",
  "bientôt disponible": "próximamente",
  "Condition :": "Condición:",
  "Débloqué le {date}": "Desbloqueado el {date}",
  Débloqué: "Desbloqueado",
  "Pas encore débloqué": "Aún no desbloqueado",
  "Bientôt disponible": "Próximamente",
  "Statistiques privées": "Estadísticas privadas",
  "Calculées sur tes propres données, jamais sur celles des autres membres.":
    "Calculadas con tus propios datos, nunca con los de otros miembros.",
  "Période :": "Periodo:",
  "30 derniers jours": "Últimos 30 días",
  "Conversations commencées": "Conversaciones iniciadas",
  "Nouveaux matches réciproques sur la période.": "Nuevos matches mutuos en el periodo.",
  "Conversations où tu as envoyé le premier message.": "Conversaciones en las que enviaste el primer mensaje.",
  "Échanges à deux": "Intercambios mutuos",
  "Conversations devenues bidirectionnelles sur la période.": "Conversaciones que se volvieron bidireccionales en el periodo.",
  "Consultations de ton profil par d'autres membres.": "Visitas a tu perfil de otros miembros.",
  "Jours actifs": "Días activos",
  "Jours avec un match ou une vraie conversation.": "Días con un match o una conversación real.",
  "Part des informations de profil renseignées.": "Proporción de datos de perfil rellenados.",
  "Succès obtenus depuis ton inscription.": "Logros obtenidos desde tu registro.",
  "Série actuelle": "Racha actual",
  "Jours consécutifs d'activité qualifiante.": "Días consecutivos de actividad válida.",
  "Aucune activité sur cette période. Un profil complété et un échange sincère suffisent à faire vivre ces chiffres — le volume n'est pas un objectif.":
    "Sin actividad en este periodo. Un perfil completo y un intercambio sincero bastan para dar vida a estas cifras: el volumen no es el objetivo.",
  "Les jours sont comptés en heure locale, du lundi au dimanche. Les visites de profil ne sont affichées que lorsqu'elles sont enregistrées par SWIVV MATCH.":
    "Los días se cuentan en hora local, de lunes a domingo. Las visitas al perfil solo se muestran cuando las registra SWIVV MATCH.",
  "Prêt à rencontrer": "Listo para conocer",
  "Ton profil est complet : les autres membres voient qui tu es.":
    "Tu perfil está completo: los demás miembros ven quién eres.",
  "Compléter 100 % de ton profil": "Completar el 100 % de tu perfil",
  "Première étincelle": "Primera chispa",
  "Un premier match réciproque, validé des deux côtés.": "Un primer match mutuo, confirmado por ambas partes.",
  "Recevoir ton premier match mutuel": "Recibir tu primer match mutuo",
  "Premier message": "Primer mensaje",
  "Tu as ouvert la conversation : c'est souvent le pas le plus difficile.":
    "Has abierto la conversación: suele ser el paso más difícil.",
  "Envoyer ton premier message": "Enviar tu primer mensaje",
  "Une conversation nourrie par vos deux voix.": "Una conversación alimentada por vuestras dos voces.",
  "Avoir une conversation avec des messages des deux côtés":
    "Tener una conversación con mensajes de ambas partes",
  "Présence régulière": "Presencia constante",
  "Cinq jours d'activité sincère, sans course au volume.":
    "Cinco días de actividad sincera, sin carrera por el volumen.",
  "5 jours d'activité qualifiante": "5 días de actividad válida",
  "Ambassadeur bienveillant": "Embajador amable",
  "Le module de sensibilisation au respect et à la sécurité en ligne arrive bientôt.":
    "El módulo de concienciación sobre el respeto y la seguridad en línea llegará pronto.",
  "Terminer le parcours respect et sécurité en ligne": "Completar el curso de respeto y seguridad en línea",

  // ── messaging ────────────────────────────────────────────────────────────
  "Conversations ({total} · {unread} non lu{s})": "Conversaciones ({total} · {unread} sin leer)",
  "Les messages de plus de 3 mois sont supprimés automatiquement, lus ou non.":
    "Los mensajes de más de 3 meses se eliminan automáticamente, se hayan leído o no.",
  "{n} message(s)": "{n} mensaje(s)",
  "Vocaux et images disponibles": "Notas de voz e imágenes disponibles",
  "Ce compte a été supprimé — l'historique est conservé.": "Esta cuenta se ha eliminado: el historial se conserva.",
  "{name} : compte supprimé": "{name}: cuenta eliminada",
  "Tu as bloqué ce membre — la conversation est en pause.": "Has bloqueado a este miembro: la conversación está en pausa.",
  "{name} : bloqué par toi": "{name}: bloqueado por ti",
  "Ce membre a bloqué la communication.": "Este miembro ha bloqueado la comunicación.",
  "{name} : communication bloquée": "{name}: comunicación bloqueada",
  "Aucune conversation pour l'instant. Écris à un profil pour le retrouver ici.":
    "Aún no hay conversaciones. Escribe a un perfil y lo encontrarás aquí.",
  "Écris à {name}…": "Escribe a {name}…",
  "Écris ton message": "Escribe tu mensaje",
  "Insérer un émoji": "Insertar un emoji",
  Émojis: "Emojis",
  "Envoyer le vocal": "Enviar la nota de voz",
  "Annuler le vocal": "Cancelar la nota de voz",
  "Enregistrer un vocal": "Grabar una nota de voz",
  "Envoyer une image": "Enviar una imagen",
  "Choisir une image": "Elegir una imagen",
  "Envoi du vocal…": "Enviando la nota de voz…",
  "Envoi de l'image…": "Enviando la imagen…",
  "Agrandir la photo": "Ampliar la foto",
  "Signaler ce vocal": "Denunciar esta nota de voz",
  "Réagir à la photo": "Reaccionar a la foto",
  "Motif du signalement": "Motivo de la denuncia",
  "Signaler cette photo": "Denunciar esta foto",
  "Envoyer le signalement": "Enviar la denuncia",
  "Télécharger la photo": "Descargar la foto",
  "Sélectionne une conversation.": "Selecciona una conversación.",
  "Tes messages t'attendent": "Tus mensajes te esperan",
  "Crée un compte ou connecte-toi pour lire et envoyer des messages.":
    "Crea una cuenta o inicia sesión para leer y enviar mensajes.",
  "Continuer à parcourir les profils": "Seguir explorando perfiles",
  "Envoyer cette photo ?": "¿Enviar esta foto?",
  "Les photos partagées doivent respecter le règlement : pas de nudité, pas de contenu choquant, et seulement des personnes consentantes.":
    "Las fotos compartidas deben respetar las normas: sin desnudos, sin contenido impactante y solo personas que hayan dado su consentimiento.",
  "Aperçu de la photo à envoyer": "Vista previa de la foto que se enviará",
  "Message non envoyé": "Mensaje no enviado",
  "Signaler ce vocal ?": "¿Denunciar esta nota de voz?",
  "Choisis le motif — la modération l'examinera.": "Elige el motivo: la moderación lo revisará.",
  "Choisir un motif…": "Elegir un motivo…",
  "Signaler…": "Denunciar…",
  "Partager ton numéro ?": "¿Compartir tu número?",
  "Ton message semble contenir un numéro de téléphone. Ne partage tes coordonnées que si tu fais confiance à cette personne.":
    "Tu mensaje parece contener un número de teléfono. Solo comparte tus datos si confías en esta persona.",
  "Envoyer quand même": "Enviar de todos modos",
  "Voir profil de {name}": "Ver el perfil de {name}",
  "Dis bonjour à {name} !": "¡Saluda a {name}!",

  // ── statistics ───────────────────────────────────────────────────────────
  "Connecte-toi pour voir tes statistiques.": "Inicia sesión para ver tus estadísticas.",
  "Membre supprimé": "Miembro eliminado",
  Moi: "Yo",
  "90 derniers jours": "Últimos 90 días",
  "Depuis mon inscription": "Desde mi registro",
  Visites: "Visitas",
  "Likes reçus": "Likes recibidos",
  Matches: "Matches",
  "Sections des statistiques": "Secciones de estadísticas",
  "Vue d'ensemble": "Vista general",
  "Messages et conversations": "Mensajes y conversaciones",
  "Visibilité et progression": "Visibilidad y progreso",
  "Sécurité et confidentialité": "Seguridad y privacidad",
  "Impossible de charger tes statistiques.": "No se pudieron cargar tus estadísticas.",
  "Chargement de tes statistiques…": "Cargando tus estadísticas…",
  "Profil complété à {n} %": "Perfil completado al {n} %",
  "Voir mon profil": "Ver mi perfil",
  Performance: "Rendimiento",
  "{m} matches · {c} conversations": "{m} matches · {c} conversaciones",
  "Ton rapport": "Tu informe",
  "{n} conversations": "{n} conversaciones",
  "{n} avec réponse": "{n} con respuesta",
  "Ouvrir la messagerie": "Abrir la mensajería",
  Analytique: "Analítica",
  "Nouveaux matches": "Nuevos matches",
  "Activité récente": "Actividad reciente",
  "Type d'activité": "Tipo de actividad",
  Tout: "Todo",
  "Rechercher un membre…": "Buscar un miembro…",
  "Rechercher un membre": "Buscar un miembro",
  "Likes et interactions": "Likes e interacciones",
  "{sent} envoyés · {got} reçus · {m} matches mutuels.": "{sent} enviados · {got} recibidos · {m} matches mutuos.",
  "{n} de tes likes sont devenus des matches.": "{n} de tus likes se convirtieron en matches.",
  "Messages envoyés": "Mensajes enviados",
  "Messages reçus": "Mensajes recibidos",
  "Vocaux envoyés / reçus": "Notas de voz enviadas / recibidas",
  "Photos envoyées / reçues": "Fotos enviadas / recibidas",
  "Taux de réponse": "Tasa de respuesta",
  "Échantillon trop petit pour un taux fiable ({count}). Les chiffres ci-dessous restent indicatifs.":
    "Muestra demasiado pequeña para una tasa fiable ({count}). Las cifras siguientes son orientativas.",
  "{n} conversations commencées sur la période": "{n} conversaciones iniciadas en el periodo",
  "1 conversation commencée sur la période": "1 conversación iniciada en el periodo",
  "{replied} de tes {started} conversations commencées ont reçu une réponse ({pct} %). Le volume de messages ne mesure pas la compatibilité.":
    "{replied} de tus {started} conversaciones iniciadas recibieron respuesta ({pct} %). El volumen de mensajes no mide la compatibilidad.",
  "{n} correspondants distincts · en moyenne {avg} messages échangés par conversation (envoyés + reçus).":
    "{n} interlocutores distintos · de media {avg} mensajes intercambiados por conversación (enviados + recibidos).",
  "1 correspondant distinct · en moyenne {avg} messages échangés par conversation (envoyés + reçus).":
    "1 interlocutor distinto · de media {avg} mensajes intercambiados por conversación (enviados + recibidos).",
  "{n} conversations sans activité récente.": "{n} conversaciones sin actividad reciente.",
  "1 conversation sans activité récente.": "1 conversación sin actividad reciente.",
  Conversations: "Conversaciones",
  "{sent} envoyés · {got} reçus": "{sent} enviados · {got} recibidos",
  "{n} vocaux": "{n} notas de voz",
  "{n} photos": "{n} fotos",
  "avec réponse": "con respuesta",
  "sans réponse": "sin respuesta",
  "Dernière activité : {date}": "Última actividad: {date}",
  "Visibilité — {period}": "Visibilidad — {period}",
  "Cette semaine sur SWIVV MATCH : {views} visites de profil · {likes} likes reçus · {matches} nouveaux matches · {convos} nouvelles conversations.":
    "Esta semana en SWIVV MATCH: {views} visitas al perfil · {likes} likes recibidos · {matches} nuevos matches · {convos} nuevas conversaciones.",
  "Visiteurs récents": "Visitantes recientes",
  "Voir le profil": "Ver perfil",
  Signalements: "Denuncias",
  "Membres bloqués": "Miembros bloqueados",
  "M'ont bloqué": "Me han bloqueado",
  "Mes signalements": "Mis denuncias",
  "Tu n'as soumis aucun signalement.": "No has enviado ninguna denuncia.",
  "Mes blocs": "Mis bloqueos",
  "Tu n'as bloqué aucun membre.": "No has bloqueado a ningún miembro.",
  "{date} · Actif": "{date} · Activo",
  Débloquer: "Desbloquear",
  "Membres qui m'ont bloqué": "Miembros que me han bloqueado",
  "Aucun membre ne t'a bloqué.": "Ningún miembro te ha bloqueado.",
  Reçu: "Recibida",
  "En cours d'examen": "En revisión",
  "En attente": "Pendiente",
  Résolu: "Resuelta",
  "Classé sans suite": "Archivada",
  "Première activité sur la période.": "Primera actividad del periodo.",
  "Stable par rapport à la période précédente.": "Estable respecto al periodo anterior.",
  "par rapport à la période précédente.": "respecto al periodo anterior.",
  "Visites et likes reçus par jour sur les {days} derniers jours":
    "Visitas y likes recibidos por día en los últimos {days} días",
  "Visite de profil": "Visita al perfil",
  "Like envoyé": "Like enviado",
  "Like reçu": "Like recibido",
  "Match mutuel": "Match mutuo",
  "Aucune activité pour ce filtre.": "No hay actividad para este filtro.",
  "date inconnue": "fecha desconocida",
  "Interactions sur mes photos": "Interacciones en mis fotos",
  "{n} réactions actives en ce moment": "{n} reacciones activas ahora mismo",
  "1 réaction active en ce moment": "1 reacción activa ahora mismo",
  "{n} nouvelles sur la période": "{n} nuevas en el periodo",
  "1 nouvelle sur la période": "1 nueva en el periodo",
  "Réactions reçues": "Reacciones recibidas",
  "actives en ce moment": "activas ahora mismo",
  "sur la période": "en el periodo",
  "Membres ayant réagi": "Miembros que reaccionaron",
  "au total": "en total",
  "Photos avec réactions": "Fotos con reacciones",
  "Photo la plus réactive": "Foto con más reacciones",
  "Répartition des réactions actives": "Distribución de las reacciones activas",
  "Nouvelles réactions par jour": "Nuevas reacciones por día",
  "Nouvelles réactions par jour sur les {days} derniers jours":
    "Nuevas reacciones por día en los últimos {days} días",
  "{n} nouvelles réactions": "{n} nuevas reacciones",
  "Performance de mes photos": "Rendimiento de mis fotos",
  "Trier :": "Ordenar:",
  "Plus de réactions": "Más reacciones",
  "Activité ancienne": "Actividad más antigua",
  "« Récent / ancien » = dernière réaction reçue (les dates d'ajout par photo ne sont pas suivies).":
    "«Reciente / antigua» = última reacción recibida (no se registran las fechas de subida por foto).",
  "{n} réactions": "{n} reacciones",
  "1 réaction": "1 reacción",
  "{n} membres": "{n} miembros",
  "1 membre": "1 miembro",
  "{emoji} {label} en tête": "{emoji} {label} a la cabeza",
  "Aucune réaction active": "Ninguna reacción activa",
  "Rien ici pour le moment.": "Nada por aquí todavía.",
  "T'a liké": "Te ha dado like",
  "Tu as liké": "Le has dado like",
  "Ce score mesure la complétude de ton profil, pas ton attractivité ni tes chances de rencontrer quelqu'un.":
    "Esta puntuación mide la completitud de tu perfil, no tu atractivo ni tus posibilidades de conocer a alguien.",
  "Sections incomplètes : {list}.": "Secciones incompletas: {list}.",
  "{n} autres": "{n} más",
  "Profil complet, bravo !": "Perfil completo, ¡enhorabuena!",
  "Complète ton profil maintenant": "Completa tu perfil ahora",
  "Comment améliorer mon profil ?": "¿Cómo puedo mejorar mi perfil?",
  "Rien à signaler : ton profil est bien rempli. Les suggestions apparaîtront ici si quelque chose manque.":
    "Nada que señalar: tu perfil está bien rellenado. Las sugerencias aparecerán aquí si falta algo.",
  "À compléter": "Por completar",
  Recommandé: "Recomendado",
  Optionnel: "Opcional",
  "Tu n'as pas de photo de profil. Ajoute une photo claire et récente qui te représente bien.":
    "No tienes foto de perfil. Añade una foto clara y reciente que te represente bien.",
  "Ton profil ne contient qu'une seule photo. Ajouter une photo supplémentaire pourrait donner une vision plus complète de ton profil.":
    "Tu perfil solo tiene una foto. Añadir otra podría dar una visión más completa de ti.",
  "Ton titre est vide. Une phrase distinctive aide les autres membres à te remarquer.":
    "Tu titular está vacío. Una frase distintiva ayuda a que otros miembros te noten.",
  "Ton titre (« {tagline} ») est très court ou générique. Inspire-toi de tes centres d'intérêt pour le rendre plus personnel — par exemple à partir de « {interests} ». Ce n'est qu'une piste, à valider par toi.":
    "Tu titular («{tagline}») es muy corto o genérico. Inspírate en tus intereses para hacerlo más personal, por ejemplo a partir de «{interests}». Solo es una idea, valórala tú.",
  "tes loisirs": "tus aficiones",
  "Ton titre est presque tout en majuscules, ce qui peut donner une impression de cri. Envisage une casse normale.":
    "Tu titular está casi todo en mayúsculas, lo que puede dar sensación de grito. Prueba con mayúsculas y minúsculas normales.",
  "Ta section « À propos de moi » est vide. Ajoute quelques phrases pour aider les autres membres à mieux te connaître et à entamer la conversation.":
    "Tu sección «Sobre mí» está vacía. Añade algunas frases para ayudar a los demás a conocerte y a iniciar la conversación.",
  "Ta présentation est très courte. Quelques phrases sur tes valeurs, tes loisirs ou tes intentions aideraient à démarrer des échanges.":
    "Tu presentación es muy corta. Unas frases sobre tus valores, aficiones o intenciones ayudarían a empezar conversaciones.",
  "Ta présentation est très longue. Une version plus concise a plus de chances d'être lue en entier.":
    "Tu presentación es muy larga. Una versión más concisa tiene más probabilidades de leerse entera.",
  "Ajoute tes centres d'intérêt : c'est le moyen le plus simple de donner aux autres une accroche pour t'écrire.":
    "Añade tus intereses: es la forma más sencilla de dar a los demás un motivo para escribirte.",
  "Tu reçois des visites, mais peu de likes. Pense à vérifier ta photo principale et ta présentation. L'activité dépend aussi des préférences, de la localisation et du nombre de membres actifs.":
    "Recibes visitas, pero pocos likes. Revisa tu foto principal y tu presentación. La actividad también depende de las preferencias, la ubicación y el número de miembros activos.",
  "Tu as {n} conversations en cours. Continue à privilégier les échanges qui t'intéressent réellement.":
    "Tienes {n} conversaciones en curso. Sigue dando prioridad a los intercambios que realmente te interesan.",
  "Tu as 1 conversation en cours. Continue à privilégier les échanges qui t'intéressent réellement.":
    "Tienes 1 conversación en curso. Sigue dando prioridad a los intercambios que realmente te interesan.",
  "Ajouter une photo": "Añadir una foto",
  "Compléter ma présentation": "Completar mi presentación",
  "Revoir mon profil": "Revisar mi perfil",
  "Voir mes messages": "Ver mis mensajes",
  Amitié: "Amistad",
  "Mes Likes": "Mis Likes",
  "Profils likés": "Perfiles con like",

  // ── notification templates (stored French copy) ──────────────────────────
  "Nouveau message": "Nuevo mensaje",
  "Nouveau message vocal": "Nuevo mensaje de voz",
  "Nouvelle photo": "Nueva foto",
  "Nouveau like": "Nuevo like",
  "C'est un match !": "¡Es un match!",
  "Réaction à ta photo": "Reacción a tu foto",
  "Profil vérifié": "Perfil verificado",
  "Sécurité du compte": "Seguridad de la cuenta",
  "Complète ton profil": "Completa tu perfil",
  "Membre bloqué": "Miembro bloqueado",
  "Blocage levé": "Bloqueo levantado",
  "{name} a consulté ton profil.": "{name} ha visitado tu perfil.",
  "{name} t'a écrit.": "{name} te ha escrito.",
  "{name} t'a envoyé un message vocal.": "{name} te ha enviado una nota de voz.",
  "{name} t'a envoyé une photo.": "{name} te ha enviado una foto.",
  "{name} s'intéresse à ton profil.": "A {name} le interesa tu perfil.",
  "Toi et {name} vous êtes plu.": "{name} y tú os gustasteis.",
  "{name} ne peut plus te contacter ni voir ton profil.": "{name} ya no puede contactarte ni ver tu perfil.",
  "La communication avec {name} est de nouveau possible.": "La comunicación con {name} vuelve a ser posible.",
  "{emoji} Un membre a réagi à l'une de tes photos.": "{emoji} Un miembro ha reaccionado a una de tus fotos.",
  "← Retour": "← Atrás",
  "Ignorer": "Omitir",
  "Un instant…": "Un momento…",
  "Créer mon compte": "Crear mi cuenta",
  "Terminer": "Terminar",
  "Sauvegarder et continuer": "Guardar y continuar",
  "Revoir tout mon profil": "Revisar todo mi perfil",
  "Étape {n}/{total}": "Paso {n}/{total}",
  "Question {n}/{total}": "Pregunta {n}/{total}",
  "Très bien {name}, parle-nous de toi.": "Muy bien, {name}: háblanos de ti.",
  "Ou clique sur Ignorer pour passer.": "O toca Omitir para continuar.",
  "Origines & photos": "Orígenes y fotos",
  "Enregistrer cette étape": "Guardar este paso",
  "Création…": "Creando…",
  "Annuler et retour au profil": "Cancelar y volver al perfil",
  "Les mots de passe correspondent.": "Las contraseñas coinciden.",
  "Les mots de passe ne correspondent pas.": "Las contraseñas no coinciden.",
  "Tu es": "Eres",
  "Tu veux rencontrer": "Quieres conocer a",
  "Une femme": "Una mujer",
  "Un homme": "Un hombre",
  "Ton mot de passe (8 caractères min)": "Tu contraseña (mín. 8 caracteres)",
  "Confirme ton mot de passe": "Confirma tu contraseña",
  "Ta nationalité": "Tu nacionalidad",
  "Seconde nationalité": "Segunda nacionalidad",
  "+ Ajouter une seconde nationalité": "+ Añadir una segunda nacionalidad",
  "Tes autres langues": "Tus otros idiomas",
  "Tes centres d'intérêt": "Tus intereses",
  "Ajouter ton propre loisir…": "Añade tu propia afición…",
  "Tes photos (1 à 5, 2,5 Mo max)": "Tus fotos (de 1 a 5, máx. 2,5 MB)",
  "+ Ajouter mes photos": "+ Añadir mis fotos",
  "✓ CGU détaillées acceptées.": "✓ Términos detallados aceptados.",
  "Lis et accepte les CGU détaillées pour continuer.": "Lee y acepta los términos detallados para continuar.",
  "Relire": "Volver a leer",
  "Ouvrir les CGU détaillées": "Abrir los términos detallados",
  "Je certifie avoir 18 ans ou plus et accepter les": "Certifico que tengo 18 años o más y acepto los",
  "Je consens, lorsque cela est nécessaire et conformément à la réglementation applicable, au traitement de mes données personnelles sensibles ainsi qu'à l'utilisation de systèmes de filtrage et de sécurité des messages par SWIVV, aux fins de fournir, sécuriser et améliorer ses services.": "Consiento, cuando sea necesario y conforme a la normativa aplicable, el tratamiento de mis datos personales sensibles y el uso por parte de SWIVV de sistemas de filtrado y seguridad de mensajes con el fin de prestar, proteger y mejorar sus servicios.",
  "Merci pour ton inscription !": "¡Gracias por registrarte!",
  "On t'a envoyé un e-mail à": "Te hemos enviado un correo a",
  "clique sur son lien pour confirmer ton adresse et activer ton compte.": "haz clic en su enlace para confirmar tu dirección y activar tu cuenta.",
  "Pas reçu ? Vérifie tes spams, ou": "¿No lo has recibido? Revisa el spam o",
  "Renvoyer l'e-mail de confirmation": "Reenviar el correo de confirmación",
  "Quelle est ta date de naissance ?": "¿Cuál es tu fecha de nacimiento?",
  "SWIVV est réservé aux 18 ans et plus.": "SWIVV es solo para mayores de 18 años.",
  "Je suis… je cherche…": "Soy… busco…",
  "Pour te montrer les bons profils dès le départ.": "Para mostrarte los perfiles adecuados desde el principio.",
  "Quel âge ont les profils que tu cherches ?": "¿Qué edad tienen los perfiles que buscas?",
  "Retrouvés automatiquement dans Mes Matches.": "Se guardan automáticamente en Mis Matches.",
  "Où habites-tu ?": "¿Dónde vives?",
  "Quel est ton prénom ?": "¿Cuál es tu nombre?",
  "Quel est ton e-mail ?": "¿Cuál es tu correo electrónico?",
  "Pour te connecter et recevoir tes invitations.": "Para iniciar sesión y recibir tus invitaciones.",
  "Crée ton mot de passe.": "Crea tu contraseña.",
  "Dernière étape : tes accords.": "Último paso: tus consentimientos.",
  "Ton pays": "Tu país",
  "Que recherches-tu ?": "¿Qué buscas?",
  "Cette réponse apparaît sur ton profil.": "Esta respuesta aparece en tu perfil.",
  "Ton statut matrimonial": "Tu estado civil",
  "Ta phrase d'accroche": "Tu frase de presentación",
  "Quelques mots suffisent pour marquer les esprits. (10 caractères min)": "Bastan unas palabras para destacar. (mín. 10 caracteres)",
  "Parle-nous de toi": "Háblanos de ti",
  "Sois naturel, honnête, spontané. (20 caractères min)": "Sé natural, sincero y espontáneo. (mín. 20 caracteres)",
  "Ta taille": "Tu altura",
  "Ton poids": "Tu peso",
  "Tes cheveux": "Tu pelo",
  "Tes yeux": "Tus ojos",
  "Ta silhouette": "Tu complexión",
  "Tes origines": "Tus orígenes",
  "Donnée sensible, traitée uniquement pour le service.": "Dato sensible, tratado solo para el servicio.",
  "Ton style": "Tu estilo",
  "Mes plus beaux atouts": "Mis mejores cualidades",
  "Sélectionne jusqu'à 5 qualités qui te correspondent.": "Elige hasta 5 cualidades que te definan.",
  "Ton métier": "Tu profesión",
  "Tes études": "Tus estudios",
  "Alcool ?": "¿Alcohol?",
  "Tabac ?": "¿Tabaco?",
  "Drogue ?": "¿Drogas?",
  "Ton alimentation": "Tu alimentación",
  "Ta situation professionnelle": "Tu situación laboral",
  "Tes revenus annuels": "Tus ingresos anuales",
  "Ton logement": "Tu vivienda",
  "As-tu des animaux ?": "¿Tienes animales?",
  "Veux-tu (d'autres) animaux ?": "¿Quieres (más) animales?",
  "As-tu des enfants ?": "¿Tienes hijos?",
  "Veux-tu (d'autres) enfants ?": "¿Quieres (más) hijos?",
  "Combien de frères as-tu ?": "¿Cuántos hermanos tienes?",
  "Combien de sœurs as-tu ?": "¿Cuántas hermanas tienes?",
  "0 si aucun.": "0 si no tienes.",
  "0 si aucune.": "0 si no tienes.",
  "Ton rang dans la fratrie": "Tu lugar entre hermanos",
  "La situation de tes parents": "La situación de tus padres",
  "Ta langue maternelle": "Tu lengua materna",
  "Ta religion": "Tu religión",
  "Ta pratique religieuse": "Tu práctica religiosa",
  "Tes valeurs familiales": "Tus valores familiares",
  "Pour de meilleurs matchs.": "Para mejores matches.",
  "Mets un visage sur ton nom": "Ponle cara a tu nombre",
  "Une photo minimum — les profils avec photo reçoivent plus de messages.": "Al menos una foto: los perfiles con foto reciben más mensajes.",
  "Ta date de naissance est obligatoire.": "Tu fecha de nacimiento es obligatoria.",
  "Indique si tu es une femme ou un homme.": "Indica si eres mujer u hombre.",
  "Dis si tu veux rencontrer une femme ou un homme.": "Indica si quieres conocer a una mujer o a un hombre.",
  "Indique l'âge min et max recherchés.": "Indica la edad mín. y máx. que buscas.",
  "Les âges doivent être entre 18 et 99 ans.": "Las edades deben estar entre 18 y 99 años.",
  "L'âge min doit être inférieur à l'âge max.": "La edad mín. debe ser menor que la máx.",
  "Ta ville est obligatoire.": "Tu ciudad es obligatoria.",
  "Ton prénom est obligatoire.": "Tu nombre es obligatorio.",
  "Un e-mail valide est obligatoire.": "Se requiere un correo válido.",
  "La confirmation du mot de passe ne correspond pas.": "La confirmación de la contraseña no coincide.",
  "Ouvre les CGU détaillées, lis jusqu'en bas et clique Accepter.": "Abre los términos detallados, lee hasta el final y pulsa Aceptar.",
  "Certifie tes 18 ans et accepte les CGU, les CGV et les cookies.": "Confirma que tienes 18 años y acepta los términos, las condiciones de venta y las cookies.",
  "Consens au traitement de tes données sensibles pour continuer.": "Consiente el tratamiento de tus datos sensibles para continuar.",
  "Ton pays est obligatoire.": "Tu país es obligatorio.",
  "Choisis ce que tu recherches.": "Elige lo que buscas.",
  "Ton statut matrimonial est obligatoire.": "Tu estado civil es obligatorio.",
  "Ta phrase d'accroche (10 caractères min) est obligatoire.": "Tu frase de presentación (mín. 10 caracteres) es obligatoria.",
  "Ta bio (20 caractères min) est obligatoire.": "Tu biografía (mín. 20 caracteres) es obligatoria.",
  "Ta taille (140-220 cm) est obligatoire.": "Tu altura (140-220 cm) es obligatoria.",
  "Ton poids (35-200 kg) est obligatoire.": "Tu peso (35-200 kg) es obligatorio.",
  "Ta couleur de cheveux est obligatoire.": "Tu color de pelo es obligatorio.",
  "Ta couleur des yeux est obligatoire.": "Tu color de ojos es obligatorio.",
  "Ta silhouette est obligatoire.": "Tu complexión es obligatoria.",
  "Ton origine est obligatoire.": "Tu origen es obligatorio.",
  "Ton style est obligatoire.": "Tu estilo es obligatorio.",
  "Choisis au moins un atout (5 maximum).": "Elige al menos una cualidad (máx. 5).",
  "Ton métier est obligatoire.": "Tu profesión es obligatoria.",
  "Tes études sont obligatoires.": "Tus estudios son obligatorios.",
  "Le champ alcool est obligatoire.": "El campo alcohol es obligatorio.",
  "Le champ tabac est obligatoire.": "El campo tabaco es obligatorio.",
  "Le champ drogue est obligatoire.": "El campo drogas es obligatorio.",
  "Ton alimentation est obligatoire.": "Tu alimentación es obligatoria.",
  "Ta situation professionnelle est obligatoire.": "Tu situación laboral es obligatoria.",
  "Tes revenus sont obligatoires.": "Tus ingresos son obligatorios.",
  "Ton logement est obligatoire.": "Tu vivienda es obligatoria.",
  "Dis si tu as des animaux.": "Indica si tienes animales.",
  "Dis si tu veux (d'autres) animaux.": "Indica si quieres (más) animales.",
  "Dis si tu as des enfants.": "Indica si tienes hijos.",
  "Dis si tu veux (d'autres) enfants.": "Indica si quieres (más) hijos.",
  "Le nombre de frères est obligatoire (0 si aucun).": "El número de hermanos es obligatorio (0 si no tienes).",
  "Le nombre de sœurs est obligatoire (0 si aucune).": "El número de hermanas es obligatorio (0 si no tienes).",
  "La situation de tes parents est obligatoire.": "La situación de tus padres es obligatoria.",
  "Ta nationalité est obligatoire.": "Tu nacionalidad es obligatoria.",
  "Ta langue maternelle est obligatoire.": "Tu lengua materna es obligatoria.",
  "Ta religion de naissance est obligatoire.": "Tu religión de nacimiento es obligatoria.",
  "Ta religion est obligatoire.": "Tu religión es obligatoria.",
  "Ta pratique religieuse est obligatoire.": "Tu práctica religiosa es obligatoria.",
  "Tes valeurs familiales sont obligatoires.": "Tus valores familiares son obligatorios.",
  "Au moins un centre d'intérêt est obligatoire.": "Se requiere al menos un interés.",
  "Choisis au moins une photo.": "Elige al menos una foto.",
  "Compte déjà créé, on continue.": "Cuenta ya creada: sigamos.",
  "Oui": "Sí",
  "Non": "No",
  "Peut-être": "Quizás",
  "Occasionnellement": "Ocasionalmente",
  "Oui (vin)": "Sí (vino)",
  "Oui (fêtes)": "Sí (fiestas)",
  "Équilibrée": "Equilibrada",
  "De tout": "De todo",
  "Halal": "Halal",
  "Végétarienne": "Vegetariana",
  "Vegan": "Vegana",
  "Gastronomique": "Gourmet",
  "Casher": "Kosher",
  "Célibataire": "Soltero/a",
  "Séparé": "Separado",
  "Séparée": "Separada",
  "Divorcé": "Divorciado",
  "Divorcée": "Divorciada",
  "Veuf": "Viudo",
  "Veuve": "Viuda",
  "Mariés": "Casados",
  "Divorcés": "Divorciados",
  "Séparés": "Separados",
  "Veuf / Veuve": "Viudo/a",
  "Remariés": "Vueltos a casar",
  "Décédés": "Fallecidos",
  "Très proche de ma famille": "Muy unido a mi familia",
  "Proche de ma famille": "Unido a mi familia",
  "Pas trop proche de ma famille": "No muy unido a mi familia",
  "Famille unie": "Familia unida",
  "Famille nombreuse": "Familia numerosa",
  "Petite famille": "Familia pequeña",
  "Traditionnelle": "Tradicional",
  "Moderne": "Moderna",
  "Autonome": "Independiente",
  "Noirs": "Negro",
  "Bruns": "Castaño",
  "Châtains": "Castaño claro",
  "Blonds": "Rubio",
  "Roux": "Pelirrojo",
  "Gris": "Gris",
  "Blancs": "Blanco",
  "Poivre et sel": "Sal y pimienta",
  "Colorés": "Teñido",
  "Chauve": "Calvo",
  "Marron": "Marrón",
  "Noisette": "Avellana",
  "Verts": "Verdes",
  "Bleus": "Azules",
  "Mince": "Delgado",
  "Moyen": "Medio",
  "Moyenne": "Media",
  "Athlétique": "Atlético",
  "Sportif": "Deportista",
  "Sportive": "Deportista",
  "Musclé": "Musculoso",
  "Musclée": "Musculosa",
  "Rond": "Con curvas",
  "Ronde": "Con curvas",
  "Corpulent": "Corpulento",
  "Corpulente": "Corpulenta",
};
