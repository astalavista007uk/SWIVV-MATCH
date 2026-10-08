import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/temoignage")({
  head: () => ({ meta: [{ title: "Partager votre témoignage — SWIVV" }] }),
  component: TemoignagePage,
});

function TemoignagePage() {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [story, setStory] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  // ponytail: dataURLs client-side only, post to backend/storage when testimonials go live
  function addPhotos(files: FileList | null) {
    if (!files) return;
    Array.from(files)
      .slice(0, Math.max(3 - photos.length, 0))
      .forEach((f) => {
        const r = new FileReader();
        r.onload = () =>
          setPhotos((p) => (p.length < 3 && typeof r.result === "string" ? [...p, r.result] : p));
        r.readAsDataURL(f);
      });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name1.trim() || !name2.trim() || !story.trim()) return;
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <span className="text-sm text-[#777]">Témoignage</span>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-medium text-[#333]">Partager votre témoignage</h1>
        <p className="mt-2 text-[#777]">
          Vous vous êtes dit oui grâce à SWIVV ? Racontez votre histoire, elle inspirera les prochains couples.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl bg-green-50 p-6 text-center">
            <p className="font-medium text-green-800">Merci {name1.trim()} & {name2.trim()} !</p>
            <p className="mt-1 text-sm text-green-700">
              Votre témoignage et vos photos doivent d'abord être validés par l'équipe SWIVV avant d'être publiés sur le blog.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name1" className="mb-1.5 block text-sm font-medium text-[#333]">
                  Ton prénom
                </label>
                <input
                  id="name1"
                  value={name1}
                  onChange={(e) => setName1(e.target.value)}
                  placeholder="Emma"
                  className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                />
              </div>
              <div>
                <label htmlFor="name2" className="mb-1.5 block text-sm font-medium text-[#333]">
                  Son prénom
                </label>
                <input
                  id="name2"
                  value={name2}
                  onChange={(e) => setName2(e.target.value)}
                  placeholder="Karim"
                  className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="story" className="mb-1.5 block text-sm font-medium text-[#333]">
                Votre histoire
              </label>
              <textarea
                id="story"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={6}
                maxLength={2000}
                placeholder="Comment vous êtes-vous rencontrés ? Le premier message, le premier rendez-vous, le déclic…"
                className="w-full rounded-md border border-border px-3 py-2.5 placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
              />
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-[#333]">
                Photos de couple (3 maximum)
              </span>
              {photos.length < 3 && (
                <label className="block cursor-pointer rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-[#777] hover:border-[#e91e63] hover:text-[#e91e63]">
                  + Ajouter des photos
                  <input type="file" accept="image/*" multiple onChange={(e) => addPhotos(e.target.files)} className="hidden" />
                </label>
              )}
              {!!photos.length && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {photos.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt={`Photo de couple ${i + 1}`} className="aspect-square w-full rounded-md object-cover" />
                      <button
                        type="button"
                        aria-label={`Retirer la photo ${i + 1}`}
                        onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!name1.trim() || !name2.trim() || !story.trim()}
              className="w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white disabled:opacity-40"
            >
              Envoyer notre témoignage
            </button>
          </form>
        )}
      </main>
      <SwivvFooter />
    </div>
  );
}
