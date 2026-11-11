import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, CircleHelp, Mail, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { SwivvSettingsTabs } from "@/components/swivv-settings-tabs";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";
import { pageHead } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/help")({
  head: () =>
    pageHead(
      "Centre d'aide — SWIVV MATCH",
      "Centre d'aide SWIVV MATCH : questions fréquentes, guide photos, fonctionnement du matching et contact.",
      "/help",
    ),
  component: HelpPage,
});

const LINKS: { to: string; title: string; desc: string; Icon: LucideIcon }[] = [
  { to: "/faq", title: "Questions fréquentes", desc: "Inscription, matching, messages, sécurité.", Icon: CircleHelp },
  { to: "/comment-ca-marche", title: "Comment ça marche", desc: "Le fonctionnement de SWIVV en bref.", Icon: Sparkles },
  { to: "/guide-photos", title: "Guide photos", desc: "Des photos validées du premier coup.", Icon: Camera },
  {
    to: "/verification",
    title: "Vérifier mon profil",
    desc: "Badges Photos et Identité : comment ça marche et quelles données sont conservées.",
    Icon: ShieldCheck,
  },
  { to: "/contact-us", title: "Nous contacter", desc: "Une question ? Écris-nous directement.", Icon: Mail },
];

// ponytail: link hub over existing pages (no help backend) — search + articles when a real knowledge base ships
function HelpPage() {
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

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-[#111]">{t("Centre d'aide")}</h1>
        <SwivvSettingsTabs />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {LINKS.map(({ to, title, desc, Icon }) => (
            <Link
              key={to}
              to={to}
              className="swivv-panel swivv-panel--slim swivv-panel--plain group flex items-start gap-4 no-underline transition-colors hover:bg-white"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#111] text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-extrabold tracking-[-0.01em] text-[#111]">{t(title)}</span>
                <span className="mt-1 block text-sm leading-relaxed text-[#6b6b6b]">{t(desc)}</span>
              </span>
            </Link>
          ))}
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
