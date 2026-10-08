import { createFileRoute, Link } from "@tanstack/react-router";
import { SwivvSettingsTabs } from "@/components/swivv-settings-tabs";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Centre d'aide — SWIVV" }] }),
  component: HelpPage,
});

const LINKS = [
  { to: "/faq", title: "Questions fréquentes", desc: "Inscription, matching, messages, sécurité." },
  { to: "/comment-ca-marche", title: "Comment ça marche", desc: "Le fonctionnement de SWIVV en bref." },
  { to: "/guide-photos", title: "Guide photos", desc: "Des photos validées du premier coup." },
  { to: "/contact-us", title: "Nous contacter", desc: "Une question ? Écris-nous directement." },
] as const;

// ponytail: link hub over existing pages (no help backend) — search + articles when a real knowledge base ships
function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-medium text-[#333]">Centre d&apos;aide</h1>
        <SwivvSettingsTabs />
        <div className="mt-6 space-y-2">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="block rounded-lg bg-white p-4 shadow-sm hover:text-[#e91e63]">
              <span className="block text-[15px] font-medium text-[#333]">{l.title}</span>
              <span className="block text-sm text-[#777]">{l.desc}</span>
            </Link>
          ))}
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
