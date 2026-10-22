import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SwivvSettingsTabs } from "@/components/swivv-settings-tabs";
import { SwivvAuthButtons, getMyRawProfile, openAuthModal } from "@/lib/swivv-auth";
import { useAuth } from "@/hooks/use-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";
import {
  downloadFreeStatementPdf,
  formatFrDate,
  freeStatements,
  billToFirstName,
  statementMonthLabel,
  viewFreeStatementPdf,
  type FreeStatement,
} from "@/lib/free-statements";

export const Route = createFileRoute("/facturation")({
  head: () => ({ meta: [{ title: "Relevés d'accès — SWIVV" }] }),
  component: FacturationPage,
});

// ponytail: statements derive from the signed-in account only (no server docs, nothing to steal) — genuine invoices get their own list + access checks when paid plans ship
function FacturationPage() {
  const { user, loading } = useAuth();
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    // ponytail: relevé name must not depend on photos (getMyProfile requires them) — raw profile, else guarded auth metadata, else email fallback inside billToFirstName
    if (user) getMyRawProfile().then((p) => setName(p?.name ?? (user.user_metadata as { name?: string } | undefined)?.name ?? null)).catch(() => setName((user.user_metadata as { name?: string } | undefined)?.name ?? null));
  }, [user?.id]);
  const rows: FreeStatement[] = user?.created_at ? freeStatements(user.created_at, user.id) : [];
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-medium text-[#333]">Relevés d'accès</h1>
        <SwivvSettingsTabs />
        <section aria-label="Mon accès et mes relevés" className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-[#333]">Mon accès et mes relevés</h2>
          <dl className="mt-4 space-y-2 text-[15px] text-[#333]">
            <div className="flex justify-between gap-4"><dt>Formule actuelle</dt><dd className="font-medium">Gratuit</dd></div>
            <div className="flex justify-between gap-4"><dt>Montant mensuel</dt><dd className="font-medium">0,00 €</dd></div>
            <div className="flex justify-between gap-4"><dt>Statut</dt><dd className="font-medium text-[#356639]">Accès gratuit actif</dd></div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-[#555]">
            Profite gratuitement des fonctionnalités actuellement disponibles sur SWIVV MATCH.
            Retrouve ci-dessous tes relevés mensuels récapitulant ton accès gratuit à la plateforme.
            Toute évolution future de nos offres te sera communiquée clairement. Aucun paiement
            n'est requis et aucun abonnement payant ne sera activé sans ton accord explicite.
          </p>
        </section>
        <section aria-label="Historique de mes relevés" className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-[#333]">Historique de mes relevés</h2>
          {loading ? (
            <p className="mt-3 text-sm text-[#777]">Chargement…</p>
          ) : !user ? (
            <p className="mt-3 text-sm text-[#555]">
              <button type="button" onClick={() => openAuthModal("account", "signin")} className="font-medium text-[#e91e63] hover:underline">Connecte-toi</button> pour voir tes relevés mensuels d'accès gratuit.
            </p>
          ) : rows.length === 0 ? (
            <p className="mt-3 text-sm text-[#555]">
              Aucun relevé pour le moment : ton premier relevé sera disponible à la fin de ton premier mois complet
              (compte créé le {user.created_at ? formatFrDate(user.created_at.slice(0, 10)) : "—"}).
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[#eee]">
              {rows.map((r) => (
                <li key={r.ref} className="flex flex-wrap items-center gap-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium capitalize text-[#333">{statementMonthLabel(r)}</p>
                    <p className="text-xs text-[#777]">
                      Relevé mensuel d'accès gratuit · 0,00 € · Gratuit · émis le {formatFrDate(r.issueIso)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => viewFreeStatementPdf(r, billToFirstName(name, user.email), user.created_at ?? "")}
                    className="rounded-full border border-[#356639] px-4 py-1.5 text-sm font-medium text-[#356639] hover:bg-[#356639]/10"
                  >
                    Voir
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadFreeStatementPdf(r, billToFirstName(name, user.email), user.created_at ?? "")}
                    className="rounded-full bg-[#356639] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    Télécharger le PDF
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="mt-4 rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-[15px] text-[#333]">SWIVV est entièrement gratuit : aucun abonnement, aucun paiement, donc aucune facture.</p>
          <p className="mt-2 text-sm text-[#777]">
            Si des options payantes voient le jour, elles feront l'objet de factures séparées.
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
