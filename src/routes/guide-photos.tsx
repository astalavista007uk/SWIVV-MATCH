import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { pageHead } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/guide-photos")({
  head: () =>
    pageHead(
      "Guide photos de profil — SWIVV MATCH",
      "Guide photos SWIVV MATCH : quelles photos sont acceptées, quelles erreurs éviter et comment mettre en valeur ton profil.",
      "/guide-photos",
    ),
  component: PhotoGuidePage,
});

const DEMO_A = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=600&q=80";
const DEMO_B = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=faces&w=600&q=80";

// ponytail: same portrait twice, CSS-only defect simulation (blur/darkness) — real upload pairs if demos ever need authenticity
function Demo({ src, ok, label, bad }: { src: string; ok: boolean; label: string; bad?: "blur" | "dark" }) {
  const t = useT();
  return (
    <figure className="relative overflow-hidden rounded-xl">
      <img
        src={src}
        alt={t(label)}
        loading="lazy"
        className={`aspect-[4/5] w-full object-cover ${bad === "blur" ? "blur-[6px]" : bad === "dark" ? "brightness-[0.45]" : ""}`}
      />
      <span
        className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white ${ok ? "bg-green-600" : "bg-red-600"}`}
        aria-label={ok ? t("Photo acceptée") : t("Photo refusée")}
      >
        {ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </span>
      <figcaption className={`px-2 py-1.5 text-center text-xs font-medium ${ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
        {t(label)}
      </figcaption>
    </figure>
  );
}

const DOS = [
  "Une photo récente (moins d'un an) qui te ressemble aujourd'hui.",
  "Ton visage bien visible sur la première photo, de face, sans lunettes de soleil.",
  "La lumière naturelle : près d'une fenêtre ou en extérieur, jamais à contre-jour.",
  "Un mélange : portrait, photo en pied, et une photo en activité (sport, voyage, passion).",
  "Un sourire naturel — les profils souriants reçoivent nettement plus de likes.",
  "5 photos maximum : qualité plutôt que quantité.",
];

const DONTS = [
  "Nudité et exhibition : torse nu suggestif, sous-vêtements, poses sexuelles — compte suspendu.",
  "Contenus sexuellement explicites ou pornographiques — interdits et supprimés (CGU §7).",
  "D'autres personnes reconnaissables sans leur consentement : chacun a un droit à l'image.",
  "Des mineurs sur tes photos, dans quelque contexte que ce soit.",
  "Photos floues, trop sombres, pixelisées ou prises de trop loin.",
  "Lunettes de soleil, casquette ou masque sur toutes les photos : on doit voir ton visage.",
  "Photos de groupe en photo principale, captures d'écran, mèmes, logos ou texte incrusté.",
  "Photos volées : stars, influenceurs, images internet — usurpation d'identité.",
  "Contenus violents, haineux, discriminatoires ou illégaux.",
];

function PhotoGuidePage() {
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
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e60050]">{t("Aide & Sécurité")}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] text-[#111] sm:text-4xl">{t("Guide photos")}</h1>
        <p className="mt-2 max-w-2xl text-[#6b6b6b]">
          {t("Tes photos font ta première impression : voici ce qui passe, ce qui casse, et ce que la loi interdit.")}
        </p>

        <h2 className="mt-8 text-xl font-extrabold tracking-[-0.01em] text-[#111]">{t("Nette ou floue ? À toi de juger")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Demo src={DEMO_A} ok label="Nette et éclairée" />
          <Demo src={DEMO_A} ok={false} bad="blur" label="Floue" />
          <Demo src={DEMO_B} ok label="Visage visible" />
          <Demo src={DEMO_B} ok={false} bad="dark" label="Trop sombre" />
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          <section className="rounded-2xl bg-[#f3f3f3] p-5">
            <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-[-0.01em] text-[#111]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#111] text-white"><Check className="h-4 w-4" aria-hidden="true" /></span>
              {t("À faire")}
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#6b6b6b]">
              {DOS.map((d) => (
                <li key={d} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" /> {t(d)}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl bg-[#f3f3f3] p-5">
            <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-[-0.01em] text-[#111]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#111] text-white"><X className="h-4 w-4" aria-hidden="true" /></span>
              {t("À ne jamais faire")}
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#6b6b6b]">
              {DONTS.map((d) => (
                <li key={d} className="flex gap-2">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" /> {t(d)}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-6 rounded-2xl bg-[#f3f3f3] p-5 text-sm leading-relaxed text-[#6b6b6b]">
          <p className="font-extrabold tracking-[-0.01em] text-[#111]">{t("Le cadre légal, en bref")}</p>
          <p className="mt-2">
            {t("Publier la photo d'une personne sans son consentement viole son droit à l'image — demande toujours l'accord des personnes reconnaissables. Les contenus interdits (CGU §7 : pornographie, mineurs, violence, usurpation) sont supprimés et peuvent entraîner la suspension du compte, voire un signalement aux autorités. En cas de doute,")}{" "}
            <Link to="/contact-us" search={{ subject: "Autre" }} className="font-medium text-[#e60050] underline">{t("contacte la modération")}</Link>{" "}
            {t("avant de publier.")}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/verification" className="inline-flex items-center gap-3 rounded-full bg-[#111] py-2 pl-5 pr-2 text-sm font-semibold text-white hover:bg-black">
            {t("Vérifier mes photos avec un selfie")}
            <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm leading-none text-[#111]">→</span>
          </Link>
          <Link to="/mon-profil" className="inline-flex items-center rounded-full border border-black/15 bg-white px-5 py-2 text-sm font-medium text-[#111]">
            {t("Modifier mes photos")}
          </Link>
        </div>

        <div className="mt-6 rounded-2xl bg-[#f3f3f3] p-5 text-sm leading-relaxed text-[#6b6b6b]">
          <p className="font-extrabold tracking-[-0.01em] text-[#111]">{t("Badge Identité")}</p>
          <p className="mt-2">
            {t("En plus du badge photos, tu peux vérifier ton identité avec une pièce officielle. La comparaison du visage se fait dans ton navigateur : si elle correspond, aucune pièce n'est envoyée ni stockée. En cas de doute, la pièce est conservée en privé pour la modération et supprimée dès la décision.")}{" "}
            <Link to="/verification" className="font-medium text-[#e60050] underline">{t("Vérifier mon identité")}</Link>.
          </p>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
