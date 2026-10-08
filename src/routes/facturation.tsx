import { createFileRoute, Link } from "@tanstack/react-router";
import { SwivvSettingsTabs } from "@/components/swivv-settings-tabs";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";

export const Route = createFileRoute("/facturation")({
  head: () => ({ meta: [{ title: "Facturation — SWIVV" }] }),
  component: FacturationPage,
});

// ponytail: static free-tier notice (no paid plans per CGV) — invoice list + Stripe portal when billing ships
function FacturationPage() {
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
        <h1 className="text-2xl font-medium text-[#333]">Facturation</h1>
        <SwivvSettingsTabs />
        <div className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-[15px] text-[#333]">SWIVV est entièrement gratuit : aucun abonnement, aucun paiement, donc aucune facture.</p>
          <p className="mt-2 text-sm text-[#777]">
            Si des options payantes voient le jour, tes factures apparaîtront ici.
          </p>
          <Link to="/cgv" className="mt-4 inline-block text-sm font-medium text-[#e91e63] hover:underline">
            Voir les conditions tarifaires (CGV)
          </Link>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
