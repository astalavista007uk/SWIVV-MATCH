import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Search, Plus } from "lucide-react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { useT } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () =>
    pageHead(
      "FAQ — questions fréquentes sur SWIVV MATCH",
      "Réponses aux questions fréquentes sur SWIVV MATCH : gratuité, inscription, photos, matching, messages, sécurité et confidentialité.",
      "/faq",
    ),
  component: FaqPage,
});

type QA = { id: string; q: string; a: ReactNode };

// ponytail: inline Links, not markdown — answers stay plain data, no parser until the FAQ outgrows ~20 items
const BLOG = ({ slug, children }: { slug: string; children: ReactNode }) => (
  <Link to="/blog/$slug" params={{ slug }} className="font-medium text-[#e60050] hover:underline">{children}</Link>
);

const SECTIONS = (t: (fr: string) => string): { title: string; items: QA[] }[] => [
  {
    title: "Inscription & compte",
    items: [
      {
        id: "gratuit",
        q: "SWIVV est-il gratuit ?",
        a: "Oui. Créer ton profil, parcourir les profils, liker, matcher et discuter est gratuit et sans limite : messages écrits libres, vocaux et photos entre matchs.",
      },
      {
        id: "creer-profil",
        q: "Comment créer mon profil ?",
        a: <>{t("Clique sur « Créer mon profil » : en 2 minutes ton compte est créé (e-mail, mot de passe, infos de base). Complète ensuite ton profil à ton rythme — au moins 1 photo récente (5 maximum) pour être visible, ta bio, ton intention (relation sérieuse, mariage, belle histoire) puis tes centres d'intérêt.")}{" "}<Link to="/guide-photos" className="font-medium text-[#e60050] hover:underline">{t("Voir le guide photos")}</Link>{" "}{t("pour des photos validées du premier coup.")}</>,
      },
      {
        id: "supprimer-compte",
        q: "Comment supprimer mon compte ?",
        a: <>{t("Va dans ton profil, section paramètres, puis « Supprimer mon compte ». La suppression est immédiate et définitive, en 1 clic.")}{" "}<Link to="/parametres" className="font-medium text-[#e60050] hover:underline">{t("Aller aux paramètres")}</Link>.</>,
      },
      {
        id: "profil-refuse",
        q: "Pourquoi mon profil a-t-il été refusé ?",
        a: <>{t("SWIVV n'accepte que les vraies photos : ni dessins, ni illustrations, ni photos de célébrités. Ajoute des photos réelles et récentes pour être validé. Les erreurs les plus fréquentes sont listées")}{" "}<BLOG slug="photos-profil-erreurs-matchs">{t("dans cet article")}</BLOG>.</>,
      },
    ],
  },
  {
    title: "Matching & messages",
    items: [
      {
        id: "fonctionnement-matching",
        q: "Comment fonctionne le matching ?",
        a: <>{t("Tu likes les profils qui te plaisent et tu peux déjà leur écrire. Quand l'intérêt est réciproque, cela devient un match et les vocaux et les photos se débloquent. Chaque profil affiche un score de compatibilité calculé sur la ville, l'âge, les intérêts, la religion et les intentions.")}{" "}<BLOG slug="comprendre-le-matching">{t("Comprendre le matching")}</BLOG>{" "}{t("et")}{" "}<Link to="/comment-ca-marche" className="font-medium text-[#e60050] hover:underline">{t("comment ça marche")}</Link>.</>,
      },
      {
        id: "score-compatibilite",
        q: "Que veut dire le score de compatibilité ?",
        a: <>{t("C'est un pourcentage qui résume tes points communs : même ville, âges proches, intérêts partagés, même religion, mêmes langues et même intention. Plus il est élevé, plus tu as de chances de bien t'entendre. Détails")}{" "}<BLOG slug="comprendre-le-matching">{t("dans cet article")}</BLOG>.</>,
      },
      {
        id: "pas-de-reponse",
        q: "Je n'ai pas de réponse à mon message, que faire ?",
        a: <>{t("Attends 2-3 jours, envoie une seule relance polie, puis passe à autre chose. Personnalise tes premiers messages en rebondissant sur le profil : le taux de réponse triple. Exemples qui marchent")}{" "}<BLOG slug="premier-message-exemples-qui-marchent">{t("sur le blog SWIVV")}</BLOG>.</>,
      },
      {
        id: "discuter-avant-match",
        q: "Puis-je discuter avant un match ?",
        a: "Oui pour les messages écrits : tu peux écrire à qui tu veux, sans attendre de match. Les vocaux et les photos, eux, se débloquent entre matchs (intérêt réciproque) — c'est ce qui protège les membres des contenus non désirés.",
      },
    ],
  },
  {
    title: "Mariage & relations sérieuses",
    items: [
      {
        id: "mariage",
        q: "SWIVV convient-il pour trouver un mariage ?",
        a: <>{t("Oui. Beaucoup de membres cherchent le mariage : filtre par intention « Mariage » et indique tes valeurs religieuses. Sois clair sur ton projet dès ton profil.")}{" "}<BLOG slug="mariage-bien-utiliser-swivv">{t("Bien utiliser SWIVV pour le mariage")}</BLOG>.</>,
      },
      {
        id: "famille",
        q: "Puis-je impliquer ma famille ?",
        a: "Bien sûr. Après quelques échanges pour vérifier la compatibilité, tu peux présenter la personne à ta famille avant d'aller plus loin. C'est même recommandé pour un projet de mariage.",
      },
    ],
  },
  {
    title: "Sécurité",
    items: [
      {
        id: "faux-profil",
        q: "Comment reconnaître un faux profil ?",
        a: <>{t("Méfie-toi des photos trop parfaites sans vie quotidienne, des bios vides, des demandes rapides de changer d'application et surtout de toute demande d'argent. Les 8 signaux d'alerte sont détaillés")}{" "}<BLOG slug="arnaques-amoureuses-signaux-alerte">{t("dans cet article")}</BLOG>{t(". Privilégie les profils avec le badge vérifié.")}</>,
      },
      {
        id: "signaler-abus",
        q: "Comment signaler un abus ?",
        a: <>{t("Sur chaque profil et chaque conversation, utilise le bouton de signalement, ou")}{" "}<Link to="/contact-us" className="font-medium text-[#e60050] hover:underline">{t("écris-nous via la page contact")}</Link>{t(". La modération examine chaque signalement et bannit les comptes frauduleux.")}</>,
      },
      {
        id: "premier-rendez-vous",
        q: "Quels conseils pour un premier rendez-vous ?",
        a: <>{t("Choisis un lieu public, limite la durée à 1h30, préviens un proche de l'endroit et de l'heure, et garde tes informations personnelles (adresse, travail précis) pour plus tard. Le guide complet :")}{" "}<BLOG slug="reussir-premier-rendez-vous-conseils">{t("réussir son premier rendez-vous")}</BLOG>{" "}{t("et")}{" "}<BLOG slug="idees-premier-rendez-vous">{t("nos idées de sorties")}</BLOG>.</>,
      },
      {
        id: "donnees-protegees",
        q: "Mes données sont-elles protégées ?",
        a: <>{t("Tes photos et infos ne sont visibles que par les membres connectés. Tu peux demander la suppression totale de tes données à tout moment via la page contact. Détails dans notre")}{" "}<Link to="/legal/privacy" className="font-medium text-[#e60050] hover:underline">{t("politique de confidentialité")}</Link>.</>,
      },
    ],
  },
];

function FaqPage() {
  const t = useT();
  const allSections = SECTIONS(t);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  // ponytail: hash deep-link (/faq#signaler-abus) opens + scrolls to one answer — same pattern as /emails anchors
  useEffect(() => {
    const h = window.location.hash.replace(/^#/, "");
    if (!h) return;
    const found = allSections.some((s) => s.items.some((i) => i.id === h));
    if (found) {
      setOpen(h);
      requestAnimationFrame(() => document.getElementById(h)?.scrollIntoView());
    }
  }, []);

  const q = query.trim().toLowerCase();
  // ponytail: search matches the French source only — translate the index if EN/ES search is ever requested
  const sections = allSections.map((s) => ({
    ...s,
    items: s.items.filter(
      (i) => !q || `${i.q} ${typeof i.a === "string" ? i.a : ""}`.toLowerCase().includes(q),
    ),
  })).filter((s) => s.items.length > 0);

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
        <h1 className="text-3xl font-medium text-[#333]">{t("On répond à tout")}</h1>
        <p className="mt-2 text-[#777]">
          {t("Inscription, matching, mariage, sécurité : tout ce qu'il faut savoir sur SWIVV.")}
        </p>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Rechercher une question…")}
            aria-label={t("Rechercher une question")}
            className="w-full rounded-md border border-border bg-white py-2.5 pl-9 pr-3 text-[15px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e60050]"
          />
        </div>

        {sections.map((s) => (
          <section key={s.title} className="mt-8">
            <h2 className="font-medium text-[#333]">{t(s.title)}</h2>
            <div className="mt-2 divide-y divide-border rounded-xl bg-white">
              {s.items.map((item) => {
                const isOpen = open === item.id;
                return (
                  <div key={item.id} id={item.id} className="scroll-mt-24">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : item.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <span className="font-medium text-[#333]">{t(item.q)}</span>
                      <Plus
                        className={`h-4 w-4 shrink-0 text-[#e60050] transition-transform ${
                          isOpen ? "rotate-45" : ""
                        }`}
                      />
                    </button>
                    {isOpen && <p className="px-4 pb-4 text-sm leading-relaxed text-[#555]">{typeof item.a === "string" ? t(item.a) : item.a}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {sections.length === 0 && (
          <p className="mt-6 text-sm text-[#777]">{t("Aucune question trouvée pour « {query} ».", { query })}</p>
        )}

        <div className="mt-8 rounded-xl bg-[#e60050] p-6 text-center text-white">
          <p className="font-medium">{t("Toujours bloqué ?")}</p>
          <p className="mt-1 text-sm text-white/80">{t("L'équipe SWIVV répond en général sous 1 à 2 jours ouvrés.")}</p>
          <Link
            to="/contact-us"
            className="mt-4 inline-block rounded-md bg-white px-6 py-2.5 font-medium text-[#e60050]"
          >
            {t("Nous contacter")}
          </Link>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
