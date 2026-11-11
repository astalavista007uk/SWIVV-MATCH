import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Archive, Building2, Check, Cookie, Database, Download, Eye, Globe2, Lock, Mail, Scale, Settings, Share2, ShieldCheck, Trash2, type LucideIcon } from "lucide-react";
import { LEGAL_CARD, LegalHero } from "@/components/swivv-legal-hero";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons, getMyRawProfile, requireSwivvAuth, useSwivvUser } from "@/lib/swivv-auth";
import { getBlocked, getLikes, getMatches, getProfileViews } from "@/lib/swivv-store";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { shrinkDataUrl } from "@/routes/inscription";
import { useLang, useT } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy-centre")({
  head: () =>
    pageHead(
      "Confidentialité et données personnelles — SWIVV MATCH",
      "Centre de confidentialité SWIVV MATCH : données collectées, droits RGPD, export et suppression de compte, politique détaillée.",
      "/privacy-centre",
    ),
  component: PrivacyCentrePage,
});

// ponytail: full policy text lives on this page (moved from the old /legal/privacy, now a redirect) — one privacy page for visitors + SEO
const POLICY: [string, string, LucideIcon][] = [
  ["1. Responsable du traitement", "Le responsable du traitement est SWIVV MATCH, 10 Rue Thureau Dangin, 75015 Paris, France. Contact pour toute question relative aux données personnelles : contact@swivvmatch.com. Aucun délégué à la protection des données (DPO) n'a été désigné : les demandes sont traitées par l'équipe support.", Building2],
  ["2. Données collectées", "Compte : prénom, e-mail, âge, ville. Profil public : photos, bio, centres d'intérêt, intention. Usage : likes, matchs, messages, préférences de recherche. Données techniques : adresse IP, journaux de connexion, type d'appareil. Support : messages envoyés à l'équipe. Vérification d'identité : badge, date et motif de décision. Les champs obligatoires sont indiqués lors de la collecte ; les autres sont facultatifs. Les messages privés ne sont lisibles que par toi et ton match, plus la modération en cas de signalement.", Database],
  ["3. Bases légales", "Nous traitons tes données sur les bases suivantes : exécution du contrat (compte, matching, messagerie), intérêt légitime (sécurité, prévention des abus, amélioration du service), consentement (communications facultatives et tout traceur non essentiel), obligation légale (conservation de certains journaux, réponses aux autorités).", Scale],
  ["4. Utilisation", "Tes données servent uniquement à : afficher ton profil aux membres, calculer tes compatibilités, assurer la modération et la sécurité, et te contacter pour le support. Aucune revente, aucun partage à des annonceurs, aucune publicité ciblée avec tes données de rencontres.", Settings],
  ["5. Visibilité", "Ton profil public (photos, prénom, âge, ville, bio) est visible par les membres connectés uniquement. Ton e-mail, ta position exacte et tes signalements restent strictement privés. Seule ta ville et une distance approximative en km sont affichées.", Eye],
  ["6. Destinataires et sous-traitants", "Accès limité à l'équipe SWIVV et à nos sous-traitants techniques : Supabase (base de données, authentification, stockage des fichiers), Vercel (hébergement et mesure d'audience sans cookie), IONOS (hébergement e-mail et envoi des e-mails transactionnels). Aucune revente de données. Les autorités peuvent recevoir des données sur réquisition légale. En cas de signalement, la modération peut lire les messages concernés.", Share2],
  ["7. Transferts hors Union européenne", "Certains sous-traitants peuvent traiter des données en dehors de l'Union européenne, notamment aux États-Unis. Ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne et/ou une décision d'adéquation (Data Privacy Framework) lorsqu'elle s'applique. Une copie des garanties peut être demandée via la page contact.", Globe2],
  ["8. Conservation", "Compte actif : pendant la durée d'utilisation. Messages : 3 mois, lus ou non. Documents de vérification d'identité en attente : jusqu'à la décision, puis suppression ; le badge, sa date et le motif restent tant que le compte existe. Journaux techniques et de modération : jusqu'à 12 mois. Après suppression du compte : effacement ou anonymisation sous 30 jours, sous réserve des obligations légales (ex. conservation de preuves en cas d'abus).", Archive],
  ["9. Vérification d'identité", "Le badge Identité atteste qu'une pièce d'identité avec photo correspond à tes photos de profil. Le contrôle du visage est réalisé dans ton navigateur : si le visage correspond, aucune pièce n'est envoyée ni stockée. En cas de doute, la photo de la pièce est transmise dans un espace de stockage privé, accessible uniquement à l'équipe de modération, puis supprimée dès la décision (validation ou refus). Aucune donnée lisible sur la pièce (numéro, date de naissance, adresse) n'est extraite ni conservée. Seuls le badge, sa date et le motif de la décision restent enregistrés. La pièce n'est jamais visible par les autres membres et n'est jamais utilisée à d'autres fins.", ShieldCheck],
  ["10. Matching et décisions automatisées", "Le matching et les suggestions reposent sur des règles et des scores calculés automatiquement à partir des informations et préférences de ton profil. Ils ne produisent pas d'effet juridique et ne constituent pas une décision entièrement automatisée au sens de l'article 22 du RGPD. La comparaison de visage pour le badge Identité est réalisée dans ton navigateur ; en cas de doute, une revue humaine intervient. Tu peux nous contacter pour obtenir des explications sur les critères principaux.", Settings],
  ["11. Tes droits", "Accès, rectification, effacement, limitation, opposition, portabilité et retrait du consentement : écris-nous via la page contact en précisant ta demande et l'e-mail du compte. Réponse sous 30 jours. Tu peux aussi supprimer ton compte en 1 clic depuis tes Paramètres. Si tu estimes que tes droits ne sont pas respectés, tu peux introduire une réclamation auprès de la CNIL (cnil.fr) ou de l'autorité de protection des données de ton pays.", Scale],
  ["12. Cookies", "SWIVV utilise uniquement des cookies techniques (session, préférences, sécurité) et une mesure d'audience sans cookie. Aucun cookie publicitaire. Détails, noms et durées sur la page cookies.", Cookie],
  ["13. Sécurité", "Connexions chiffrées, mots de passe jamais stockés en clair, accès internes limités. En cas de faille avérée, les membres concernés sont informés conformément à la réglementation.", Lock],
  ["14. Mineurs", "SWIVV est réservé aux personnes âgées de 18 ans ou plus. À l'inscription, ta date de naissance est obligatoire : elle sert uniquement à calculer ton âge et à vérifier que tu as 18 ans ou plus. Ton âge est visible sur ton profil, ta date de naissance ne l'est jamais. Elle est conservée de façon sécurisée, accessible uniquement aux processus techniques et à l'équipe habilitée, et n'est utilisée ni pour la publicité ni pour du profilage. Aucune pièce d'identité n'est demandée par défaut ; si une vérification d'âge est ajoutée, un prestataire indépendant ne renverra que le résultat « 18 ans ou plus », sans document. Si un compte de mineur est signalé, il est restreint le temps de la vérification puis suspendu, et les données concernées sont supprimées.", Scale],
  ["15. Modifications", "Cette politique peut être mise à jour pour tenir compte de l'évolution du service ou de la réglementation. La date de dernière mise à jour figure en haut de la page. En cas de changement important, les membres sont informés par e-mail ou dans l'application.", Archive],
  ["16. Contact", "Pour exercer tes droits ou poser une question : page contact, objet « Supprimer mes données » ou par e-mail à contact@swivvmatch.com.", Mail],
];

function PrivacyCentrePage() {
  const t = useT();
  const lang = useLang();
  const [exported, setExported] = useState(false);
  const user = useSwivvUser();

  // ponytail: server row + local signup stash/draft (an in-flight flow can hold newer photos than the last push) — deduped so the PDF matches what Mon profil displays
  const collectPhotos = (p: any): string[] => {
    const out: string[] = [...(p?.photo ? [p.photo] : []), ...(Array.isArray(p?.photos) ? p.photos : [])];
    for (const key of ["swivv-pending-profile", "swivv-signup-draft"]) {
      try {
        const s = JSON.parse(localStorage.getItem(key) ?? "null") as any;
        if (s?.photo) out.push(s.photo);
        if (Array.isArray(s?.photos)) out.push(...s.photos);
      } catch {}
    }
    return out.filter((s, i, a) => s && a.indexOf(s) === i);
  };
  // ponytail: browser print-to-PDF instead of a PDF library (zero deps, real photos + logo, user picks Save as PDF) — a server-rendered PDF if exports ever need sending by email
  const exportPdf = async () => {
    const p: any = await getMyRawProfile().catch(() => null);
    // ponytail: absolute logo URL — the print window opens on about:blank so relative paths never resolve there
    const logo = `${window.location.origin}/swivv-match-logo-transparent.png`;
    const esc = (v: unknown) => String(v ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const facts: [string, unknown][] = [
      ["Prénom", p?.name], ["Âge", p?.age], ["Ville", p?.city], ["Pays", p?.country],
      ["Présentation", p?.tagline], ["Bio", p?.bio], ["Recherche", p?.lookingFor ?? p?.seeking],
      ["Statut", p?.maritalStatus], ["Enfants", p?.haveChildren], ["Métier", p?.occupation],
      ["Religion", p?.religion], ["Langues", Array.isArray(p?.languages) ? p.languages.join(", ") : p?.languages],
      ["Centres d'intérêt", Array.isArray(p?.interests) ? p.interests.join(", ") : p?.interests],
    ];
    // ponytail: shrink to 400px before embedding (full-size dataURLs can silently drop from the print document) + fixed-height 3-col grid; failures render a labeled box so a missing photo is visible, not silent
    const photos = await Promise.all(
      collectPhotos(p).map((s) => (s.startsWith("data:image") ? shrinkDataUrl(s, 400, 0.7).catch(() => s) : Promise.resolve(s))),
    );
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><title>${t("Mes données SWIVV")}</title>
<style>body{font-family:Arial,sans-serif;color:#333;max-width:700px;margin:0 auto;padding:32px}.band{background:#0f1e33;border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:14px}.band img{height:48px;filter:brightness(0) invert(1)}.band h1{font-size:20px;margin:0;color:#fff}.accent{height:3px;background:#e60050;border-radius:2px;margin:6px 0 4px}h2{font-size:16px;color:#e60050;margin:24px 0 8px}.meta{color:#777;font-size:12px}table{width:100%;border-collapse:collapse;font-size:14px}td{padding:7px 8px;border-bottom:1px solid #eee;vertical-align:top}td:first-child{color:#777;width:180px}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.grid img{width:100%;height:180px;object-fit:cover;border-radius:10px}.missing{display:flex;align-items:center;justify-content:center;height:180px;border:1px dashed #ccc;border-radius:10px;color:#999;font-size:12px}footer{margin-top:28px;border-top:3px solid #e60050;padding-top:10px;text-align:center}footer img{height:140px}footer p{font-size:11px;color:#666;margin:4px 0}@media print{.pbreak{break-before:page}.tavoid{break-inside:avoid}table td{padding:5px 8px}.endpage{position:fixed;top:0;bottom:0;left:0;right:0;display:flex;flex-direction:column;justify-content:flex-end}}@page{size:A4;margin:10mm 10mm 16mm 10mm}</style></head><body>
<div class="band"><img src="${logo}" alt="SWIVV"><h1>${t("Mes données")}</h1></div><div class="accent"></div><p class="meta">${t("Exporté le {date}", { date: new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : "en-GB") })}</p>
<h2>${t("Mon profil")}</h2><table class="tavoid">${facts.map(([k, v]) => `<tr><td>${t(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
<h2>${t("Mon activité")}</h2><table class="tavoid">
<tr><td>${t("Likes envoyés")}</td><td>${getLikes().length}</td></tr>
<tr><td>${t("Matchs")}</td><td>${getMatches().length}</td></tr>
<tr><td>${t("Profils bloqués")}</td><td>${getBlocked().length}</td></tr>
<tr><td>${t("Visites reçues")}</td><td>${Object.values(getProfileViews()).reduce((a, b) => a + b, 0)}</td></tr></table>
${photos.length ? `<h2 class="pbreak">${t("Mes photos ({n})", { n: photos.length })}</h2>${Array.from({ length: Math.ceil(photos.length / 9) }, (_, i) => photos.slice(i * 9, i * 9 + 9)).map((g, i) => `<div class="grid${i ? " pbreak" : ""}">${g.map((s, j) => `<img src="${s}" alt="${t("Photo {n}", { n: i * 9 + j + 1 })}" onerror="this.outerHTML='<div class=missing>${t("Photo {n} illisible", { n: i * 9 + j + 1 })}</div>'">`).join("")}</div>`).join("")}` : ""}
<!-- ponytail: photo pages hold max 3 rows (9 photos) so flowing rows can never reach the fixed footer zone — a break fires only mid-flow (Chrome drops it at a page top, so no blank pages); activity+profile print first on page 1 for the same reason -->
<!-- ponytail: activity prints before the photos so dense photo pages never share a page with text that could slide under the fixed footer (grid rows are fixed-height and break cleanly); the photos section renders only when photos exist, else everything stays on one page (the generated-from-your-account note lives on the privacy page itself, not worth 40px of collision budget here) -->
<!-- ponytail: fixed footer bottom-pinned to the @page content area on every page (16mm bottom margin ≈ footer height, so dense pages can't slide under it; Chrome anchors fixed boxes to the content area — measured screen→print spacers drift instead) — ceiling: a >600px profile table or a shrunk print dialog can strand an airy page; un-avoid the tables then -->
<div class="endpage"><footer><img src="${logo}" alt="SWIVV MATCH"><p>SWIVV MATCH – 10 Rue Thureau Dangin, 75015 Paris, France – Tél : +33 6 60 36 82 20</p><p>www.swivvmatch.com – contact@swivvmatch.com</p></footer></div>
</body></html>`);
    w.document.close();
    w.focus();
    // ponytail: print only after every photo decodes (the snapshot otherwise catches empty frames) — 8s cap so one stuck image never blocks the dialog
    const imgs = Array.from(w.document.images ?? []);
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((res) => {
            if (img.complete && img.naturalWidth > 0) return res();
            const done = () => res();
            img.onload = done;
            img.onerror = done;
            setTimeout(done, 8000);
          }),
      ),
    );
    w.print();
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

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
        title={t("Centre de confidentialité")}
        subtitle={t("Tes données t'appartiennent. Voici ce que SWIVV collecte, pourquoi, et comment reprendre le contrôle.")}
        icon={ShieldCheck}
        tall
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-[#6b6b73]">{t("Dernière mise à jour : 3 novembre 2026.")}</p>
        {lang !== "fr" && (
          <p className="mt-2 rounded-md border border-border bg-[#f3f3f3] p-3 text-sm text-[#555]">
            {t("La politique détaillée ci-dessous est fournie en français ; la version française fait foi.")}
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: <Eye className="h-5 w-5 text-[#e60050]" />,
              t: "Ce que voient les membres",
              d: "Tes photos, prénom, âge, ville, bio et centres d'intérêt. Ton e-mail et ta position exacte restent privés.",
            },
            {
              icon: <Lock className="h-5 w-5 text-[#e60050]" />,
              t: "Ce que SWIVV utilise",
              d: "Tes préférences et tes likes servent uniquement à calculer tes scores de compatibilité. Jamais revendues, jamais partagées à des annonceurs.",
            },
            {
              icon: <Download className="h-5 w-5 text-[#e60050]" />,
              t: "Exporter mes données",
              d: "Reçois un document clair et illustré de tes données (profil, photos, activité).",
              action: (
                <span className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    // ponytail: logged-out taps open the login popup and auto-generate after sign-in (requireSwivvAuth queues the callback) — no redirect, user stays on this page
                    onClick={() => requireSwivvAuth("account", exportPdf)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#e60050] px-4 py-2 text-sm font-medium text-white"
                  >
                    {exported ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                    {exported ? t("Généré !") : user ? t("Télécharger en PDF") : t("Connecte-toi pour télécharger tes données")}
                  </button>
                </span>
              ),
            },
            {
              icon: <Trash2 className="h-5 w-5 text-[#e60050]" />,
              t: "Tout supprimer",
              d: "Supprime ton compte en 1 clic depuis tes Paramètres. Tes photos et messages sont effacés.",
              action: (
                <Link to="/parametres" className="mt-3 inline-block rounded-md border border-border px-4 py-2 text-sm font-medium text-[#555]">
                  {t("Aller aux Paramètres")}
                </Link>
              ),
            },
          ].map((c) => (
            <div key={c.t} className="rounded-xl bg-white p-5">
              {c.icon}
              <p className="mt-2 font-medium text-[#333]">{t(c.t)}</p>
              <p className="mt-1 text-sm text-[#5c5c66]">{t(c.d)}</p>
              {"action" in c && c.action}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 text-sm leading-relaxed text-[#555]">
          <h2 className="font-medium text-[#333]">{t("En résumé")}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{t("Pas de publicité ciblée avec tes données de rencontres.")}</li>
            <li>{t("Pas de géolocalisation précise affichée (ville + distance en km uniquement).")}</li>
            <li>{t("Messages privés : visibles uniquement par toi et ton match.")}</li>
          </ul>
        </div>

        <div className="mt-6">
          <h2 className="font-medium text-[#333]">{t("Politique de confidentialité détaillée")}</h2>
          <div className="mt-4 grid gap-3">
            {POLICY.map(([title, d, Icon]) => (
              <article key={title} className={LEGAL_CARD}>
                <Icon className="h-6 w-6 text-[#111]" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="mt-3 font-extrabold tracking-[-0.01em] text-[#111]">{t(title)}</h3>
                <div className="mt-2 sm:flex sm:items-center sm:justify-between sm:gap-4">
                  <p className="text-sm leading-relaxed text-[#6b6b6b]">{t(d)}</p>
                  {title === "16. Contact" && (
                    // ponytail: pre-fills the contact form's subject — no separate GDPR request flow
                    <Link
                      to="/contact-us"
                      search={{ subject: "Supprimer mes données" }}
                      className="mt-3 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#111] px-4 py-2 text-sm font-medium text-white hover:bg-black sm:mt-0"
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      {t("Supprimer mes données")}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
