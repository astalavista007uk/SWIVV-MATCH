import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
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
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-medium text-[#333]">{t("Nos cookies, sans langue de bois")}</h1>
        <p className="mt-2 text-[#777]">
          {t("SWIVV n'utilise que des cookies techniques. Pas de publicité, pas de revente.")}
        </p>
        <div className="mt-6 space-y-3">
          <div className="rounded-xl bg-white p-5">
            <p className="flex items-center gap-2 font-medium text-[#333]">
              <Check className="h-4 w-4 text-green-600" /> {t("Cookies utilisés")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#555]">
              <li>{t("Session : te garder connecté(e) entre deux visites.")}</li>
              <li>{t("Préférences : langue, filtres de recherche mémorisés.")}</li>
              <li>{t("Sécurité : protection contre les abus et les faux comptes.")}</li>
              <li>{t("Mesures anonymes : pages visitées et site référent, via Vercel Analytics — sans cookie ni identification.")}</li>
            </ul>
          </div>
          <div className="rounded-xl bg-white p-5">
            <p className="flex items-center gap-2 font-medium text-[#333]">
              <X className="h-4 w-4 text-red-500" /> {t("Cookies que nous n'utilisons PAS")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#555]">
              <li>{t("Pas de cookies publicitaires ni de reciblage.")}</li>
              <li>{t("Pas de partage de ton activité amoureuse avec des tiers.")}</li>
              <li>{t("Pas de traceurs de réseaux sociaux intégrés aux profils.")}</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-sm text-[#777]">
          {t("Tu peux bloquer les cookies dans ton navigateur : le site reste consultable, mais la connexion et les filtres mémorisés ne fonctionneront plus. Questions ?")}{" "}
          <Link to="/contact-us" className="text-[#e60050] underline">
            {t("Contacte-nous")}
          </Link>
          .
        </p>
      </main>
      <SwivvFooter />
    </div>
  );
}
