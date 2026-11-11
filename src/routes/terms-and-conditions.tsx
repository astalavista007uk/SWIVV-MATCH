import { createFileRoute, Link } from "@tanstack/react-router";
import { Cookie, FileText, ReceiptText, Scale, ShieldCheck } from "lucide-react";
import { LEGAL_CARD, LEGAL_PILL, LegalHero } from "@/components/swivv-legal-hero";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { pageHead } from "@/lib/seo";
import { useLang, useT } from "@/lib/i18n";
import { ARTICLES, LegalArticleBody } from "@/routes/legal.terms";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () =>
    pageHead(
      "Conditions d'utilisation — SWIVV MATCH",
      "Conditions générales d'utilisation de SWIVV MATCH : règles du service, engagements des membres, modération, sécurité et recours.",
      "/terms-and-conditions",
    ),
  component: TermsPage,
});

const SECTIONS = [
  {
    t: "1. Le service",
    d: "SWIVV est un site de rencontres : profils, likes, matchs et messagerie privée. Tout est gratuit, sans carte bancaire, sans abonnement. Il faut avoir 18 ans ou plus pour s'inscrire.",
  },
  {
    t: "2. Tes engagements",
    d: "Tu publies des photos réelles et récentes de toi (ni dessins, ni célébrités), des informations exactes, et tu respectes les autres membres : pas de harcèlement, pas de discours haineux, pas de contenu sexuel non sollicité.",
  },
  {
    t: "3. Tolérance zéro",
    d: "Arnaques, demandes d'argent, faux profils et comportements abusifs entraînent un bannissement immédiat et définitif. Signale tout abus via la page contact.",
  },
  {
    t: "4. Rencontres réelles : prudence",
    d: "SWIVV ne vérifie pas l'identité de chaque membre dans la vie réelle. Le badge Identité confirme qu'une pièce officielle correspond à tes photos, mais ne constitue pas une preuve légale d'identité ; la pièce n'est conservée que le temps de la décision, puis supprimée. Pour un premier rendez-vous : lieu public, durée limitée, préviens un proche. Tu restes responsable de ta sécurité.",
  },
  {
    t: "5. Données et suppression",
    d: "Tes données servent uniquement au fonctionnement du service (profils, compatibilité, modération). Tu peux exporter ou supprimer tes données à tout moment, et supprimer ton compte en 1 clic.",
  },
  {
    t: "6. Contact et recours",
    d: "Pour toute question, réclamation ou contestation d'une décision de modération, écris-nous via la page contact. Le texte intégral ci-dessous fait foi et détaille notamment les droits prévus par le DSA pour les membres de l'Union européenne.",
  },
];

function TermsPage() {
  const t = useT();
  const lang = useLang();
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
        title={t("Conditions d'utilisation")}
        subtitle={t("Les règles du jeu, en clair : ce que tu acceptes en créant ton compte et comment SWIVV fonctionne.")}
        icon={Scale}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-[#6b6b6b]">
          {t("Dernière mise à jour : 3 novembre 2026.")}
        </p>
        {lang !== "fr" && (
          <p className="mt-2 rounded-md border border-border bg-[#f3f3f3] p-3 text-sm text-[#555]">
            {t("Ce document juridique est fourni en français ; la version française fait foi.")}
          </p>
        )}

        <h2 className="mt-8 font-extrabold tracking-[-0.01em] text-[#111]">{t("L'essentiel")}</h2>
        <div className="mt-3 grid gap-3">
          {SECTIONS.map((s) => (
            <section key={s.t} className={LEGAL_CARD}>
              <h3 className="font-extrabold tracking-[-0.01em] text-[#111]">{t(s.t)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b6b6b]">{t(s.d)}</p>
            </section>
          ))}
        </div>

        <h2 className="mt-10 font-extrabold tracking-[-0.01em] text-[#111]">{t("Conditions générales d'utilisation — texte intégral")}</h2>
        <div className="mt-3 grid gap-3">
          {ARTICLES.map(([title, body]) => (
            <section key={title} className={LEGAL_CARD}>
              <h3 className="font-extrabold tracking-[-0.01em] text-[#111]">{title}</h3>
              <LegalArticleBody body={body} />
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link to="/privacy-centre" className={LEGAL_PILL}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> {t("centre de confidentialité")}
          </Link>
          <Link to="/cookies" className={LEGAL_PILL}>
            <Cookie className="h-4 w-4" aria-hidden="true" /> {t("cookies")}
          </Link>
          <Link to="/cgv" className={LEGAL_PILL}>
            <ReceiptText className="h-4 w-4" aria-hidden="true" /> {t("CGV")}
          </Link>
          <Link to="/mentions-legales" className={LEGAL_PILL}>
            <FileText className="h-4 w-4" aria-hidden="true" /> {t("mentions légales")}
          </Link>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
