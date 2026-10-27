import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import * as T from "@/lib/swivv-email-templates";

export const Route = createFileRoute("/emails")({
  head: () => ({ meta: [{ title: "Aperçu des e-mails — SWIVV" }] }),
  component: EmailsPage,
});

// ponytail: static sample data, expand a template to render it — real admin preview with live data if the team ever needs it
const PREVIEWS: { label: string; slug?: string; subject: string; html: string }[] = [
  { label: "Vérification d'e-mail", ...T.swivvVerifyEmail({ name: "Emma", verifyUrl: "https://swivvmatch.com/verifier?token=exemple" }) },
  { label: "Bienvenue", ...T.swivvWelcome({ name: "Emma" }) },
  { label: "Profil incomplet", ...T.swivvProfileIncomplete({ name: "Emma", percent: 65 }) },
  { label: "Like reçu", ...T.swivvNewLike({ name: "Emma", likerName: "Karim" }) },
  { label: "Match", ...T.swivvNewMatch({ name: "Emma", matchName: "Karim" }) },
  { label: "Message reçu", ...T.swivvNewMessage({ name: "Emma", senderName: "Karim", senderPhoto: T.picksFor("man", 1)[0]?.photo, preview: "Salut Emma ! J'ai vu que tu aimes la randonnée, tu as un coin préféré ?" }) },
  { label: "Récap d'activité", ...T.swivvActivityDigest({ name: "Emma", likes: 3, messages: 2 }) },
  { label: "Nouveaux profils", ...T.swivvNewNearby({ name: "Emma", city: "Paris", count: 5 }) },
  { label: "Invitation témoignage", ...T.swivvTestimonialInvite({ name: "Emma" }) },
  { label: "Conseils sécurité", ...T.swivvSafetyTips({ name: "Emma" }) },
  { label: "Réengagement", ...T.swivvWeMissYou({ name: "Emma", likes: 2 }) },
  { label: "Mot de passe oublié", ...T.swivvPasswordReset({ name: "Emma", resetUrl: "https://swivvmatch.com/reset?token=exemple" }) },
  { label: "Signalement reçu", ...T.swivvReportReceived({ name: "Emma" }) },
  { label: "Compte supprimé", ...T.swivvAccountDeleted({ name: "Emma" }) },
  { label: "Promo", ...T.swivvPromo({ name: "Emma", headline: "Nouveau : les appels vidéo arrivent", detail: "Discute en vidéo avec tes matches, directement depuis SWIVV.", cta: "Découvrir", url: "/browse" }) },
  { label: "Matches du jour", slug: "matches-du-jour", ...T.swivvDailyMatches({ name: "Emma", matches: T.picksFor("man", 4) }) },
  { label: "Matches de la semaine", slug: "matches-de-la-semaine", ...T.swivvWeeklyMatches({ name: "Emma", matches: T.picksFor("man", 12) }) },
  { label: "Ajouter une photo", ...T.swivvAddPhoto({ name: "Emma" }) },
  { label: "Photo approuvée", ...T.swivvPhotoApproved({ name: "Emma" }) },
  { label: "Photo refusée", ...T.swivvPhotoRejected({ name: "Emma" }) },
  { label: "Profil masqué", ...T.swivvProfileHidden({ name: "Emma" }) },
  { label: "Retour après invisibilité", ...T.swivvProfileVisibleAgain({ name: "Emma" }) },
  { label: "Parrainage", ...T.swivvReferral({ name: "Emma" }) },
  { label: "Parrainage réussi", ...T.swivvReferralSuccess({ name: "Emma", friendName: "Karim" }) },
  { label: "Profil signalé", ...T.swivvProfileReported({ name: "Emma" }) },
  { label: "Contenu supprimé", ...T.swivvContentRemoved({ name: "Emma" }) },
  { label: "Suspension temporaire", ...T.swivvSuspendedTemp({ name: "Emma" }) },
  { label: "Suspension définitive", ...T.swivvSuspendedPerm({ name: "Emma" }) },
  { label: "Compte restauré", ...T.swivvAccountRestored({ name: "Emma" }) },
  { label: "CGU mises à jour", ...T.swivvTermsUpdated({ name: "Emma" }) },
  { label: "Confidentialité mise à jour", ...T.swivvPrivacyUpdated({ name: "Emma" }) },
  { label: "Cookies mis à jour", ...T.swivvCookiesUpdated({ name: "Emma" }) },
  { label: "App mobile", ...T.swivvAppAvailable({ name: "Emma" }) },
  { label: "Push désactivées", ...T.swivvPushDisabled({ name: "Emma" }) },
  { label: "Activer notifications", ...T.swivvEnableNotifications({ name: "Emma" }) },
  { label: "Nouvel appareil", ...T.swivvNewDevice({ name: "Emma", device: "iPhone 15 · Paris" }) },
  { label: "Enquête bienvenue", ...T.swivvWelcomeSurvey({ name: "Emma" }) },
  { label: "Avis d'usage", ...T.swivvFeedback({ name: "Emma" }) },
  { label: "Enquête produit", ...T.swivvProductSurvey({ name: "Emma" }) },
  { label: "Avis nouveauté", ...T.swivvFeatureFeedback({ name: "Emma", feature: "les appels vidéo" }) },
  { label: "Suggestion reçue", ...T.swivvFeatureRequestThanks({ name: "Emma" }) },
  { label: "Contact reçu", ...T.swivvContactReceived({ name: "Emma" }) },
  { label: "Réponse support", ...T.swivvSupportReply({ name: "Emma" }) },
  { label: "Signalement résolu", ...T.swivvReportResolved({ name: "Emma" }) },
];

function EmailsPage() {
  // ponytail: hash deep-link (e.g. /emails#matches-du-jour) opens + scrolls to one template — router search params if deep-linking ever needs filtering too
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  useEffect(() => {
    const h = window.location.hash.replace(/^#/, "");
    if (h) {
      setOpenSlug(h);
      requestAnimationFrame(() => document.getElementById(h)?.scrollIntoView());
    }
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-black text-white">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-medium text-[#333]">E-mails SWIVV ({PREVIEWS.length})</h1>
        <p className="mt-1 text-sm text-[#777]">Clique sur un modèle pour prévisualiser le rendu.</p>
        <div className="mt-6 space-y-3">
          {PREVIEWS.map((t, i) => (
            <details key={t.label} id={t.slug ?? `mail-${i}`} open={t.slug != null && openSlug === t.slug} onToggle={(e) => { if ((e.target as HTMLDetailsElement).open && t.slug) setOpenSlug(t.slug); }} className="overflow-hidden rounded-2xl border border-border bg-white scroll-mt-24">
              <summary className="cursor-pointer list-none px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="font-medium text-[#333]">{t.label}</span>
                <span className="mt-0.5 block text-sm text-[#777]">Objet : {t.subject}</span>
              </summary>
              <iframe title={t.label} srcDoc={t.html} className="h-[600px] w-full border-t border-border bg-white" sandbox="" />
            </details>
          ))}
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
