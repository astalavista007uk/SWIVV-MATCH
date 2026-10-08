import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Camera } from "lucide-react";
import { getMyProfile, saveMyProfile } from "@/lib/swivv-auth";
import { useAuth } from "@/hooks/use-auth";
import { faceDescriptor, isSamePerson } from "@/lib/swivv-face";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons, openAuthModal } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/verification")({
  head: () => ({ meta: [{ title: "Vérification — SWIVV" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { user, loading } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const photo = photos[photoIdx] ?? null;
  const [selfie, setSelfie] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"ok" | "ko" | null>(null);
  const [checks, setChecks] = useState<{ face: boolean; match: boolean }[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoFileRef = useRef<HTMLInputElement | null>(null);

  // ponytail: live camera first, file picker only when the camera is unavailable — canvas snapshot if video recording ever needs more
  useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }

  async function startCamera() {
    setCamErr(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw { name: "Unsupported" };
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = s;
      setCamOn(true);
    } catch (e) {
      // ponytail: name-based messages, not error passthrough — raw DOMExceptions mean nothing to users; settings deep-link if browsers ever allow it
      const name = (e as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setCamErr("Accès caméra refusé — autorise-la dans les réglages du navigateur, puis réessaie.");
      } else if (name === "Unsupported" || name === "NotFoundError" || name === "OverconstrainedError") {
        setCamErr("Aucune caméra accessible depuis ce navigateur — choisis une photo existante ci-dessous.");
      } else {
        setCamErr("Caméra indisponible — choisis un fichier ci-dessous, ou autorise l'accès puis réessaie.");
      }
    }
  }

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    setSelfie(c.toDataURL("image/jpeg", 0.92));
    setResult(null);
    setChecks(null);
    stopCamera();
  }

  useEffect(() => {
    if (loading || !user) return;
    getMyProfile().then((p) => setPhotos(p?.photos ?? []));
  }, [loading, user, reloadKey]);

  // ponytail: replace the reference in place and restart — full photo manager stays in Mon profil
  async function replacePhoto(file: File) {
    if (file.size > 2_500_000) {
      setErr("Image trop lourde (2,5 Mo max).");
      return;
    }
    const src = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("read"));
      r.readAsDataURL(file);
    }).catch(() => null);
    if (!src) {
      setErr("Lecture impossible. Réessaie.");
      return;
    }
    const next = photos.map((p, i) => (i === photoIdx ? src : p));
    setPhotos(next);
    const p = await getMyProfile();
    if (p) await saveMyProfile({ ...p, photos: next });
    setSelfie(null);
    setResult(null);
    setChecks(null);
    setErr(null);
    stopCamera();
  }
  function cyclePhoto() {
    if (photos.length < 2) return;
    setPhotoIdx((i) => (i + 1) % photos.length);
    setSelfie(null);
    setResult(null);
    setChecks(null);
    setErr(null);
    stopCamera();
  }

  // ponytail: one selfie checked against every profile photo in parallel — per-photo verdicts, overall ok on any match
  async function verify(list?: string[], self?: string) {
    const refs = list ?? photos;
    const b0 = self ?? selfie;
    if (!refs.length || !b0) return;
    setBusy(true);
    setErr(null);
    setResult(null);
    setChecks(null);
    try {
      const sDesc = await faceDescriptor(b0);
      if (!sDesc) {
        setErr("Aucun visage détecté sur ton selfie. Reprends-en un bien éclairé, de face.");
        return;
      }
      const descs = await Promise.all(refs.map((r) => faceDescriptor(r).catch(() => null)));
      const out = descs.map((d) => ({ face: !!d, match: !!d && isSamePerson(d, sDesc) }));
      setChecks(out);
      // ponytail: condemned = fingerprints (not megabytes of dataURLs) — mon-profil purges on next visit, skips anything that changed since
      try {
        const condemned = out.flatMap((o, i) =>
          !o.match && refs[i] ? [{ len: refs[i].length, head: refs[i].slice(0, 64) }] : [],
        );
        if (condemned.length) localStorage.setItem("swivv-photo-purge", JSON.stringify(condemned));
        else localStorage.removeItem("swivv-photo-purge");
      } catch {}
      if (!out.some((o) => o.match)) {
        setResult("ko");
        return;
      }
      const p = await getMyProfile();
      if (p) await saveMyProfile({ ...p, verified: true });
      setResult("ok");
    } catch {
      setErr("Vérification impossible. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  // ponytail: selfie becomes photo #1 then re-verifies against itself — profile-photo cropping if framing ever needs help
  async function useSelfieAsPhoto() {
    if (!selfie) return;
    setBusy(true);
    const p = await getMyProfile();
    if (p) await saveMyProfile({ ...p, photos: [selfie, ...p.photos.slice(1)] });
    setPhotos((prev) => [selfie, ...prev.slice(1)]);
    setPhotoIdx(0);
    await verify([selfie], selfie);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="flex items-center gap-2 text-2xl font-medium text-[#333]">
          <BadgeCheck className="h-6 w-6 text-[#e91e63]" /> Vérifie ton profil
        </h1>
        <p className="mt-1 text-sm text-[#777]">
          Prends un selfie : on le compare à ta photo de profil, sur ton appareil uniquement. Rien n&apos;est envoyé ni stocké.
        </p>
        {!loading && !user ? (
          <button
            type="button"
            onClick={() => openAuthModal("account", "signin")}
            className="mt-6 w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white"
          >
            Se connecter pour vérifier mon profil
          </button>
        ) : !photo ? (
          <div className="mt-6 text-center">
            <p className="text-sm text-[#777]">
              Ajoute d&apos;abord une <Link to="/mon-profil" className="font-medium text-[#e91e63] underline">photo à ton profil</Link>.
            </p>
            {/* ponytail: fetch-once froze a transient radio failure as "no photo" — one tap re-asks the server; drop if getMyProfile ever distinguishes error from empty */}
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-3 text-sm font-medium text-[#e91e63] hover:underline"
            >
              Recharger mes photos
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <figure>
                {photos.length > 1 ? (
                  <button type="button" onClick={cyclePhoto} title="Changer de photo de référence" aria-label="Changer de photo de référence">
                    <img src={photo} alt="Ta photo de profil" className="aspect-[4/5] w-full rounded-xl object-cover" />
                  </button>
                ) : (
                  <img src={photo} alt="Ta photo de profil" className="aspect-[4/5] w-full rounded-xl object-cover" />
                )}
                <figcaption className="mt-1 text-center text-xs text-[#777]">
                  Photo de profil{photos.length > 1 ? ` (${photoIdx + 1}/${photos.length} — toucher pour changer)` : ""}
                </figcaption>
                <button
                  type="button"
                  onClick={() => photoFileRef.current?.click()}
                  className="mt-1 w-full text-center text-xs font-medium text-[#e91e63] hover:underline"
                >
                  Modifier cette photo
                </button>
                <input
                  ref={photoFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label="Modifier la photo de profil"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void replacePhoto(f);
                  }}
                />
              </figure>
              <figure>
                {/* ponytail: callback ref, not rAF — the frame often fired before React mounted the video on slower phones, leaving a dead black box */}
                {selfie ? (
                  <img src={selfie} alt="Ton selfie" className="aspect-[4/5] w-full rounded-xl object-cover" />
                ) : camOn ? (
                  <video ref={(el) => { videoRef.current = el; if (el && streamRef.current) el.srcObject = streamRef.current; }} autoPlay playsInline muted className="aspect-[4/5] w-full rounded-xl object-cover" />
                ) : (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-[#999]"
                  >
                    <Camera className="h-8 w-8" />
                    <span className="px-2 text-center text-xs">Prendre un selfie</span>
                  </button>
                )}
                <figcaption className="mt-1 text-center text-xs text-[#777]">Selfie</figcaption>
              </figure>
            </div>
            {camErr && !selfie && (
              <>
                <p className="text-center text-sm text-red-600">{camErr}</p>
                <label className="block cursor-pointer text-center text-sm font-medium text-[#e91e63] hover:underline">
                Choisir une photo existante
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label="Choisir une photo existante"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => {
                      setSelfie(String(r.result));
                      setResult(null);
                      setChecks(null);
                    };
                    r.readAsDataURL(f);
                  }}
                />
              </label>
              </>
            )}
            {selfie && (
              <button
                type="button"
                onClick={() => setSelfie(null)}
                className="w-full text-center text-sm text-[#777] hover:text-[#333]"
              >
                Reprendre le selfie
              </button>
            )}
            {camOn && !selfie && (
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={capture}
                  className="w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white"
                >
                  Capturer
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-full text-center text-sm text-[#777] hover:text-[#333]"
                >
                  Annuler
                </button>
              </div>
            )}
            <button
              type="button"
              disabled={!selfie || busy}
              onClick={() => verify()}
              className="w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white disabled:opacity-40"
            >
              {busy ? "Comparaison…" : "Vérifier que c'est bien moi"}
            </button>
            {err && <p className="text-center text-sm text-red-600">{err}</p>}
            {checks && (
              <div className="flex justify-center gap-2" aria-label="Résultat par photo">
                {photos.map((p, i) => (
                  <span key={i} className="relative block w-14" title={checks[i]?.match ? "Visage correspondant" : checks[i]?.face ? "Visage différent" : "Aucun visage détecté"}>
                    <img src={p} alt={`Photo ${i + 1}`} className="aspect-[4/5] w-full rounded-lg object-cover" />
                    <span className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${checks[i]?.match ? "bg-green-600" : checks[i]?.face ? "bg-red-500" : "bg-[#999]"}`}>
                      {checks[i]?.match ? "✓" : checks[i]?.face ? "✗" : "?"}
                    </span>
                    {!checks[i]?.match && (
                      <span className="mt-0.5 block text-center text-[10px] leading-tight text-red-600">Sera supprimée</span>
                    )}
                  </span>
                ))}
              </div>
            )}
            {result === "ok" && (
              <p className="rounded-xl bg-green-50 p-4 text-center text-sm font-medium text-green-800">
                ✓ C&apos;est bien toi ! Ton profil affiche désormais le badge vérifié.
              </p>
            )}
            {result === "ko" && (
              <div className="rounded-xl bg-red-50 p-4 text-center">
                <p className="text-sm font-medium text-red-700">
                  Ce selfie ne correspond à aucune de tes photos. Si c&apos;est bien toi aujourd&apos;hui, utilise-le comme nouvelle photo de profil.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={useSelfieAsPhoto}
                  className="mt-3 w-full rounded-md bg-[#e91e63] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  Utiliser ce selfie comme photo de profil
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <SwivvFooter />
    </div>
  );
}
