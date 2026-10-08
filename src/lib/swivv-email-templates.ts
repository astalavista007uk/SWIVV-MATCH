/**
 * Transactional + lifecycle email templates for SWIVV MATCH (dating).
 *
 * Same architecture as the PET BASE email-templates module: one shared
 * branded wrapper + one builder per email returning { subject, html }.
 * Send via sendEmail() from "@/lib/email" (Resend) from a server function.
 */

// ponytail: placeholder domain until the prod URL is confirmed — swap in one place
const SITE = "https://swivvdating.com";
// ponytail: single moderation inbox (reports, verifications, complaints) — Resend/server fan-out when SMTP keys exist, mailto until then
export const MODERATION_EMAIL = "akram.benchikh@yahoo.com";
// ponytail: relative logo in dev so /emails preview loads it same-origin — absolute prod URL in sent mail; real CDN if clients ever block it
const LOGO_URL = import.meta.env.DEV ? "/swivv-match-logo.jpg" : `${SITE}/swivv-match-logo.jpg`;
const PRIMARY = "#e91e63";
const ACCENT_RED = "#dc2626";
const BG_OUTER = "#f7f8fb";
const CARD_BORDER = "#eef0f6";
const TEXT_DARK = "#333333";
const TEXT_MUTED = "#6b7280";
const FONT = "'Nunito','Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif";

function escapeHtml(t: string): string {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/** Small heart mark for the header. */
const HEART = (size = 20, color = "#fff") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:${size}px;height:${size}px;vertical-align:middle;" fill="${color}"><path d="M12 21C5 15.5 2 12 2 8.5 2 5.5 4.5 3.5 7 3.5c1.9 0 3.6 1.1 4.7 2.9C12.8 4.6 14.5 3.5 16.4 3.5c2.5 0 5 2 5 5 0 3.5-3 7-9.4 12.5z"/></svg>`;

export function buildSwivvEmailHtml({
  title, bodyHtml, preheader,
}: {
  title: string; bodyHtml: string; preheader?: string;
}): string {
  const legalLinks = ["CGU", "Confidentialité", "Contact"];
  const legalUrls = [`${SITE}/legal/terms`, `${SITE}/legal/privacy`, `${SITE}/contact-us`];
  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="color-scheme" content="light only"/>
<title>${escapeHtml(title)}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');</style>
</head><body style="margin:0;padding:0;background:${BG_OUTER};font-family:${FONT};-webkit-font-smoothing:antialiased;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_OUTER};padding:28px 16px;">
<tr><td align="center">

<table role="presentation" cellpadding="0" cellspacing="0" style="width:592px;max-width:592px;background:#ffffff;border:1px solid ${CARD_BORDER};border-collapse:separate;border-spacing:0;">

<tr><td style="background:${PRIMARY};padding:6px 36px;text-align:center;border-radius:28px 28px 0 0;">
<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td align="center" style="background:#ffffff;border-radius:8px;padding:2px 12px;">
<img src="${LOGO_URL}" alt="SWIVV MATCH" width="130" style="display:block;width:130px;max-width:100%;height:auto;border:0;font-size:22px;font-weight:900;color:#e91e63;letter-spacing:-0.5px;" />
</td></tr></table>
</td></tr>

<tr><td style="background:#ffffff;padding:36px 36px 28px;border-top:1px solid #f2f3f8;">
${bodyHtml}
</td></tr>

<tr><td style="background:${PRIMARY};padding:22px 36px 24px;border-radius:0 0 28px 28px;">
<div style="text-align:center;font-size:18px;font-weight:800;color:#fff;line-height:1.4;margin-bottom:6px;">Your Match. Your Story.</div>
<div style="text-align:center;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;margin-bottom:16px;">Des profils vérifiés près de chez toi, des matches qui te ressemblent.</div>
<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td style="border-radius:50px;background:#ffffff;">
<a href="${SITE}/browse" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:800;color:${PRIMARY};text-decoration:none;border-radius:50px;font-family:${FONT};">Voir les profils</a>
</td></tr></table>
</td></tr>

</table>

<table role="presentation" cellpadding="0" cellspacing="0" style="width:592px;max-width:592px;margin-top:4px;">
<tr><td style="text-align:center;padding:12px 0;">
<img src="${LOGO_URL}" alt="SWIVV MATCH" width="120" style="display:inline-block;width:120px;max-width:100%;height:auto;border:0;font-size:14px;font-weight:900;color:#333333;vertical-align:middle;mix-blend-mode:multiply;" />
<span style="display:inline-block;margin-left:10px;">
${legalLinks.map((l, i) => `<a href="${legalUrls[i]}" style="color:${TEXT_MUTED};text-decoration:none;font-size:11px;font-weight:600;margin:0 3px;">${l}</a>`).join("")}
</span>
</td></tr>
<tr><td style="text-align:center;font-size:11px;color:${TEXT_MUTED};line-height:1.6;">
10 Rue Thureau Dangin &middot; 75015 Paris &middot; France<br/>
&copy; ${new Date().getFullYear()} SWIVV MATCH &middot; <a href="${SITE}" style="color:${TEXT_MUTED};text-decoration:none;">swivvdating.com</a><br/>
Tu reçois cet e-mail car tu as un compte SWIVV. <a href="${SITE}/notifications" style="color:${TEXT_MUTED};">Gérer mes notifications</a>
</td></tr>
</table>

</td></tr></table>
</body></html>`;
}

/** Greeting headline. */
function hi(name: string, line: string): string {
  return `<div style="font-size:22px;font-weight:800;color:${TEXT_DARK};line-height:1.3;margin-bottom:12px;">Salut ${escapeHtml(name)}, ${line}</div>`;
}

/** Body paragraph. */
function p(text: string): string {
  return `<div style="font-size:15px;color:${TEXT_DARK};line-height:1.7;margin-bottom:12px;">${text}</div>`;
}

/** Muted small print. */
function small(text: string): string {
  return `<div style="font-size:12px;color:${TEXT_MUTED};line-height:1.6;margin-top:16px;">${text}</div>`;
}

/** CTA button — pill-shaped, teal (red for likes). */
function btn(text: string, url: string, color = PRIMARY): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr><td style="border-radius:50px;background:${color};text-align:center;">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 36px;font-size:15px;font-weight:800;color:#fff;text-decoration:none;border-radius:50px;font-family:${FONT};">${escapeHtml(text)}</a>
</td></tr></table>`;
}

/** Highlight stat card (count + label). */
function stat(count: number | string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto;background:#f2f8f8;border-radius:14px;"><tr><td style="padding:16px 32px;text-align:center;">
<div style="font-size:32px;font-weight:900;color:${PRIMARY};line-height:1;">${escapeHtml(String(count))}</div>
<div style="font-size:13px;font-weight:700;color:${TEXT_MUTED};margin-top:4px;">${escapeHtml(label)}</div>
</td></tr></table>`;
}

export type SwivvEmail = { subject: string; html: string };

/** 1 — Vérification d'e-mail (lien magique / code). */
export function swivvVerifyEmail({ name, verifyUrl }: { name: string; verifyUrl: string }): SwivvEmail {
  return {
    subject: "Vérifie ton e-mail pour activer ton compte SWIVV",
    html: buildSwivvEmailHtml({
      title: "Vérifie ton e-mail",
      preheader: "Un clic et ton compte SWIVV est activé.",
      bodyHtml:
        hi(name, "plus qu'une étape !") +
        p("Clique sur le bouton ci-dessous pour vérifier ton adresse e-mail et activer ton compte. Ce lien expire dans 24 heures.") +
        btn("Vérifier mon e-mail", verifyUrl) +
        small("Si tu n'as pas créé de compte SWIVV, ignore simplement cet e-mail."),
    }),
  };
}

/** 2 — Bienvenue après inscription. */
export function swivvWelcome({ name }: { name: string }): SwivvEmail {
  return {
    subject: `${name}, bienvenue sur SWIVV MATCH !`,
    html: buildSwivvEmailHtml({
      title: "Bienvenue sur SWIVV",
      preheader: "Ton profil est créé. Voici comment démarrer.",
      bodyHtml:
        hi(name, "bienvenue !") +
        p("Ton compte est prêt. Complète ton profil avec de belles photos et une description qui te ressemble : les profils complets reçoivent beaucoup plus de likes.") +
        btn("Compléter mon profil", `${SITE}/mon-profil`) +
        p("Ensuite, explore les profils près de chez toi, like, matche… et discute !") +
        btn("Découvrir les profils", `${SITE}/browse`),
    }),
  };
}

/** 3 — Profil incomplet (relance onboarding). */
export function swivvProfileIncomplete({ name, percent }: { name: string; percent: number }): SwivvEmail {
  return {
    subject: `Ton profil est complet à ${percent} % — finis-le pour plus de matches`,
    html: buildSwivvEmailHtml({
      title: "Termine ton profil",
      preheader: `Plus que ${100 - percent} % avant un profil qui attire.`,
      bodyHtml:
        hi(name, "ton profil mérite mieux.") +
        stat(`${percent} %`, "profil complété") +
        p("Ajoute des photos, tes centres d'intérêt et ta description : chaque section remplie augmente tes chances de match.") +
        btn("Terminer mon profil", `${SITE}/mon-profil`),
    }),
  };
}

/** 4 — Like reçu. */
export function swivvNewLike({ name, likerName }: { name: string; likerName: string }): SwivvEmail {
  return {
    subject: `${likerName} a liké ton profil !`,
    html: buildSwivvEmailHtml({
      title: "Nouveau like",
      preheader: `${likerName} s'intéresse à toi.`,
      bodyHtml:
        hi(name, "quelqu'un a flashé sur toi.") +
        stat("♥", "nouveau like") +
        p(`<strong>${escapeHtml(likerName)}</strong> vient de liker ton profil. Va voir son profil — et si c'est réciproque, c'est un match !`) +
        btn("Voir ce profil", `${SITE}/browse`, ACCENT_RED),
    }),
  };
}

/** 5 — Match mutuel. */
export function swivvNewMatch({ name, matchName }: { name: string; matchName: string }): SwivvEmail {
  return {
    subject: `C'est un match avec ${matchName} !`,
    html: buildSwivvEmailHtml({
      title: "Nouveau match",
      preheader: `Toi et ${matchName} vous êtes plu. À toi de jouer !`,
      bodyHtml:
        hi(name, "c'est un match !") +
        stat("♥♥", "match mutuel") +
        p(`Bonne nouvelle : <strong>${escapeHtml(matchName)}</strong> t'a liké en retour. Les premiers messages qui marchent le mieux sont personnels : rebondis sur une photo ou un centre d'intérêt.`) +
        btn("Envoyer un message", `${SITE}/messagerie`, ACCENT_RED),
    }),
  };
}

/** 6 — Message reçu. */
export function swivvNewMessage({ name, senderName, preview }: { name: string; senderName: string; preview: string }): SwivvEmail {
  const clean = preview.length > 140 ? `${preview.slice(0, 140)}…` : preview;
  return {
    subject: `${senderName} t'a envoyé un message`,
    html: buildSwivvEmailHtml({
      title: "Nouveau message",
      preheader: `${senderName} : ${clean}`,
      bodyHtml:
        hi(name, "tu as un nouveau message.") +
        p(`<strong>${escapeHtml(senderName)}</strong> t'a écrit :`) +
        `<div style="background:#f2f8f8;border-radius:14px;padding:16px 20px;font-size:15px;font-style:italic;color:${TEXT_DARK};line-height:1.6;margin-bottom:12px;">« ${escapeHtml(clean)} »</div>` +
        btn("Lire et répondre", `${SITE}/messagerie`) +
        small("Astuce : répondre vite garde la conversation en vie."),
    }),
  };
}

/** 7 — Récap d'activité (likes + messages non lus). */
export function swivvActivityDigest({ name, likes, messages }: { name: string; likes: number; messages: number }): SwivvEmail {
  return {
    subject: `${likes} likes et ${messages} messages t'attendent sur SWIVV`,
    html: buildSwivvEmailHtml({
      title: "Ton récap",
      preheader: "Ne laisse pas tes admirateurs sans réponse.",
      bodyHtml:
        hi(name, "on parle de toi !") +
        stat(likes, likes > 1 ? "nouveaux likes" : "nouveau like") +
        p(`Tu as aussi <strong>${messages} message${messages > 1 ? "s" : ""} non lu${messages > 1 ? "s" : ""}</strong>. Fais un tour avant que tes matches ne refroidissent.`) +
        btn("Voir mon activité", `${SITE}/browse`, ACCENT_RED),
    }),
  };
}

/** 8 — Nouveaux profils près de chez toi. */
export function swivvNewNearby({ name, city, count }: { name: string; city: string; count: number }): SwivvEmail {
  return {
    subject: `${count} nouveaux profils près de ${city}`,
    html: buildSwivvEmailHtml({
      title: "Nouveaux profils",
      preheader: `${count} personnes viennent d'arriver près de ${city}.`,
      bodyHtml:
        hi(name, "du nouveau près de chez toi.") +
        stat(count, `nouveaux profils à ${city}`) +
        p("Les nouveaux profils sont les plus réactifs : sois parmi les premiers à les découvrir.") +
        btn("Découvrir", `${SITE}/browse`),
    }),
  };
}

/** 9 — Invitation à témoigner (couple formé via SWIVV). */
export function swivvTestimonialInvite({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Vous vous êtes dit oui grâce à SWIVV ? Racontez-nous !",
    html: buildSwivvEmailHtml({
      title: "Partage ton histoire",
      preheader: "Ton témoignage inspirera les prochains couples.",
      bodyHtml:
        hi(name, "une belle histoire à raconter ?") +
        p("Si SWIVV t'a permis de rencontrer quelqu'un de spécial, partage ton témoignage et vos photos : après validation par notre équipe, il inspirera la communauté sur le blog.") +
        btn("Partager notre témoignage", `${SITE}/temoignage`),
    }),
  };
}

/** 10 — Conseils de sécurité avant une rencontre IRL. */
export function swivvSafetyTips({ name }: { name: string }): SwivvEmail {
  const tips = [
    "Rencontre-toi toujours dans un lieu public pour les premiers rendez-vous.",
    "Préviens un proche : où tu vas, avec qui, et quand tu rentres.",
    "Garde un moyen de transport indépendant pour partir quand tu veux.",
    "Ne communique jamais ton adresse, tes codes ou de l'argent.",
  ];
  return {
    subject: "4 réflexes sécurité avant ton premier rendez-vous",
    html: buildSwivvEmailHtml({
      title: "Reste safe",
      preheader: "Nos conseils avant de rencontrer quelqu'un en vrai.",
      bodyHtml:
        hi(name, "un rendez-vous en vue ?") +
        p("Super ! Avant de rencontrer quelqu'un dans la vraie vie, garde ces réflexes :") +
        `<ul style="font-size:15px;color:${TEXT_DARK};line-height:1.8;padding-left:20px;margin:0 0 12px;">${tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>` +
        btn("Signaler un abus", `${SITE}/contact-us`) +
        small("Un comportement suspect ? Signale le profil depuis sa page ou via le centre d'aide."),
    }),
  };
}

/** 11 — Réengagement (compte inactif). */
export function swivvWeMissYou({ name, likes }: { name: string; likes: number }): SwivvEmail {
  return {
    subject: `${name}, ${likes} personnes se sont intéressées à toi pendant ton absence`,
    html: buildSwivvEmailHtml({
      title: "Tu nous manques",
      preheader: "Ton profil continue de plaire. Reviens voir !",
      bodyHtml:
        hi(name, "tu nous as manqué.") +
        (likes > 0
          ? stat(likes, likes > 1 ? "likes pendant ton absence" : "like pendant ton absence") + p("Ils t'attendent toujours. Reconnecte-toi pour découvrir qui a flashé sur ton profil.")
          : p("De nouveaux profils sont arrivés pendant ton absence. Qui sait, ton prochain match s'y cache peut-être.")) +
        btn("Revenir sur SWIVV", `${SITE}/browse`, ACCENT_RED),
    }),
  };
}

/** 12 — Réinitialisation du mot de passe. */
export function swivvPasswordReset({ name, resetUrl }: { name: string; resetUrl: string }): SwivvEmail {
  return {
    subject: "Réinitialise ton mot de passe SWIVV",
    html: buildSwivvEmailHtml({
      title: "Mot de passe oublié ?",
      preheader: "Clique pour choisir un nouveau mot de passe.",
      bodyHtml:
        hi(name, "pas de panique.") +
        p("Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 1 heure.") +
        btn("Choisir un nouveau mot de passe", resetUrl) +
        small("Si tu n'as pas demandé ça, ignore cet e-mail : ton mot de passe reste inchangé."),
    }),
  };
}

/** 13 — Signalement bien reçu (modération). */
export function swivvReportReceived({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Ton signalement a bien été reçu",
    html: buildSwivvEmailHtml({
      title: "Merci pour ton signalement",
      preheader: "Notre équipe de modération va l'examiner.",
      bodyHtml:
        hi(name, "merci de veiller sur la communauté.") +
        p("Ton signalement a bien été transmis à notre équipe de modération, qui va l'examiner rapidement. En cas de danger immédiat, contacte aussi les autorités compétentes.") +
        p("En attendant, tu peux bloquer le membre concerné depuis sa page profil : il ne pourra plus te contacter ni apparaître dans tes recherches.") +
        small("Par sécurité, nous ne communiquons pas les mesures prises contre d'autres comptes."),
    }),
  };
}

/** 14 — Compte supprimé (confirmation + porte ouverte). */
export function swivvAccountDeleted({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Ton compte SWIVV a été supprimé",
    html: buildSwivvEmailHtml({
      title: "Compte supprimé",
      preheader: "Ton profil et tes données ont été effacés.",
      bodyHtml:
        hi(name, "c'est noté.") +
        p("Ton compte, ton profil et tes données associées ont été supprimés, conformément à ta demande. Si tu as trouvé l'amour (on l'espère !), toute l'équipe te souhaite beaucoup de bonheur.") +
        p("Et si tu changes d'avis, tu seras toujours le bienvenu pour créer un nouveau compte.") +
        btn("Revenir un jour", SITE) +
        small("Une question sur tes données ? Écris-nous : contact@swivvdating.com."),
    }),
  };
}

/** 16 — Matches du jour. */
export function swivvDailyMatches({ name, count }: { name: string; count: number }): SwivvEmail {
  return {
    subject: "💕 Your SWIVV matches for today",
    html: buildSwivvEmailHtml({
      title: "Tes matches du jour",
      preheader: `${count} nouveaux profils compatibles t'attendent.`,
      bodyHtml:
        hi(name, "voici ta sélection du jour.") +
        stat(count, "nouveaux matches") +
        p("On a sélectionné pour toi les profils les plus compatibles, en fonction de tes critères. Ne les fais pas attendre !") +
        btn("Voir mes matches", `${SITE}/matches`),
    }),
  };
}

/** 17 — Matches de la semaine. */
export function swivvWeeklyMatches({ name, count }: { name: string; count: number }): SwivvEmail {
  return {
    subject: "💕Your SWIVV matches this week",
    html: buildSwivvEmailHtml({
      title: "Tes matches de la semaine",
      preheader: `${count} profils compatibles cette semaine.`,
      bodyHtml:
        hi(name, "ton récap de la semaine.") +
        stat(count, "matches cette semaine") +
        p("Voici les profils qui te correspondent le mieux parmi les nouveaux inscrits. Un like aujourd'hui, une rencontre demain !") +
        btn("Voir mes matches", `${SITE}/matches`),
    }),
  };
}

/** 18 — Inciter à ajouter une photo. */
export function swivvAddPhoto({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Add a photo to your SWIVV profile 📸",
    html: buildSwivvEmailHtml({
      title: "Ajoute une photo",
      preheader: "Les profils avec photo reçoivent bien plus de likes.",
      bodyHtml:
        hi(name, "montre-toi sous ton meilleur jour !") +
        p("Ton profil n'a pas encore de photo, et c'est la première chose que les autres regardent. Les profils avec photo reçoivent jusqu'à 10 fois plus de likes.") +
        btn("Ajouter une photo", `${SITE}/mon-profil`),
    }),
  };
}

/** 19 — Photo approuvée. */
export function swivvPhotoApproved({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Your profile photo has been approved ✓",
    html: buildSwivvEmailHtml({
      title: "Photo approuvée",
      preheader: "Ta photo est en ligne, bon courage pour la suite !",
      bodyHtml:
        hi(name, "bonne nouvelle !") +
        p("Ta photo de profil a été vérifiée et approuvée par notre équipe. Elle est désormais visible par les autres membres.") +
        btn("Voir mon profil", `${SITE}/mon-profil`),
    }),
  };
}

/** 20 — Photo refusée. */
export function swivvPhotoRejected({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Your profile photo couldn't be approved",
    html: buildSwivvEmailHtml({
      title: "Photo non approuvée",
      preheader: "Quelques ajustements et ce sera bon.",
      bodyHtml:
        hi(name, "petit souci avec ta photo.") +
        p("Ta photo de profil n'a pas pu être approuvée : elle doit te montrer clairement, sans contenu inapproprié ni photo de quelqu'un d'autre.") +
        p("Importe une nouvelle photo respectant nos règles, elle sera vérifiée rapidement.") +
        btn("Changer ma photo", `${SITE}/mon-profil`),
    }),
  };
}

/** 21 — Profil masqué (l'utilisateur l'a caché depuis Réglages). */
export function swivvProfileHidden({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Your SWIVV profile has been hidden",
    html: buildSwivvEmailHtml({
      title: "Profil masqué",
      preheader: "Ton profil n'est plus visible, comme demandé.",
      bodyHtml:
        hi(name, "c'est noté.") +
        p("Ton profil est désormais masqué : il n'apparaît plus dans les recherches et personne ne peut te contacter. Tes données, likes et conversations sont conservés.") +
        p("Tu peux le rendre visible à tout moment depuis tes réglages.") +
        btn("Gérer mon profil", `${SITE}/parametres`),
    }),
  };
}

/** 22 — Relance après invisibilité. */
export function swivvProfileVisibleAgain({ name }: { name: string }): SwivvEmail {
  return {
    subject: "You're ready to start meeting people again? Make your profile visible again!",
    html: buildSwivvEmailHtml({
      title: "On te manque ?",
      preheader: "De nouveaux profils compatibles t'attendent.",
      bodyHtml:
        hi(name, "ça fait un moment !") +
        p("Ton profil est toujours masqué. Pendant ton absence, de nouveaux membres compatibles avec tes critères se sont inscrits.") +
        btn("Rendre mon profil visible", `${SITE}/parametres`),
    }),
  };
}

/** 23 — Campagne de parrainage. */
export function swivvReferral({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Invite your friends to SWIVV 💜",
    html: buildSwivvEmailHtml({
      title: "Parraine tes amis",
      preheader: "Les belles histoires se partagent.",
      bodyHtml:
        hi(name, "tu aimes SWIVV ?") +
        p("Invite tes amis célibataires à rejoindre SWIVV : plus il y a de profils de qualité, plus les rencontres sont belles — pour eux comme pour toi.") +
        btn("Inviter des amis", `${SITE}/inscription`),
    }),
  };
}

/** 24 — Parrainage réussi. */
export function swivvReferralSuccess({ name, friendName }: { name: string; friendName: string }): SwivvEmail {
  return {
    subject: "🎉 Your friend just joined SWIVV",
    html: buildSwivvEmailHtml({
      title: "Parrainage réussi",
      preheader: `${friendName} vient de s'inscrire grâce à toi.`,
      bodyHtml:
        hi(name, "merci !") +
        p(`Bonne nouvelle : <strong>${escapeHtml(friendName)}</strong> vient de rejoindre SWIVV grâce à ton invitation.`) +
        btn("Découvrir les profils", `${SITE}/browse`),
    }),
  };
}

/** 25 — Profil signalé (l'utilisateur est visé par un signalement). */
export function swivvProfileReported({ name }: { name: string }): SwivvEmail {
  return {
    subject: "We've received a report concerning your profile",
    html: buildSwivvEmailHtml({
      title: "Signalement reçu",
      preheader: "Notre équipe va examiner ton profil.",
      bodyHtml:
        hi(name, "on te tient informé.") +
        p("Nous avons reçu un signalement concernant ton profil. Notre équipe de modération va l'examiner et te contactera si une action est nécessaire.") +
        p("En attendant, vérifie que ton profil respecte nos règles : photos récentes de toi, description respectueuse, aucune coordonnée publique.") +
        btn("Voir mes règles", `${SITE}/legal/terms`),
    }),
  };
}

/** 26 — Contenu supprimé par la modération. */
export function swivvContentRemoved({ name }: { name: string }): SwivvEmail {
  return {
    subject: "A piece of content was removed from your profile",
    html: buildSwivvEmailHtml({
      title: "Contenu retiré",
      preheader: "Un élément de ton profil ne respectait pas nos règles.",
      bodyHtml:
        hi(name, "petit rappel des règles.") +
        p("Notre équipe a retiré un contenu de ton profil car il ne respectait pas nos conditions d'utilisation. Ton compte reste actif.") +
        p("En cas de récidive, ton compte pourra être suspendu. Prends un moment pour relire les règles.") +
        btn("Relire les règles", `${SITE}/legal/terms`),
    }),
  };
}

/** 27 — Suspension temporaire. */
export function swivvSuspendedTemp({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Your SWIVV account has been temporarily suspended",
    html: buildSwivvEmailHtml({
      title: "Compte suspendu temporairement",
      preheader: "Ton accès est restreint le temps d'un examen.",
      bodyHtml:
        hi(name, "on doit faire une pause.") +
        p("Ton compte SWIVV a été suspendu temporairement suite à un manquement à nos conditions d'utilisation. Pendant cette période, tu ne peux ni te connecter ni être visible.") +
        p("Si tu penses qu'il s'agit d'une erreur, réponds à cet e-mail pour contester la décision.") +
        small("Sans contestation, la suspension sera levée automatiquement à son terme."),
    }),
  };
}

/** 28 — Suspension définitive. */
export function swivvSuspendedPerm({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Your SWIVV account has been suspended",
    html: buildSwivvEmailHtml({
      title: "Compte suspendu",
      preheader: "Décision définitive de notre équipe de modération.",
      bodyHtml:
        hi(name, "décision difficile.") +
        p("Après examen, ton compte SWIVV a été suspendu définitivement pour manquement grave ou répété à nos conditions d'utilisation. Ton profil n'est plus visible et tes données seront traitées conformément à notre politique de confidentialité.") +
        small("Si tu contestes cette décision, réponds à cet e-mail dans un délai de 30 jours."),
    }),
  };
}

/** 29 — Compte restauré. */
export function swivvAccountRestored({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Your SWIVV account has been restored",
    html: buildSwivvEmailHtml({
      title: "Compte restauré",
      preheader: "Bon retour parmi nous !",
      bodyHtml:
        hi(name, "bonne nouvelle !") +
        p("Après réexamen, ton compte SWIVV a été restauré. Ton profil est de nouveau visible et tu peux reprendre tes conversations là où tu les avais laissées.") +
        btn("Retourner sur SWIVV", `${SITE}/browse`),
    }),
  };
}

/** 30 — CGU mises à jour. */
export function swivvTermsUpdated({ name }: { name: string }): SwivvEmail {
  return {
    subject: "SWIVV Terms of Use have been updated",
    html: buildSwivvEmailHtml({
      title: "CGU mises à jour",
      preheader: "Prends connaissance des nouvelles conditions.",
      bodyHtml:
        hi(name, "on fait le point.") +
        p("Nos conditions générales d'utilisation ont été mises à jour. En continuant à utiliser SWIVV après leur entrée en vigueur, tu les acceptes.") +
        btn("Lire les nouvelles CGU", `${SITE}/legal/terms`),
    }),
  };
}

/** 31 — Politique de confidentialité mise à jour. */
export function swivvPrivacyUpdated({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Important update to SWIVV's Privacy Policy",
    html: buildSwivvEmailHtml({
      title: "Confidentialité mise à jour",
      preheader: "Ce qui change pour tes données.",
      bodyHtml:
        hi(name, "transparence d'abord.") +
        p("Notre politique de confidentialité a été mise à jour : on y détaille quelles données on collecte, pourquoi, et comment tu peux les contrôler ou les supprimer.") +
        btn("Lire la politique", `${SITE}/legal/privacy`),
    }),
  };
}

/** 32 — Politique cookies mise à jour. */
export function swivvCookiesUpdated({ name }: { name: string }): SwivvEmail {
  return {
    subject: "SWIVV Cookie Policy update",
    html: buildSwivvEmailHtml({
      title: "Cookies mis à jour",
      preheader: "Gère tes préférences à tout moment.",
      bodyHtml:
        hi(name, "petit mot sur les cookies.") +
        p("Notre politique cookies a évolué. Tu peux accepter, refuser ou personnaliser les cookies à tout moment depuis la page dédiée.") +
        btn("Gérer mes cookies", `${SITE}/cookies`),
    }),
  };
}

/** 33 — App mobile disponible. */
export function swivvAppAvailable({ name }: { name: string }): SwivvEmail {
  return {
    subject: "📱 SWIVV is now available on your phone!",
    html: buildSwivvEmailHtml({
      title: "SWIVV sur ton téléphone",
      preheader: "Tes matches partout avec toi.",
      bodyHtml:
        hi(name, "bonne nouvelle !") +
        p("L'application mobile SWIVV est disponible sur iOS et Android : notifications de matches en temps réel, messages vocaux et appels vidéo où que tu sois.") +
        btn("Télécharger l'app", `${SITE}`),
    }),
  };
}

/** 34 — Notifications push désactivées (relance). */
export function swivvPushDisabled({ name }: { name: string }): SwivvEmail {
  return {
    subject: "You're missing SWIVV notifications",
    html: buildSwivvEmailHtml({
      title: "Tu rates des notifications",
      preheader: "Des likes et messages t'attendent peut-être.",
      bodyHtml:
        hi(name, "ne rate rien !") +
        p("Tes notifications sont désactivées : tu risques de manquer un match ou un message important. Réactive-les en un clic.") +
        btn("Réactiver", `${SITE}/parametres`),
    }),
  };
}

/** 35 — Inciter à activer les notifications. */
export function swivvEnableNotifications({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Don't miss your next match ❤️",
    html: buildSwivvEmailHtml({
      title: "Ne rate pas ton prochain match",
      preheader: "Sois prévenu dès qu'on te like.",
      bodyHtml:
        hi(name, "reste dans la boucle.") +
        p("Active les notifications pour être prévenu instantanément quand on te like, quand tu matches ou quand tu reçois un message.") +
        btn("Activer les notifications", `${SITE}/parametres`),
    }),
  };
}

/** 36 — Connexion depuis un nouvel appareil. */
export function swivvNewDevice({ name, device }: { name: string; device: string }): SwivvEmail {
  return {
    subject: "Your SWIVV account was accessed from a new device",
    html: buildSwivvEmailHtml({
      title: "Nouvel appareil détecté",
      preheader: "C'était toi ? Tout va bien, sinon agis vite.",
      bodyHtml:
        hi(name, "on veille sur ton compte.") +
        p(`Ton compte vient d'être utilisé depuis un nouvel appareil : <strong>${escapeHtml(device)}</strong>. Si c'était toi, ignore cet e-mail.`) +
        p("Sinon, change ton mot de passe immédiatement et contacte notre support.") +
        btn("Sécuriser mon compte", `${SITE}/parametres`),
    }),
  };
}

/** 37 — Enquête de bienvenue. */
export function swivvWelcomeSurvey({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Tell us what you think of SWIVV 💜",
    html: buildSwivvEmailHtml({
      title: "Donne-nous ton avis",
      preheader: "2 minutes pour nous aider à progresser.",
      bodyHtml:
        hi(name, "bienvenue à bord !") +
        p("Tu viens d'arriver : raconte-nous tes premières impressions. Tes réponses nous aident à améliorer SWIVV pour tout le monde.") +
        btn("Répondre à l'enquête", `${SITE}/contact-us`),
    }),
  };
}

/** 38 — Demande d'avis d'usage. */
export function swivvFeedback({ name }: { name: string }): SwivvEmail {
  return {
    subject: "How are you enjoying SWIVV?",
    html: buildSwivvEmailHtml({
      title: "Et toi, ça matche ?",
      preheader: "Dis-nous comment se passe ton expérience.",
      bodyHtml:
        hi(name, "on prend de tes nouvelles.") +
        p("Ça fait un moment que tu utilises SWIVV : qu'est-ce qui te plaît, qu'est-ce qu'on devrait améliorer ? Ton avis compte vraiment.") +
        btn("Donner mon avis", `${SITE}/contact-us`),
    }),
  };
}

/** 39 — Enquête produit. */
export function swivvProductSurvey({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Help us improve SWIVV",
    html: buildSwivvEmailHtml({
      title: "Aide-nous à progresser",
      preheader: "3 minutes pour façonner le SWIVV de demain.",
      bodyHtml:
        hi(name, "ton avis nous intéresse.") +
        p("On prépare les prochaines fonctionnalités et on veut savoir ce qui compte pour toi : participe à notre courte enquête produit.") +
        btn("Participer", `${SITE}/contact-us`),
    }),
  };
}

/** 40 — Avis sur une nouveauté. */
export function swivvFeatureFeedback({ name, feature }: { name: string; feature: string }): SwivvEmail {
  return {
    subject: "What do you think of our new feature?",
    html: buildSwivvEmailHtml({
      title: "Nouveauté à tester",
      preheader: `Tu as essayé ${feature} ?`,
      bodyHtml:
        hi(name, "on innove !") +
        p(`On vient de lancer <strong>${escapeHtml(feature)}</strong>. Teste-la et dis-nous ce que tu en penses : ton retour décide de la suite.`) +
        btn("Donner mon avis", `${SITE}/contact-us`),
    }),
  };
}

/** 41 — Suggestion reçue. */
export function swivvFeatureRequestThanks({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Thanks for your SWIVV suggestion",
    html: buildSwivvEmailHtml({
      title: "Merci pour ton idée",
      preheader: "On l'a bien reçue, et on la lit vraiment.",
      bodyHtml:
        hi(name, "merci !") +
        p("Ta suggestion a bien été transmise à notre équipe produit. Les meilleures idées de la communauté finissent régulièrement dans l'app.") +
        small("On ne peut pas répondre à chaque suggestion, mais chacune est lue."),
    }),
  };
}

/** 42 — Message de contact reçu. */
export function swivvContactReceived({ name }: { name: string }): SwivvEmail {
  return {
    subject: "We've received your message",
    html: buildSwivvEmailHtml({
      title: "Message bien reçu",
      preheader: "On te répond très vite.",
      bodyHtml:
        hi(name, "merci de nous écrire.") +
        p("Ton message a bien été reçu par notre équipe support. On te répond en général sous 48 heures ouvrées.") +
        small("En cas d'urgence liée à ta sécurité, contacte directement les autorités compétentes."),
    }),
  };
}

/** 43 — Réponse du support. */
export function swivvSupportReply({ name }: { name: string }): SwivvEmail {
  return {
    subject: "SWIVV Support has replied to your request",
    html: buildSwivvEmailHtml({
      title: "Réponse du support",
      preheader: "On a une réponse pour toi.",
      bodyHtml:
        hi(name, "on te répond.") +
        p("Notre équipe support a répondu à ta demande. Connecte-toi pour lire la réponse et continuer la conversation si besoin.") +
        btn("Voir la réponse", `${SITE}/contact-us`),
    }),
  };
}

/** 44 — Signalement résolu (l'auteur est informé). */
export function swivvReportResolved({ name }: { name: string }): SwivvEmail {
  return {
    subject: "Your SWIVV report has been reviewed",
    html: buildSwivvEmailHtml({
      title: "Signalement examiné",
      preheader: "Merci, la communauté est plus sûre grâce à toi.",
      bodyHtml:
        hi(name, "merci pour ta vigilance.") +
        p("Ton signalement a été examiné par notre équipe de modération et les mesures appropriées ont été prises.") +
        small("Par sécurité, nous ne communiquons pas le détail des mesures prises contre d'autres comptes."),
    }),
  };
}
/** 15 — Promotion / nouveauté produit. */
export function swivvPromo({ name, headline, detail, cta, url }: { name: string; headline: string; detail: string; cta: string; url: string }): SwivvEmail {
  return {
    subject: headline,
    html: buildSwivvEmailHtml({
      title: headline,
      preheader: detail.slice(0, 100),
      bodyHtml:
        hi(name, "bonne nouvelle !") +
        p(escapeHtml(detail)) +
        btn(cta, url.startsWith("http") ? url : `${SITE}${url.startsWith("/") ? url : `/${url}`}`, ACCENT_RED) +
        small("Tu reçois nos nouveautés car tu as un compte SWIVV. Pour ne plus les recevoir, gère tes notifications dans ton compte."),
    }),
  };
}

export const SWIVV_EMAILS = [
  "swivvVerifyEmail",
  "swivvWelcome",
  "swivvProfileIncomplete",
  "swivvNewLike",
  "swivvNewMatch",
  "swivvNewMessage",
  "swivvActivityDigest",
  "swivvNewNearby",
  "swivvTestimonialInvite",
  "swivvSafetyTips",
  "swivvWeMissYou",
  "swivvPasswordReset",
  "swivvReportReceived",
  "swivvAccountDeleted",
  "swivvPromo",
  "swivvDailyMatches",
  "swivvWeeklyMatches",
  "swivvAddPhoto",
  "swivvPhotoApproved",
  "swivvPhotoRejected",
  "swivvProfileHidden",
  "swivvProfileVisibleAgain",
  "swivvReferral",
  "swivvReferralSuccess",
  "swivvProfileReported",
  "swivvContentRemoved",
  "swivvSuspendedTemp",
  "swivvSuspendedPerm",
  "swivvAccountRestored",
  "swivvTermsUpdated",
  "swivvPrivacyUpdated",
  "swivvCookiesUpdated",
  "swivvAppAvailable",
  "swivvPushDisabled",
  "swivvEnableNotifications",
  "swivvNewDevice",
  "swivvWelcomeSurvey",
  "swivvFeedback",
  "swivvProductSurvey",
  "swivvFeatureFeedback",
  "swivvFeatureRequestThanks",
  "swivvContactReceived",
  "swivvSupportReply",
  "swivvReportResolved",
] as const;

// ponytail: templates only, no sending here — call sendEmail() from a server function with RESEND_API_KEY set, and gate each send on the user's notification prefs
