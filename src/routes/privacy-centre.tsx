import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Download, Trash2, Lock } from "lucide-react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/privacy-centre")({
  head: () => ({ meta: [{ title: "Centre de confidentialité — SWIVV" }] }),
  component: PrivacyCentrePage,
});

function PrivacyCentrePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <span className="text-sm text-[#777]">Confidentialité</span>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-medium text-[#333]">Centre de confidentialité</h1>
        <p className="mt-2 text-[#777]">
          Tes données t'appartiennent. Voici ce que SWIVV collecte, pourquoi, et comment reprendre le contrôle.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: <Eye className="h-5 w-5 text-[#e91e63]" />,
              t: "Ce que voient les membres",
              d: "Tes photos, prénom, âge, ville, bio et centres d'intérêt. Ton e-mail et ta position exacte restent privés.",
            },
            {
              icon: <Lock className="h-5 w-5 text-[#e91e63]" />,
              t: "Ce que SWIVV utilise",
              d: "Tes préférences et tes likes servent uniquement à calculer tes scores de compatibilité. Jamais revendues, jamais partagées à des annonceurs.",
            },
            {
              icon: <Download className="h-5 w-5 text-[#e91e63]" />,
              t: "Exporter mes données",
              d: "Écris-nous via la page contact avec l'objet « Supprimer mes données » en précisant « export » : tu reçois une copie sous 30 jours.",
            },
            {
              icon: <Trash2 className="h-5 w-5 text-[#e91e63]" />,
              t: "Tout supprimer",
              d: "Supprime ton compte en 1 clic depuis ton profil, ou demande la suppression totale via la page contact. Tes photos et messages sont effacés.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-xl bg-white p-5">
              {c.icon}
              <p className="mt-2 font-medium text-[#333]">{c.t}</p>
              <p className="mt-1 text-sm text-[#777]">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl bg-white p-6 text-sm leading-relaxed text-[#555]">
          <h2 className="font-medium text-[#333]">En résumé</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Pas de publicité ciblée avec tes données de rencontres.</li>
            <li>Pas de géolocalisation précise affichée (ville + distance en km uniquement).</li>
            <li>Messages privés : visibles uniquement par toi et ton match.</li>
            <li>Détails complets dans la <Link to="/legal/privacy" className="text-[#e91e63] underline">politique de confidentialité</Link>.</li>
          </ul>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
