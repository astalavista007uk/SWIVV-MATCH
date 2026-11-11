import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Cookie, Mail, ShieldCheck, X } from "lucide-react";
import { LEGAL_PILL, LegalHero } from "@/components/swivv-legal-hero";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { pageHead } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/cookies")({
  head: () =>
    pageHead(
      "Politique cookies — SWIVV MATCH",
      "Politique cookies de SWIVV MATCH : quels cookies et stockages locaux sont utilisés et pourquoi.",
      "/cookies",
    ),
  component: CookiesPage,
});

function CookiesPage() {
  const t = useT();
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
        title={t("Nos cookies, sans langue de bois")}
        subtitle={t("SWIVV n'utilise que des cookies techniques. Pas de publicité, pas de revente.")}
        icon={Cookie}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <section className="rounded-2xl bg-[#f3f3f3] p-5">
            <p className="flex items-center gap-2.5 font-extrabold text-[#111]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#111] text-white">
                <Check className="h-4 w-4" aria-hidden="true" />
              </span>
              {t("Cookies utilisés")}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#6b6b6b]">
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#111]" aria-hidden="true" />{t("Session : te garder connecté(e) entre deux visites.")}</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#111]" aria-hidden="true" />{t("Préférences : langue, filtres de recherche mémorisés.")}</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#111]" aria-hidden="true" />{t("Sécurité : protection contre les abus et les faux comptes.")}</li>
            </ul>
          </section>
          <section className="rounded-2xl bg-[#f3f3f3] p-5">
            <p className="flex items-center gap-2.5 font-extrabold text-[#111]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#111] text-white">
                <X className="h-4 w-4" aria-hidden="true" />
              </span>
              {t("Cookies que nous n'utilisons PAS")}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#6b6b6b]">
              <li className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-[#111]" aria-hidden="true" />{t("Pas de cookies publicitaires ni de reciblage.")}</li>
              <li className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-[#111]" aria-hidden="true" />{t("Pas de partage de ton activité amoureuse avec des tiers.")}</li>
              <li className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-[#111]" aria-hidden="true" />{t("Pas de traceurs de réseaux sociaux intégrés aux profils.")}</li>
            </ul>
          </section>
        </div>
        <section className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e60050]/10 text-[#e60050]">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-extrabold tracking-[-0.01em] text-[#111]">{t("Liste des stockages utilisés")}</h2>
              <p className="mt-1 text-sm text-[#6b6b6b]">
                {t("Dernière mise à jour : 3 novembre 2026. Responsable : SWIVV MATCH, 10 Rue Thureau Dangin, 75015 Paris — contact@swivvmatch.com.")}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["swivv_lang", "Cookie", "Langue choisie (FR/EN/ES)", "1 an"],
              ["sb-<projet>-auth-token", "localStorage", "Session connectée (Supabase)", "Jusqu'à déconnexion ou expiration"],
              ["swivv-cgu-accepted", "localStorage", "Mémoriser l'acceptation des CGU", "Jusqu'à effacement"],
              ["swivv-signup-draft, swivv-pending-profile", "localStorage", "Reprendre une inscription interrompue", "Jusqu'à effacement"],
              ["swivv:notif-cd", "localStorage", "Limiter le spam de notifications", "24 heures"],
            ].map(([name, type, purpose, duration]) => {
              const pill =
                type === "Sans cookie" ? "bg-emerald-600" : type === "Cookie" ? "bg-[#e60050]" : "bg-[#111]";
              return (
                <div key={name} className="rounded-xl border border-border bg-[#fafafa] p-4 transition-colors hover:border-[#e60050]/40">
                  <div className="flex items-start justify-between gap-3">
                    <code className="break-all text-xs font-semibold text-[#111]">{name}</code>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-white ${pill}`}>
                      {t(type)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#555]">{t(purpose)}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[#888]">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {t(duration)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-5 space-y-3 rounded-xl bg-[#f3f3f3] p-4 text-sm leading-relaxed text-[#6b6b6b]">
            <p>
              {t("Pourquoi aucun bandeau de consentement : nous n'utilisons que des traceurs strictement nécessaires (session, langue, sécurité, acceptation des CGU) et une mesure d'audience sans cookie ni identification, exemptée de consentement. Aucun traceur publicitaire ou de reciblage n'est déposé. Si un traceur non essentiel est ajouté, un bandeau de consentement sera affiché avant tout dépôt, avec un moyen de refuser aussi simple que d'accepter.")}
            </p>
            <p>
              {t("Comment les supprimer : la déconnexion efface la session ; efface les cookies et données de site dans les réglages de ton navigateur ; ou utilise le mode navigation privée. Le blocage des stockages techniques peut empêcher la connexion et la mémorisation de tes filtres. Pour toute question ou pour exercer tes droits, écris-nous ou adresse une réclamation à la CNIL (cnil.fr).")}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/privacy-centre" className={LEGAL_PILL}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> {t("centre de confidentialité")}
            </Link>
            <Link to="/contact-us" className={LEGAL_PILL}>
              <Mail className="h-4 w-4" aria-hidden="true" /> {t("Contacte-nous")}
            </Link>
          </div>
        </section>
      </main>
      <SwivvFooter />
    </div>
  );
}
