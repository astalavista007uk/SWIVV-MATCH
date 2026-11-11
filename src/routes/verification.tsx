import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, Maximize, ScanFace, Sparkles, Sun } from "lucide-react";
import { getMyProfile, saveMyProfile } from "@/lib/swivv-auth";
import { onVerified } from "@/lib/swivv-notify";
import { useAuth } from "@/hooks/use-auth";
import { faceDescriptor, faceDistance, isSamePerson } from "@/lib/swivv-face";
import { idAutoDecision } from "@/lib/admin-verify";
import type { SwivvProfile } from "@/lib/swivv-data";
import { supabase } from "@/integrations/supabase/client";
import { openAuthModal } from "@/lib/swivv-auth";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/verification")({
  head: () => ({ meta: [{ title: "Vérification — SWIVV" }] }),
  component: VerificationPage,
});

type IdReqRow = { status: string; review_note?: string | null; auto_note?: string | null };

export default function VerificationPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
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
  const [me, setMe] = useState<SwivvProfile | null>(null);
  const [idReq, setIdReq] = useState<IdReqRow | null>(null);
  const [idBusy, setIdBusy] = useState(false);
  const [idResult, setIdResult] = useState<"pending" | null>(null);
  const [idNote, setIdNote] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoFileRef = useRef<HTMLInputElement | null>(null);
  const idFileRef = useRef<HTMLInputElement | null>(null);

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
    let live = true;
    getMyProfile().then((p) => {
      if (!live) return;
      setMe(p);
      setPhotos(p?.photos ?? []);
    });
    void (supabase as any)
      .from("swivv_verification_requests")
      .select("status,review_note,auto_note,created_at")
      .eq("user_id", user.id)
      .eq("kind", "identity")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }: { data: IdReqRow[] | null }) => {
        if (live) setIdReq(data?.[0] ?? null);
      });
    return () => {
      live = false;
    };
  }, [loading, user, reloadKey]);

  // ponytail: photos already verified → jump straight to the ID step, once per mount so the
  // chevron can still walk back to step 1 without bouncing forward
  const autoJumped = useRef(false);
  useEffect(() => {
    if (autoJumped.current || !me?.verified || me.idVerified) return;
    autoJumped.current = true;
    setStep(2);
  }, [me]);

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
      if (p && !p.verified) {
        await saveMyProfile({ ...p, verified: true });
        void onVerified();
      } else if (p) {
        await saveMyProfile({ ...p, verified: true });
      }
      setMe((m) => (m ? { ...m, verified: true } : m));
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

  // ponytail: ID portrait vs profile photos, on-device only; a doubtful document is uploaded
  // for a human review and deleted after the decision. Upgrade to a hosted IDV provider when
  // document fraud (forged/expired papers) has to be caught.
  async function submitId(file: File) {
    if (!me || !user) return;
    setIdNote(null);
    setIdResult(null);
    if (!me.verified) {
      setIdNote("Vérifie d'abord tes photos ci-dessus.");
      return;
    }
    if (file.size > 8_000_000) {
      setIdNote("Image trop lourde (8 Mo max).");
      return;
    }
    setIdBusy(true);
    try {
      const src = URL.createObjectURL(file);
      let dist: number | null = null;
      try {
        const docFace = await faceDescriptor(src);
        if (docFace) {
          const refs = (
            await Promise.all(photos.slice(0, 3).map((p) => faceDescriptor(p).catch(() => null)))
          ).filter((d): d is Float32Array => !!d);
          for (const r of refs) {
            const d = faceDistance(docFace, r);
            dist = dist === null ? d : Math.min(dist, d);
          }
        }
      } finally {
        URL.revokeObjectURL(src);
      }
      const verdict = idAutoDecision(dist);
      if (verdict.status === "approved") {
        const next = { ...me, idVerified: true, idVerifiedAt: new Date().toISOString().slice(0, 10) };
        const err = await saveMyProfile(next);
        if (err) {
          setIdNote(err);
          return;
        }
        setMe(next);
        void onVerified();
        return;
      }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage
        .from("swivv-id")
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
      if (up.error) {
        setIdNote("Envoi impossible. Réessaie.");
        return;
      }
      const { error } = await (supabase as any).from("swivv_verification_requests").insert({
        user_id: user.id,
        kind: "identity",
        status: "pending",
        doc_path: path,
        auto_score: verdict.score,
        auto_note: verdict.note,
      });
      if (error) {
        await supabase.storage.from("swivv-id").remove([path]);
        setIdNote("Envoi impossible. Réessaie.");
        return;
      }
      setIdReq({ status: "pending", auto_note: verdict.note });
      setIdResult("pending");
    } catch {
      setIdNote("Vérification impossible. Réessaie.");
    } finally {
      setIdBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#101014] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-5 pb-7 pt-4">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => (step === 2 ? setStep(1) : navigate({ to: "/mon-profil" }))}
            aria-label={t("Retour")}
            className="-ml-3 grid h-11 w-11 place-items-center rounded-full text-white/80 transition hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {[1, 2].map((n) => (
              <span
                key={n}
                className={`h-1.5 rounded-full transition-all ${step === n ? "w-6 bg-white" : "w-1.5 bg-white/25"}`}
              />
            ))}
          </div>
        </header>

        <main className="mt-7 flex flex-1 flex-col">
          {step === 1 ? (
            <>
              <h1 className="text-[30px] font-medium leading-[1.15] tracking-tight text-white">{t("Vérifie ton profil")}</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">
                {t("Prends un selfie : on le compare à ta photo de profil, sur ton appareil uniquement. Rien n'est envoyé ni stocké.")}
              </p>

              {!loading && !user ? (
                <button
                  type="button"
                  onClick={() => openAuthModal("account", "signin")}
                  className="mt-8 w-full rounded-full bg-[#e60050] py-4 text-[16px] font-semibold text-white transition hover:brightness-110"
                >
                  {t("Se connecter pour vérifier mon profil")}
                </button>
              ) : !photo ? (
                <div className="mt-8 rounded-2xl bg-white/[0.06] p-5 text-center">
                  <p className="text-sm text-white/70">
                    {t("Ajoute d'abord une")}{" "}
                    <Link to="/mon-profil" className="font-medium text-[#ff5c8a] underline">
                      {t("photo à ton profil")}
                    </Link>
                    .
                  </p>
                  {/* ponytail: fetch-once froze a transient radio failure as "no photo" — one tap re-asks the server; drop if getMyProfile ever distinguishes error from empty */}
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="mt-3 text-sm font-medium text-[#ff5c8a] hover:underline"
                  >
                    {t("Recharger mes photos")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl bg-[#191d23] md:aspect-[16/9]">
                    {selfie ? (
                      <img src={selfie} alt={t("Ton selfie")} className="h-full w-full object-cover" />
                    ) : camOn ? (
                      <video
                        ref={(el) => {
                          videoRef.current = el;
                          if (el && streamRef.current) el.srcObject = streamRef.current;
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <button type="button" onClick={startCamera} className="relative h-full w-full">
                        <img src={photo} alt="" className="h-full w-full object-cover opacity-20" />
                        <span className="absolute inset-0 grid place-items-center">
                          <span className="flex flex-col items-center gap-2 text-white/70">
                            <Camera className="h-8 w-8" />
                            <span className="text-xs font-medium">{t("Prendre un selfie")}</span>
                          </span>
                        </span>
                      </button>
                    )}

                    <svg viewBox="0 0 320 240" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
                      <ellipse
                        cx="160"
                        cy="122"
                        rx="72"
                        ry="94"
                        stroke={result === "ok" ? "#34d399" : "#ffffff"}
                        strokeOpacity={result === "ok" ? 0.95 : 0.4}
                        strokeWidth="2"
                        strokeDasharray="6 8"
                      />
                    </svg>

                    {camOn && !selfie && (
                      <button
                        type="button"
                        onClick={capture}
                        aria-label={t("Capturer")}
                        className="absolute bottom-4 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border-4 border-white/80"
                      >
                        <span className="h-10 w-10 rounded-full bg-white" />
                      </button>
                    )}
                  </div>

                  {photos.length > 1 && !selfie && !camOn && (
                    <button
                      type="button"
                      onClick={cyclePhoto}
                      className="mt-2 w-full text-center text-xs text-white/40 transition hover:text-white/70"
                    >
                      {t("Changer de photo de référence")} ({photoIdx + 1}/{photos.length})
                    </button>
                  )}
                  {selfie && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelfie(null);
                        setResult(null);
                        setChecks(null);
                      }}
                      className="mt-2 w-full text-center text-sm text-white/50 transition hover:text-white/80"
                    >
                      {t("Reprendre le selfie")}
                    </button>
                  )}
                  {camErr && !selfie && (
                    <div className="mt-3 text-center">
                      <p className="text-sm text-[#ff8fab]">{t(camErr)}</p>
                      <label className="mt-2 inline-block cursor-pointer text-sm font-medium text-[#ff5c8a] hover:underline">
                        {t("Choisir une photo existante")}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          aria-label={t("Choisir une photo existante")}
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
                    </div>
                  )}

                  <p className="mt-6 text-[15px] font-medium text-white/90">{t("Pour commencer")}</p>
                  <ul className="mt-4 space-y-4 text-[15px] text-white/70">
                    {([
                      [Sun, "Trouve un endroit bien éclairé"],
                      [Sparkles, "Évite les reflets et les ombres"],
                      [ScanFace, "Garde tout ton visage dans le cadre"],
                    ] as const).map(([Icon, label]) => (
                      <li key={label} className="flex items-center gap-4">
                        <Icon className="h-6 w-6 shrink-0 text-white/55" strokeWidth={1.6} />
                        <span>{t(label)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    {err && <p className="mb-3 text-center text-sm text-[#ff8fab]">{t(err)}</p>}
                    {checks && (
                      <div className="mb-4 flex justify-center gap-2" aria-label={t("Résultat par photo")}>
                        {photos.map((p, i) => (
                          <span
                            key={i}
                            className="relative block w-12"
                            title={
                              checks[i]?.match
                                ? t("Visage correspondant")
                                : checks[i]?.face
                                  ? t("Visage différent")
                                  : t("Aucun visage détecté")
                            }
                          >
                            <img src={p} alt={`Photo ${i + 1}`} className="aspect-[4/5] w-full rounded-lg object-cover" />
                            <span
                              className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                                checks[i]?.match ? "bg-emerald-500" : checks[i]?.face ? "bg-red-500" : "bg-white/30"
                              }`}
                            >
                              {checks[i]?.match ? "✓" : checks[i]?.face ? "✗" : "?"}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                    {result === "ok" && (
                      <p className="mb-4 rounded-2xl bg-emerald-500/10 p-4 text-center text-sm font-medium text-emerald-300">
                        ✓ {t("C'est bien toi ! Ton profil affiche désormais le badge vérifié.")}
                      </p>
                    )}
                    {result === "ko" && (
                      <div className="mb-4 rounded-2xl bg-red-500/10 p-4 text-center">
                        <p className="text-sm text-red-300">
                          {t("Ce selfie ne correspond à aucune de tes photos. Si c'est bien toi aujourd'hui, utilise-le comme nouvelle photo de profil.")}
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={useSelfieAsPhoto}
                          className="mt-3 w-full rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                        >
                          {t("Utiliser ce selfie comme photo de profil")}
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={!!selfie && (busy || idBusy)}
                      onClick={() => {
                        if (camOn && !selfie) return capture();
                        if (selfie) return result === "ok" ? setStep(2) : void verify();
                        return startCamera();
                      }}
                      className="w-full rounded-full bg-[#e60050] py-4 text-[16px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                    >
                      {camOn && !selfie
                        ? t("Capturer")
                        : selfie
                          ? result === "ok"
                            ? t("Continuer")
                            : busy
                              ? t("Comparaison…")
                              : t("Vérifier que c'est bien moi")
                          : t("Prendre un selfie")}
                    </button>
                    <p className="mt-3 text-center text-xs leading-relaxed text-white/35">
                      {t("La comparaison se fait sur ton appareil. Aucune photo n'est envoyée ni conservée.")}
                    </p>
                    {result === "ok" && (
                      <Link
                        to="/"
                        className="mt-4 block text-center text-sm font-medium text-[#ff5c8a] hover:underline"
                      >
                        {t("Retour au site")}
                      </Link>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h1 className="text-[30px] font-medium leading-[1.15] tracking-tight text-white">{t("Prendre ma pièce en photo")}</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">
                {t("Prends ta pièce d'identité en photo : le visage est comparé à tes photos directement sur ton appareil. Le document n'est envoyé que si un contrôle humain est nécessaire.")}
              </p>

              <div className="relative mt-6 aspect-[16/11] overflow-hidden md:aspect-[16/9] rounded-2xl bg-[linear-gradient(135deg,#f7d3a4_0%,#eab271_55%,#e2a463_100%)]">
                <div className="absolute left-[13%] top-[24%] h-[44%] w-[42%] -rotate-6 rounded-lg bg-white p-2 shadow-[0_10px_24px_rgba(0,0,0,.18)]">
                  <div className="h-[58%] w-[42%] rounded bg-[#c7d3e3]" />
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1.5 w-4/5 rounded bg-[#c7d3e3]" />
                    <div className="h-1.5 w-2/3 rounded bg-[#dde5ef]" />
                    <div className="h-1.5 w-1/2 rounded bg-[#dde5ef]" />
                  </div>
                </div>
                <div className="absolute right-[11%] top-[15%] h-[64%] w-[27%] rotate-6 rounded-[14px] border-[3px] border-[#2a303a] bg-[#0f1318] p-1.5 shadow-[0_14px_30px_rgba(0,0,0,.3)]">
                  <div className="relative h-full rounded-[9px] border border-dashed border-white/40">
                    <div className="mx-auto mt-3 h-[38%] w-[64%] rounded bg-white/90" />
                    <div className="mx-auto mt-1.5 h-1 w-[74%] rounded bg-white/35" />
                    <div className="mx-auto mt-1 h-1 w-[52%] rounded bg-white/25" />
                  </div>
                </div>
              </div>

              {!me?.idVerified && !(idResult === "pending" || (idReq?.status === "pending" && !idResult)) && (
                <>
                  <p className="mt-6 text-[15px] font-medium text-white/90">{t("Pour commencer")}</p>
                  <ul className="mt-4 space-y-4 text-[15px] text-white/70">
                    {([
                      [Sun, "Trouve un endroit bien éclairé"],
                      [Sparkles, "Évite les reflets et les ombres"],
                      [Maximize, "Assure-toi que les quatre coins sont visibles"],
                    ] as const).map(([Icon, label]) => (
                      <li key={label} className="flex items-center gap-4">
                        <Icon className="h-6 w-6 shrink-0 text-white/55" strokeWidth={1.6} />
                        <span>{t(label)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="mt-auto pt-6">
                {me?.idVerified ? (
                  <>
                    <p className="rounded-2xl bg-emerald-500/10 p-4 text-center text-sm font-medium text-emerald-300">
                      ✓ {t("Identité vérifiée — le badge est actif sur ton profil.")}
                    </p>
                    <Link
                      to="/"
                      className="mt-4 block w-full rounded-full bg-[#e60050] py-4 text-center text-[16px] font-semibold text-white transition hover:brightness-110"
                    >
                      {t("Retour au site")}
                    </Link>
                  </>
                ) : idResult === "pending" || (idReq?.status === "pending" && !idResult) ? (
                  <>
                    <p className="rounded-2xl bg-amber-500/10 p-4 text-center text-sm font-medium text-amber-300">
                      {t("Pièce reçue — l'équipe l'examine sous 48 h. Aucun document n'est conservé après la décision.")}
                    </p>
                    <Link
                      to="/"
                      className="mt-4 block w-full rounded-full bg-[#e60050] py-4 text-center text-[16px] font-semibold text-white transition hover:brightness-110"
                    >
                      {t("Retour au site")}
                    </Link>
                  </>
                ) : (
                  <>
                    {idReq?.status === "rejected" && (
                      <p className="mb-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">
                        {t("Pièce refusée")}
                        {idReq.review_note || idReq.auto_note ? ` : ${idReq.review_note || idReq.auto_note}` : "."}{" "}
                        {t("Tu peux réessayer avec une photo plus nette.")}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={!me?.verified || idBusy || busy}
                      onClick={() => idFileRef.current?.click()}
                      className="w-full rounded-full bg-[#e60050] py-4 text-[16px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                    >
                      {idBusy ? t("Contrôle automatique…") : t("Prendre ma pièce en photo")}
                    </button>
                    {!me?.verified && (
                      <p className="mt-3 text-center text-xs text-white/40">{t("Vérifie d'abord tes photos ci-dessus.")}</p>
                    )}
                    <input
                      ref={idFileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      aria-label={t("Prendre ma pièce en photo")}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void submitId(f);
                      }}
                    />
                    {idNote && <p className="mt-3 text-center text-sm text-[#ff8fab]">{t(idNote)}</p>}
                    <p className="mt-3 text-center text-xs leading-relaxed text-white/35">
                      {t("Aucune donnée de la pièce n'est conservée : elle est supprimée après la décision, seuls le badge et sa date restent.")}
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
