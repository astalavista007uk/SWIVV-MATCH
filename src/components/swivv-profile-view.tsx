import { useState, type ReactNode } from "react";
import { BadgeCheck, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  birthRankLabel,
  petsLabel,
  relocateLabel,
  siblingSummary,
  type SwivvProfile,
} from "@/lib/swivv-data";
import { realDistance, useMyCity } from "@/lib/location-distance";
import { getAppLang } from "@/lib/swivv-store";
import { eachImageUrl } from "@/routes/inscription";

function FactGrid({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-lg bg-white p-3">
          <dt className="text-xs uppercase text-[#999]">{k}</dt>
          <dd className="font-medium text-[#333]">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

// ponytail: declared mother tongue → ISO code for the translate toggle (covers the 47 signup suggestions, accent-insensitive; free-text variants fall back to hiding the button) — extend if the signup list grows
const LANG_CODE: Record<string, string> = {
  francais: "fr", anglais: "en", arabe: "ar", espagnol: "es", italien: "it", portugais: "pt",
  allemand: "de", neerlandais: "nl", turc: "tr", kabyle: "kab", russe: "ru", polonais: "pl",
  roumain: "ro", ukrainien: "uk", grec: "el", suedois: "sv", norvegien: "no", danois: "da",
  finnois: "fi", hongrois: "hu", tcheque: "cs", bulgare: "bg", croate: "hr", serbe: "sr",
  albanais: "sq", armenien: "hy", persan: "fa", hebreu: "he", hindi: "hi", ourdou: "ur",
  bengali: "bn", mandarin: "zh", japonais: "ja", coreen: "ko", vietnamien: "vi", thai: "th",
  indonesien: "id", wolof: "wo", bambara: "bm", lingala: "ln", swahili: "sw", somali: "so",
  catalan: "ca", basque: "eu", breton: "br", corse: "co", creole: "ht",
};
function langCode(name: string | undefined): string | null {
  if (!name) return null;
  const k = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return LANG_CODE[k] ?? null;
}

// ponytail: on-demand MyMemory translation (free, no key, writer's declared tongue as source, reader's app language as target) shown only when the two differ — list values are split per item because a joined "a, b, c" makes MT leave words untranslated; server-side translate + cached translations if anonymous quotas ever bite
function BestFeatureValue({ text = "", firstLanguage }: { text?: string; firstLanguage?: string }) {
  // ponytail: reader's chosen language, not the browser's (a French browser with English set still reads English)
  const [visitor] = useState(getAppLang);
  const [translated, setTranslated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!text) return null;
  const src = langCode(firstLanguage);
  if (!src || src === visitor) return <>{text}</>;
  const source = src;
  async function one(seg: string): Promise<string> {
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(seg)}&langpair=${encodeURIComponent(source)}|${encodeURIComponent(visitor)}`);
      const j = (await r.json()) as { responseData?: { translatedText?: string } };
      const t = j?.responseData?.translatedText?.trim();
      return t && t.toLowerCase() !== seg.toLowerCase() ? t : seg;
    } catch {
      return seg;
    }
  }
  async function toggle() {
    if (translated) {
      setTranslated(null);
      return;
    }
    setBusy(true);
    try {
      const parts = text.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
      const out = await Promise.all(parts.map(one));
      const joined = out.join(", ");
      if (joined && joined !== text) setTranslated(joined);
      else toast.error("Traduction indisponible. Réessaie.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <span>
      {translated ?? text}{" "}
      <button type="button" onClick={toggle} disabled={busy} className="text-xs font-normal text-[#e91e63] hover:underline disabled:opacity-50">
        {translated ? "Voir l'original" : "Traduire"}
      </button>
    </span>
  );
}

type Props = {
  profile: SwivvProfile;
  /** e.g. compatibility badge ("92% compatible · …") or "Mon profil". */
  badge?: ReactNode;
  /** Like / Message buttons under the photo gallery (member pages). */
  actions?: ReactNode;
  /** Extra full-width content after the sections (e.g. similar profiles). */
  after?: ReactNode;
  /** When set, the gallery becomes editable (Mon Profil only): add/remove + save. */
  onSavePhotos?: (photos: string[]) => Promise<string | null>;
};

// ponytail: edit UI lives in the gallery, save stays with the caller —
// a crop/reorder step if photo polish is ever asked for
function EditableGallery({ profile, onSavePhotos }: { profile: SwivvProfile; onSavePhotos: (photos: string[]) => Promise<string | null> }) {
  const [photos, setPhotos] = useState<string[]>(() => (profile.photos ?? []).slice(0, 5));
  const [idx, setIdx] = useState(0);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  // ponytail: touch drag mirrors HTML5 DnD (mobile Safari skips it) — tap-to-promote stays the precise path; arrows if ordering ever needs more
  const [touchFrom, setTouchFrom] = useState<number | null>(null);
  const [touchOver, setTouchOver] = useState<number | null>(null);
  // ponytail: finger-following ghost (desktop gets a native drag image free; touch gets none) — drop if a dnd lib ever lands
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const changed = JSON.stringify(photos) !== JSON.stringify((profile.photos ?? []).slice(0, 5));

  function add(files: FileList | null) {
    if (!files) return;
    setErr(null);
    const { skipped, tooBig } = eachImageUrl(files, Math.max(0, 5 - photos.length), (url) => {
      setPhotos((p) => (p.includes(url) || p.length >= 5 ? p : [...p, url]));
    });
    if (skipped) setErr("5 photos maximum. Les photos en trop ont été ignorées.");
    else if (tooBig) setErr("Photo trop lourde (2,5 Mo max). Choisis-en une plus légère.");
  }

  function remove(src: string) {
    setPhotos((p) => {
      const next = p.filter((x) => x !== src);
      if (idx >= next.length) setIdx(0);
      return next;
    });
  }

  // ponytail: native HTML5 drag (desktop) + touch drag (mobile, no lib) + tap-to-promote (precise path) — arrows if ordering ever needs more
  function move(from: number, to: number) {    if (from === to) return;
    setPhotos((p) => {
      const next = [...p];
      const [one] = next.splice(from, 1);
      next.splice(to, 0, one!);
      return next;
    });
    setIdx(to);
  }

  async function save() {
    if (photos.length === 0) {
      setErr("Garde au moins 1 photo.");
      return;
    }
    setBusy(true);
    try {
      const saveErr = await onSavePhotos(photos.slice(0, 5));
      setErr(saveErr);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white">
      <div className="relative">
        {photos[idx] ? (
          <img src={photos[idx]} alt={`Photo de ${profile.name}`} className="aspect-[4/5] w-full object-cover" />
        ) : (
          <p className="flex aspect-[4/5] w-full items-center justify-center rounded-md border border-dashed border-[#ccc] px-6 text-center text-sm text-[#999]">Aucune photo - Cliquez sur le bouton + en bas pour ajouter vos photos.</p>
        )}
        {idx === 0 && photos.length > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-[#e91e63] px-2 py-0.5 text-[11px] font-medium text-white">
            Principale
          </span>
        )}
        {idx > 0 && photos[idx] && (
          <button
            type="button"
            onClick={() => move(idx, 0)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80"
          >
            Faire de cette photo la principale
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        {photos.map((src, i) => (
          <div
            key={src}
            data-thumb={i}
            draggable
            onDragStart={(e) => { setDragFrom(i); e.dataTransfer.effectAllowed = "move"; }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
            onDrop={(e) => { e.preventDefault(); if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); }}
            onDragEnd={() => setDragFrom(null)}
            onTouchStart={(e) => { const t = e.touches[0]; setTouchFrom(i); setTouchOver(i); setGhost(t ? { x: t.clientX, y: t.clientY } : null); }}
            onTouchMove={(e) => {
              const t = e.touches[0];
              if (!t) return;
              setGhost({ x: t.clientX, y: t.clientY });
              const el = document.elementFromPoint(t.clientX, t.clientY)?.closest("[data-thumb]");
              setTouchOver(el ? Number((el as HTMLElement).dataset.thumb) : null);
            }}
            onTouchEnd={() => { if (touchFrom !== null && touchOver !== null) move(touchFrom, touchOver); setTouchFrom(null); setTouchOver(null); setGhost(null); }}
            className={`relative cursor-grab touch-none active:cursor-grabbing ${dragFrom === i ? "opacity-40" : ""} ${touchFrom === i ? "opacity-70" : ""} ${touchOver === i && touchFrom !== i ? "ring-2 ring-[#e91e63] rounded-md" : ""}`}
          >
            <button type="button" onClick={() => setIdx(i)} aria-label={`Voir photo ${i + 1}`}>
              <img
                src={src}
                alt=""
                className={`h-16 w-14 rounded-md object-cover ${i === idx ? "ring-2 ring-[#e91e63]" : "opacity-70"}`}
              />
            </button>
            <button
              type="button"
              onClick={() => remove(src)}
              aria-label={`Supprimer la photo ${i + 1}`}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-xs leading-none text-white hover:bg-black/80"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < 5 && (
          <label className="flex h-16 w-14 cursor-pointer items-center justify-center rounded-md border border-dashed border-[#e91e63] text-2xl leading-none text-[#e91e63]" aria-label="Ajouter des photos">
            +
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                add(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      {touchFrom !== null && ghost && photos[touchFrom] && (
        <div aria-hidden="true" className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-90 shadow-xl" style={{ left: ghost.x, top: ghost.y }}>
          <img src={photos[touchFrom]} alt="" className="h-16 w-14 rounded-md object-cover" />
        </div>
      )}
      {err && <p className="px-3 text-sm text-red-600">{err}</p>}
      {changed && (
        <div className="p-3 pt-1">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="w-full rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Enregistrement…" : "Enregistrer les photos"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Full SWIVV profile layout: gallery + all criteria sections. Shared by
 *  member pages and "Mon profil" so signup questions always match display. */
export function SwivvProfileView({ profile, badge, actions, after, onSavePhotos }: Props) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const viewer = useMyCity();
  const dist = realDistance(viewer.city, viewer.country, profile);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-[340px_1fr]">
        <div>
          {onSavePhotos ? (
            <EditableGallery profile={profile} onSavePhotos={onSavePhotos} />
          ) : (
          <div className="overflow-hidden rounded-xl bg-white">
            <img
              src={profile.photos[photoIdx]}
              alt={`Photo de ${profile.name}`}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="flex gap-2 p-3">
              {profile.photos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setPhotoIdx(i)}
                  aria-label={`Voir photo ${i + 1}`}
                >
                  <img
                    src={src}
                    alt=""
                    className={`h-16 w-14 rounded-md object-cover ${i === photoIdx ? "ring-2 ring-[#e91e63]" : "opacity-70"}`}
                  />
                </button>
              ))}
            </div>
          </div>
          )}
          {actions}
        </div>

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-medium text-[#333]">
            {profile.name}, {profile.age}
            {profile.verified && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[#e91e63]">
                <BadgeCheck className="h-6 w-6" aria-hidden="true" /> Photos vérifiées
              </span>
            )}
          </h1>
          <p className="mt-1 flex items-center gap-1 text-[#777]">
            <MapPin className="h-4 w-4" /> {profile.city}, {profile.country} · {dist} km ·{" "}
            {profile.lastActive}
          </p>
          <p className="mt-1 text-sm text-[#999]">
            Membre depuis le{" "}
            {new Date(profile.joinedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {profile.isNew && (
              <span className="ml-2 rounded-full bg-[#e91e63]/10 px-2 py-0.5 text-xs font-medium text-[#e91e63]">
                Nouveau
              </span>
            )}
          </p>
          {badge}
          <p className="mt-3 text-base text-[#333]">« {profile.tagline} »</p>
          <p className="mt-1.5 text-[15px] leading-snug text-[#555]">{profile.bio}</p>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {(
              [
                ["Métier", profile.occupation],
                ["Études", profile.education],
                ["Taille", Number.isFinite(profile.heightCm) ? `${profile.heightCm} cm` : "-"],
                ["Statut", profile.maritalStatus],
                ["Religion", profile.religion],
                ["Recherche", profile.lookingFor],
                ["Langues", (profile.languages ?? []).join(", ")],
                ["Ville", `${profile.city} (${dist} km)`],
              ] as [string, ReactNode][]
            ).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-white px-3 py-2">
                <dt className="text-xs uppercase text-[#999]">{k}</dt>
                <dd className="font-medium text-[#333]">{v}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-4 font-medium text-[#333]">Centres d&apos;intérêt</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(profile.interests ?? []).map((i) => (
              <span key={i} className="rounded-full bg-[#f2f2f2] px-3 py-1 text-sm text-[#555]">
                {i}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section aria-label="Apparence" className="mt-8">
        <h2 className="font-medium text-[#333]">Apparence</h2>
        <FactGrid
          items={[
            ["Cheveux", profile.hairColor],
            ["Yeux", profile.eyeColor],
            ["Taille", Number.isFinite(profile.heightCm) ? `${profile.heightCm} cm` : "-"],
            ["Poids", profile.weightKg ? `${profile.weightKg} kg` : undefined],
            ["Silhouette", profile.bodyStyle],
            ["Origine", profile.ethnicity],
            ["Style", profile.selfAppearance],
            ["Plus bel atout", <BestFeatureValue text={profile.bestFeature} firstLanguage={profile.firstLanguage} />],
          ]}
        />
      </section>

      <section aria-label="Style de vie" className="mt-8">
        <h2 className="font-medium text-[#333]">Style de vie</h2>
        <FactGrid
          items={[
            ["Alcool", profile.drink],
            ["Tabac", profile.smoke],
            ["Drogue", profile.drugs ?? "—"],
            ["Alimentation", profile.eatingHabits],
            ["Métier", profile.occupation],
            ["Emploi", profile.employmentStatus],
            ["Revenus annuels", profile.annualIncome],
            ["Logement", profile.livingSituation],
            ["Prêt à déménager", relocateLabel(profile)],
            ["Animaux", petsLabel(profile)],
            ["Veut (d'autres) animaux", profile.wantsMorePets],
          ]}
        />
      </section>

      <section aria-label="Famille" className="mt-8">
        <h2 className="font-medium text-[#333]">Famille</h2>
        <FactGrid
          items={[
            ["Statut matrimonial", profile.maritalStatus],
            ["Enfants", profile.haveChildren],
            ["Nombre d'enfants", profile.childrenCount ?? "—"],
            ["Âges des enfants", profile.childrenAges],
            ["Veut (d'autres) enfants", profile.wantMoreChildren],
            ["Frères et sœurs", siblingSummary(profile)],
            ["Rang dans la fratrie", birthRankLabel(profile)],
            ["Parents", profile.parentsMaritalStatus],
          ]}
        />
      </section>

      <section aria-label="Origines et valeurs" className="mt-8">
        <h2 className="font-medium text-[#333]">Origines & valeurs</h2>
        <FactGrid
          items={[
            ["Nationalité", profile.nationality],
            ["Études", profile.education],
            ["Langue maternelle", profile.firstLanguage],
            ["Autres langues", profile.otherLanguages],
            ["Religion", profile.religion],
            ["Religion de naissance", profile.bornOrConverted],
            ["Pratique religieuse", profile.religiousValues],
            ["Valeurs familiales", profile.familyValues],
          ]}
        />
      </section>

      {after}
    </>
  );
}
