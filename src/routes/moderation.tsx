import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { getModReports, resolveModReport, subscribe } from "@/lib/swivv-store";
import { getProfile } from "@/lib/swivv-data";
import { MODERATION_EMAIL } from "@/lib/swivv-email-templates";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/moderation")({
  head: () => ({ meta: [{ title: "Modération — SWIVV" }] }),
  component: ModerationPage,
});

// ponytail: unlisted device-local queue (no admin roles exist yet) — server table + admin gate when a real back-office lands
function useReports() {
  return useSyncExternalStore(subscribe, getModReports, () => []);
}

function ModerationPage() {
  const reports = useReports();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-medium text-[#333]">Modération</h1>
        <p className="mt-1 text-sm text-[#777]">
          Signalements de cet appareil. Les messages du formulaire de contact arrivent directement à{" "}
          <a className="font-medium text-[#e91e63] hover:underline" href={`mailto:${MODERATION_EMAIL}`}>{MODERATION_EMAIL}</a>.
        </p>
        <div className="mt-4 space-y-2">
          {reports.length === 0 && <p className="text-sm text-[#777]">Aucun signalement pour l&apos;instant.</p>}
          {reports.map((r) => {
            const p = getProfile(r.target);
            const subject = encodeURIComponent(`[SWIVV] Signalement ${p?.name ?? r.target}`);
            const body = encodeURIComponent(`Signalé par : ${r.by || "anonyme"}\nDate : ${new Date(r.at).toLocaleString("fr-FR")}\nProfil : ${p ? `${p.name} (${p.city})` : r.target}`);
            return (
              <div key={r.target} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-3">
                <span className="min-w-0 flex-1 text-sm text-[#333]">
                  <span className="font-medium">{p ? `${p.name} (${p.city})` : r.target}</span>
                  <span className="block text-xs text-[#999]">{r.by || "anonyme"} · {new Date(r.at).toLocaleString("fr-FR")}</span>
                  {!!r.detail && <span className="block text-xs text-[#333]">{r.detail}</span>}
                </span>
                <a
                  href={`mailto:${MODERATION_EMAIL}?subject=${subject}&body=${body}`}
                  className="rounded-md border border-[#e91e63] px-3 py-1.5 text-sm font-medium text-[#e91e63]"
                >
                  Transférer
                </a>
                <button
                  type="button"
                  onClick={() => resolveModReport(r.target)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-[#555]"
                >
                  Traité
                </button>
              </div>
            );
          })}
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
