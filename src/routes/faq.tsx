import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "Questions fréquentes — SWIVV" }] }),
  component: FaqPage,
});

type QA = { q: string; a: string };

const SECTIONS: { title: string; items: QA[] }[] = [
  {
    title: "Inscription & compte",
    items: [
      {
        q: "SWIVV est-il gratuit ?",
        a: "Oui. Créer ton profil, parcourir les profils, liker et recevoir des matchs est gratuit. Le premier message de chaque conversation est offert.",
      },
      {
        q: "Comment créer mon profil ?",
        a: "Clique sur « Créer mon profil », ajoute 3 photos récentes, écris ta bio, indique ton intention (relation sérieuse, mariage, belle histoire) puis tes centres d'intérêt. En 3 minutes, ton profil est visible.",
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "Va dans ton profil, section paramètres, puis « Supprimer mon compte ». La suppression est immédiate et définitive, en 1 clic.",
      },
      {
        q: "Pourquoi mon profil a-t-il été refusé ?",
        a: "SWIVV n'accepte que les vraies photos : ni dessins, ni illustrations, ni photos de célébrités. Ajoute des photos réelles et récentes pour être validé.",
      },
    ],
  },
  {
    title: "Matching & messages",
    items: [
      {
        q: "Comment fonctionne le matching ?",
        a: "Tu likes les profils qui te plaisent. Certains matchs sont réciproques et ouvrent une conversation. Chaque profil affiche un score de compatibilité calculé sur la ville, l'âge, les intérêts, la religion et les intentions.",
      },
      {
        q: "Que veut dire le score de compatibilité ?",
        a: "C'est un pourcentage qui résume vos points communs : même ville, âges proches, intérêts partagés, même religion, mêmes langues et même intention. Plus il est élevé, plus vous avez de chances de bien vous entendre.",
      },
      {
        q: "Je n'ai pas de réponse à mon message, que faire ?",
        a: "Attends 2-3 jours, envoie une seule relance polie, puis passe à autre chose. Personnalise tes premiers messages en rebondissant sur le profil : le taux de réponse triple. Nos conseils sont détaillés sur le blog SWIVV.",
      },
      {
        q: "Puis-je discuter avant un match ?",
        a: "Non : il faut un like puis un match pour ouvrir la conversation. C'est ce qui protège les membres des messages non désirés, comme sur les grands sites de rencontres.",
      },
    ],
  },
  {
    title: "Mariage & relations sérieuses",
    items: [
      {
        q: "SWIVV convient-il pour trouver un mariage ?",
        a: "Oui. Beaucoup de membres cherchent le mariage : filtre par intention « Mariage » et indique tes valeurs religieuses. Sois clair sur ton projet dès ton profil.",
      },
      {
        q: "Puis-je impliquer ma famille ?",
        a: "Bien sûr. Après quelques échanges pour vérifier la compatibilité, tu peux présenter la personne à ta famille avant d'aller plus loin. C'est même recommandé pour un projet de mariage.",
      },
    ],
  },
  {
    title: "Sécurité",
    items: [
      {
        q: "Comment reconnaître un faux profil ?",
        a: "Méfie-toi des photos trop parfaites sans vie quotidienne, des bios vides, des demandes rapides de changer d'application et surtout de toute demande d'argent. Privilégie les profils avec le badge vérifié.",
      },
      {
        q: "Comment signaler un abus ?",
        a: "Sur chaque profil et chaque conversation, utilise le bouton de signalement, ou écris-nous via la page contact. La modération examine chaque signalement et bannit les comptes frauduleux.",
      },
      {
        q: "Quels conseils pour un premier rendez-vous ?",
        a: "Choisis un lieu public, limite la durée à 1h30, préviens un proche de l'endroit et de l'heure, et garde tes informations personnelles (adresse, travail précis) pour plus tard.",
      },
      {
        q: "Mes données sont-elles protégées ?",
        a: "Tes photos et infos ne sont visibles que par les membres connectés. Tu peux demander la suppression totale de tes données à tout moment via la page contact. Détails dans notre politique de confidentialité.",
      },
    ],
  },
];

function FaqPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const sections = SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter(
      (i) => !q || `${i.q} ${i.a}`.toLowerCase().includes(q),
    ),
  })).filter((s) => s.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <span className="text-sm text-[#777]">Questions fréquentes</span>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-medium text-[#333]">On répond à tout</h1>
        <p className="mt-2 text-[#777]">
          Inscription, matching, mariage, sécurité : tout ce qu'il faut savoir sur SWIVV.
        </p>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une question…"
            aria-label="Rechercher une question"
            className="w-full rounded-md border border-border bg-white py-2.5 pl-9 pr-3 text-[15px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
          />
        </div>

        {sections.map((s) => (
          <section key={s.title} className="mt-8">
            <h2 className="font-medium text-[#333]">{s.title}</h2>
            <div className="mt-2 divide-y divide-border rounded-xl bg-white">
              {s.items.map((item) => {
                const key = `${s.title}-${item.q}`;
                const isOpen = open === key;
                return (
                  <div key={key}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : key)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <span className="font-medium text-[#333]">{item.q}</span>
                      <Plus
                        className={`h-4 w-4 shrink-0 text-[#e91e63] transition-transform ${
                          isOpen ? "rotate-45" : ""
                        }`}
                      />
                    </button>
                    {isOpen && <p className="px-4 pb-4 text-sm leading-relaxed text-[#555]">{item.a}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {sections.length === 0 && (
          <p className="mt-6 text-sm text-[#777]">Aucune question trouvée pour « {query} ».</p>
        )}

        <div className="mt-8 rounded-xl bg-[#e91e63] p-6 text-center text-white">
          <p className="font-medium">Toujours bloqué ?</p>
          <p className="mt-1 text-sm text-white/80">L'équipe SWIVV répond en général en moins de 24 h.</p>
          <Link
            to="/contact-us"
            className="mt-4 inline-block rounded-md bg-white px-6 py-2.5 font-medium text-[#e91e63]"
          >
            Nous contacter
          </Link>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
