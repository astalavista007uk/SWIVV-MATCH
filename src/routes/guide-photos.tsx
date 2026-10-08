import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/guide-photos")({
  head: () => ({ meta: [{ title: "Guide photos — SWIVV" }] }),
  component: PhotoGuidePage,
});

const DEMO_A = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=600&q=80";
const DEMO_B = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=faces&w=600&q=80";

// ponytail: same portrait twice, CSS-only defect simulation (blur/darkness) — real upload pairs if demos ever need authenticity
function Demo({ src, ok, label, bad }: { src: string; ok: boolean; label: string; bad?: "blur" | "dark" }) {
  return (
    <figure className="relative overflow-hidden rounded-xl">
      <img
        src={src}
        alt={label}
        loading="lazy"
        className={`aspect-[4/5] w-full object-cover ${bad === "blur" ? "blur-[6px]" : bad === "dark" ? "brightness-[0.45]" : ""}`}
      />
      <span
        className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white ${ok ? "bg-green-600" : "bg-red-600"}`}
        aria-label={ok ? "Photo acceptée" : "Photo refusée"}
      >
        {ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </span>
      <figcaption className={`px-2 py-1.5 text-center text-xs font-medium ${ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
        {label}
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
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e91e63]">Aide & Sécurité</p>
        <h1 className="mt-1 text-3xl font-medium text-[#333]">Guide photos</h1>
        <p className="mt-2 text-[#777]">
          Tes photos font ta première impression : voici ce qui passe, ce qui casse, et ce que la loi interdit.
        </p>

        <h2 className="mt-8 text-xl font-medium text-[#333]">Nette ou floue ? À toi de juger</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Demo src={DEMO_A} ok label="Nette et éclairée" />
          <Demo src={DEMO_A} ok={false} bad="blur" label="Floue" />
          <Demo src={DEMO_B} ok label="Visage visible" />
          <Demo src={DEMO_B} ok={false} bad="dark" label="Trop sombre" />
        </div>

        <h2 className="mt-8 flex items-center gap-2 text-xl font-medium text-[#333]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white"><Check className="h-4 w-4" /></span>
          À faire
        </h2>
        <ul className="mt-3 space-y-2">
          {DOS.map((d) => (
            <li key={d} className="flex gap-2 text-sm text-[#333]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {d}
            </li>
          ))}
        </ul>

        <h2 className="mt-8 flex items-center gap-2 text-xl font-medium text-[#333]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white"><X className="h-4 w-4" /></span>
          À ne jamais faire
        </h2>
        <ul className="mt-3 space-y-2">
          {DONTS.map((d) => (
            <li key={d} className="flex gap-2 text-sm text-[#333]">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" /> {d}
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-2xl bg-[#e91e63]/5 p-5 text-sm leading-relaxed text-[#555]">
          <p className="font-medium text-[#333]">Le cadre légal, en bref</p>
          <p className="mt-1">
            Publier la photo d&apos;une personne sans son consentement viole son droit à l&apos;image — demande toujours
            l&apos;accord des personnes reconnaissables. Les contenus interdits (CGU §7 : pornographie, mineurs,
            violence, usurpation) sont supprimés et peuvent entraîner la suspension du compte, voire un signalement
            aux autorités. En cas de doute, <Link to="/contact-us" search={{ subject: "Autre" }} className="font-medium text-[#e91e63] underline">contacte la modération</Link> avant
            de publier.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/verification" className="rounded-md bg-[#e91e63] px-5 py-2.5 text-sm font-medium text-white">
            Vérifier mes photos avec un selfie
          </Link>
          <Link to="/inscription" className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-[#555]">
            Modifier mes photos
          </Link>
        </div>
      </main>
      <SwivvFooter />
    </div>
  );
}
