import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Flag, ImagePlus, MessageCircle, Mic, Square, TriangleAlert, UserX, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getProfile } from "@/lib/swivv-data";
import { fmtFull, getAppLang, getChat, getChattedIds, getFeedback, getPeer, isMatch, logModReport, markAllRead, mediaUrl, rememberPeer, sendChat, sendFeedback, sendImage, sendVoice, subscribe, syncChatsNow, useDeletedIds, useTotalCount, useUnreadCount, type ChatFeedback } from "@/lib/swivv-store";
import { supabase } from "@/integrations/supabase/client";
import { findOffensive, REPORT_REASONS } from "@/lib/swivv-moderation";
import { SwivvAuthButtons, openAuthModal, useSwivvUser } from "@/lib/swivv-auth";
import { useAuth } from "@/hooks/use-auth";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvHint } from "@/components/swivv-hint";
import { SwivvVoicePlayer } from "@/components/swivv-voice-player";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";

export const Route = createFileRoute("/messagerie")({
  head: () => ({ meta: [{ title: "Messages — SWIVV" }] }),
  component: MessagesPage,
});

// ponytail: stopword scorer for the 6 app langs (no quota burn, instant) — franc/API detect if accuracy ever matters
const STOPWORDS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries({
    fr: "le la les de des du un une est sont et je tu il elle nous vous ils elles pas que qui pour avec dans sur ce cette ces mon ton son ma ta sa mes tes ses mais ou où comme tout tous plus très merci bonjour salut oui non bisous",
    en: "the a an is are was were and you your yours not that this with for have has had from they them their there here what when where hello hi thanks please yes no love kiss",
    es: "el la los las de del una uno que está estás está están gracias hola por para con como muy tengo tienes tengo estoy estás buenos buenas días noches amor beso",
    de: "der die das den dem und ist sind war waren nicht mit für von zum zur danke hallo bitte haben hat bist liebe kuss ja nein",
    it: "il lo la i gli le che di una uno sono sei siamo molto per con come questo questa grazie ciao buongiorno buonasera amore bacio sì",
    pt: "o a os as de do da um uma que está estão obrigado olá você para com como muito isso isto bom boa dia noite amor beijo sim não",
  }).map(([l, s]) => [l, new Set(s.split(" "))]),
);
function guessLang(text: string): string | null {
  const words = text
    .toLowerCase()
    .split(/[^a-zàâäéèêëîïôöùûüçñß]+/i)
    .filter(Boolean);
  if (words.length < 2) return null;
  let best = "";
  let bestN = 0;
  for (const [l, set] of Object.entries(STOPWORDS)) {
    const n = words.filter((w) => set.has(w)).length;
    if (n > bestN) {
      bestN = n;
      best = l;
    }
  }
  return bestN > 0 ? best : null;
}

// ponytail: free MyMemory anonymous quota (~5k chars/day/IP), in-memory cache — keyed backend or persisted cache if it ever throttles
const trCache = new Map<string, string>();async function translateText(text: string, target: string): Promise<{ text: string; same: boolean } | null> {
  const key = `${target}:${text}`;
  const hit = trCache.get(key);
  if (hit) return { text: hit, same: false };
  try {
    const r = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${target}`,
    );
    const j = await r.json();
    const t = j?.responseData?.translatedText;
    if (typeof t !== "string" || !t.trim()) return null;
    const det = String(j?.responseData?.detectedLanguage ?? "").toLowerCase();
    if (det === target.toLowerCase() || t.trim() === text.trim()) return { text, same: true };
    trCache.set(key, t);
    return { text: t, same: false };
  } catch {
    return null;
  }
}

function MessagesPage() {
  const user = useSwivvUser();
  const { loading } = useAuth();
  // ponytail: profile pages bridge the open-thread request via sessionStorage — proper ?to= search param when this route gains search validation
  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      const t = sessionStorage.getItem("swivv-active-chat");
      sessionStorage.removeItem("swivv-active-chat");
      return t;
    } catch {
      return null;
    }
  });
  const [draft, setDraft] = useState("");
  const [, force] = useState(0);
  const [appLang] = useState(getAppLang);
  const [tr, setTr] = useState<Record<string, { text: string; showTr: boolean; same?: boolean }>>({});
  const [trBusy, setTrBusy] = useState<Set<string>>(new Set());
  const voice = useVoiceRecorder();
  // ponytail: inbox = profiles with ≥1 sent/received message only — seeds resolve directly, real peers via the directory, unknown ids get a placeholder
  const list = getChattedIds().map((id) => {
    const s = getProfile(id);
    if (s) return { id: s.id, name: s.name, photo: s.photo, age: `${s.age}`, sub: s.online ? "En ligne" : s.lastActive, gender: s.gender, seed: true as const };
    const c = getPeer(id);
    // ponytail: || not ?? — half-filled snapshots (empty strings) must fall back, never render broken
    return { id, name: c?.name || "Membre SWIVV", photo: c?.photo || "/swivv-s.png", age: "", sub: "", gender: "", seed: false as const };
  });
  const active = activeId ? list.find((p) => p.id === activeId) ?? list[0] : list[0];
  const unread = useUnreadCount();
  const total = useTotalCount();
  // ponytail: deleted peers keep their trace, flagged with UserX — same hook feeds member/browse if they ever need it
  const deleted = useDeletedIds(list.map((p) => p.id));
  const chat = active ? getChat(active.id) : [];
  const [sendingVoice, setSendingVoice] = useState(false);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState<string | null>(null);
  const [sendingImg, setSendingImg] = useState(false);
  const [phoneWarn, setPhoneWarn] = useState<string | null>(null);
  const [offensive, setOffensive] = useState<string[] | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [voiceReport, setVoiceReport] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; msgId: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [fb, setFb] = useState<Record<string, ChatFeedback[]>>({});
  const previewUrl = useMemo(() => (pendingFile ? URL.createObjectURL(pendingFile) : null), [pendingFile]);

  // ponytail: feedback keyed by opaque msg_id (no user-mapped threads yet) — client filters to this thread; server-scoped subscription when threads grow
  useEffect(() => {
    if (!active) return;
    const ids = getChat(active.id).filter((m) => m.image).map((m) => m.id);
    let live = true;
    getFeedback(ids).then((rows) => {
      if (!live) return;
      const byMsg: Record<string, ChatFeedback[]> = {};
      for (const r of rows) (byMsg[r.msg_id] ??= []).push(r);
      setFb(byMsg);
    });
    const ch = supabase
      .channel("swivv-feedback")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "swivv_chat_feedback" }, (payload) => {
        const r = payload.new as ChatFeedback;
        if (!ids.includes(r.msg_id)) return;
        setFb((prev) => ({ ...prev, [r.msg_id]: [...(prev[r.msg_id] ?? []), r] }));
        const who = r.reactor || active.name;
        if (r.reactor === user?.name) return;
        if (r.kind === "reaction") toast(`${who} a réagi ${r.detail} à ta photo.`);
        else if (r.kind === "report") toast(`${who} a signalé ta photo (${r.detail}).`);
        else toast(`${who} a téléchargé ta photo.`);
      })
      .subscribe();
    return () => {
      live = false;
      void supabase.removeChannel(ch);
    };
    // ponytail: chat.length resubscribes on new messages so fresh image ids join the filter — stable channel if traffic ever grows
  }, [active?.id, chat.length]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Opening the inbox clears the heart badge; logged-out visitors get the prompt — never while the session is still restoring.
  useEffect(() => {
    markAllRead();
    if (loading || user) return;
    openAuthModal("message");
  }, [loading, user]);

  // ponytail: explicit resync on top of boot sync — one failed boot left an empty inbox with zero signal; failure surfaces instead of silent zeros
  useEffect(() => {
    if (loading || !user) return;
    void syncChatsNow().then((ok) => {
      if (!ok) toast.error("Synchronisation impossible — vérifie ta connexion, puis actualise la page.");
    });
  }, [loading, user]);

  // ponytail: live inbox — server-pushed messages (other device) re-render without refresh; per-thread subscription if traffic ever grows
  useEffect(() => subscribe(() => force((x) => x + 1)), []);

  // ponytail: real peers (u:uid) resolve on demand for name + photo — directory caches, placeholder until it lands
  useEffect(() => {
    let live = true;
    for (const id of getChattedIds()) {
      if (!id.startsWith("u:") || getProfile(id) || getPeer(id)) continue;
      (supabase as any)
        .from("swivv_profiles")
        .select("data")
        .eq("user_id", id.slice(2))
        .maybeSingle()
        .then(({ data }: any) => {
          if (!live || !data?.data?.name) return;
          const d = data.data as { name: string; photos?: string[] };
          rememberPeer({ id, name: d.name, photo: d.photos?.[0] ?? "" });
          force((x) => x + 1);
        })
        .catch(() => {});
    }
    return () => {
      live = false;
    };
  }, [chat.length]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <Link to="/browse" search={{ q: "", type: "", location: "" }} className="text-sm text-[#555]">
          ← Profils
          </Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-[300px_1fr]">
        <div className="rounded-xl bg-white p-2">
          {/* ponytail: live totals (unread clears on open via markAllRead) — shared inbox header, desktop + mobile render the same h1 */}
          <h1 className="whitespace-nowrap p-2 font-medium">Conversations ({total} · {unread} non lu{unread > 1 ? "s" : ""})</h1>
          <p className="px-2 pb-1 text-xs text-[#999]">Les messages de plus de 3 mois sont supprimés automatiquement, lus ou non.</p>
          {list.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveId(p.id)}
              className={`flex w-full items-center gap-3 rounded-lg p-2 text-left ${active?.id === p.id ? "bg-[#e91e63]/10" : ""}`}
            >
              <img src={p.photo} alt={p.name} className={`h-11 w-11 rounded-full object-cover ${deleted.has(p.id) ? "opacity-60 grayscale" : ""}`} />
              <span>
                <span className="block font-medium text-[#333]">
                  {p.name}{p.age ? `, ${p.age}` : ""}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#999]">
                  {getChat(p.id).length} message(s)
                  {isMatch(p.id) && (
                    <span className="flex items-center gap-1 text-[#e91e63]" aria-label="Vocaux et images disponibles">
                      <Mic className="h-3.5 w-3.5" />
                      <ImagePlus className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {deleted.has(p.id) && (
                    <SwivvHint align="left" text="Ce compte a été supprimé — l'historique est conservé.">
                      <span className="inline-flex items-center gap-1 text-[#999]" aria-label={`${p.name} : compte supprimé`}>
                        <UserX className="h-3.5 w-3.5" />
                      </span>
                    </SwivvHint>
                  )}
                </span>
              </span>
            </button>
          ))}
          {list.length === 0 && (
            <p className="p-2 text-xs text-[#777]">
              Aucune conversation pour l&apos;instant. Écris à un profil pour le retrouver ici.
            </p>
          )}
        </div>

        <div className="flex min-h-[480px] flex-col rounded-xl bg-white p-4">
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <Link to="/member/$id" params={{ id: active.id }} aria-label={`Voir le profil de ${active.name}`}>
                  <img src={active.photo} alt={active.name} className="h-10 w-10 rounded-full object-cover hover:ring-2 hover:ring-[#e91e63]" />
                </Link>
                <div>
                  <p className="font-medium">{active.name}</p>
                  <p className="text-xs text-[#999]">{active.sub}</p>
                </div>
                <Link to="/member/$id" params={{ id: active.id }} className="ml-auto text-sm text-[#e91e63] underline">
                  Voir profil de {active.name}
                </Link>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto py-4" aria-live="polite">
                {chat.length === 0 && <p className="text-sm text-[#999]">Dis bonjour à {active.name} !</p>}
                {chat.map((m) => (
                  <div key={m.id} className={m.image
                    ? `w-fit max-w-[80%] rounded-lg ${m.from === "me" ? "ml-auto" : ""}`
                    : `max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.from === "me" ? "ml-auto bg-[#e91e63] text-white" : "bg-[#f2f2f2] text-[#333]"}`}>
                    {m.image ? (
                      <>
                        {m.from === "me" ? (
                          <span className="relative inline-block rounded-md bg-[#e91e63] p-px">
                            <img src={mediaUrl(m.image)} alt="Image envoyée par toi" className="h-40 w-auto rounded-sm" loading="lazy" />
                            {(() => {
                              const reacts = (fb[m.id] ?? []).filter((f) => f.kind === "reaction");
                              const last = reacts[reacts.length - 1];
                              return last ? (
                                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm shadow" title={`${last.reactor || "Quelqu'un"} : ${last.detail}`}>
                                  {last.detail}
                                </span>
                              ) : null;
                            })()}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setLightbox({ src: m.image as string, msgId: m.id }); setReportReason(""); }}
                            className="inline-block rounded-md bg-[#e91e63] p-px"
                            aria-label="Agrandir la photo"
                          >
                            <img src={mediaUrl(m.image)} alt={`Image envoyée par ${active.name}`} className="h-40 w-auto rounded-sm" loading="lazy" />
                          </button>
                        )}
                        <p className="mt-1 text-[11px] text-[#999]">{fmtFull(m.ts, m.at)}</p>
                      </>
                    ) : m.audio ? (
                      <>
                        <span className="flex items-center gap-1">
                          <SwivvVoicePlayer src={mediaUrl(m.audio)} dark={m.from === "me"} />
                          {/* ponytail: report on received vocals only — reporting your own makes no sense; same rule if text messages ever gain flags */}
                          {m.from !== "me" && (
                          <SwivvHint text="Signaler ce vocal">
                            <button
                              type="button"
                              aria-label="Signaler ce vocal"
                              onClick={() => { setVoiceReport(m.id); setReportReason(""); }}
                              className="shrink-0 rounded p-1 text-[#999] hover:text-red-600"
                            >
                              <Flag className="h-4 w-4" />
                            </button>
                          </SwivvHint>
                          )}
                        </span>
                        {!!m.dur && <p className={`mt-1 text-[11px] ${m.from === "me" ? "text-white/70" : "text-[#999]"}`}>{m.dur}s · {fmtFull(m.ts, m.at)}</p>}
                      </>
                    ) : (
                      <>
                        <p>{tr[m.id]?.showTr ? tr[m.id].text : m.text}</p>
                        {/* ponytail: button only when the guess differs (null guess = too short/unclear, button stays and translation settles it) */}
                        {m.from !== "me" && !tr[m.id]?.same && guessLang(m.text) !== appLang && (
                          <button
                            type="button"
                            disabled={trBusy.has(m.id)}
                            onClick={async () => {
                              const cur = tr[m.id];
                              if (cur) {
                                setTr({ ...tr, [m.id]: { ...cur, showTr: !cur.showTr } });
                                return;
                              }
                              setTrBusy(new Set(trBusy).add(m.id));
                              const r = await translateText(m.text, appLang);
                              setTrBusy((prev) => {
                                const n = new Set(prev);
                                n.delete(m.id);
                                return n;
                              });
                              if (!r) return;
                              setTr((prev) => ({
                                ...prev,
                                [m.id]: r.same
                                  ? { text: m.text, showTr: false, same: true }
                                  : { text: r.text, showTr: true },
                              }));
                            }}
                            className="mt-1 text-[11px] underline opacity-70 hover:opacity-100"
                          >
                            {trBusy.has(m.id) ? "Traduction…" : tr[m.id]?.showTr ? "Voir l'original" : "Traduire"}
                          </button>
                        )}
                      </>
                    )}
                    {!m.audio && !m.image && <p className={`mt-1 text-[11px] ${m.from === "me" ? "text-white/70" : "text-[#999]"}`}>{fmtFull(m.ts, m.at)}</p>}
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  const bad = findOffensive(draft);
                  if (bad.length) {
                    setOffensive(bad);
                    return;
                  }
                  // ponytail: 10+ digits ≈ a phone number — branded confirm, native confirm if Dialog ever unavailable
                  if (draft.replace(/\D/g, "").length >= 10) {
                    setPhoneWarn(draft.trim());
                    return;
                  }
                  sendChat(active.id, draft.trim());
                  setDraft("");
                  force((x) => x + 1);
                  window.setTimeout(() => force((x) => x + 1), 1500);
                }}
                className="flex gap-2 border-t border-border pt-3"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Écris à ${active.name}…`}
                  aria-label="Écris ton message"
                  maxLength={500}
                  className="flex-1 rounded-lg border border-border bg-[#f7f7f7] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                />
                {isMatch(active.id) && (
                  voice.recording ? (
                    <span className="flex items-center gap-1">
                      <span className="text-sm font-medium tabular-nums text-red-600">{voice.seconds}s</span>
                      <button type="button" onClick={async () => { const blob = await voice.stop(); if (!blob) return; setSendingVoice(true); const err = await sendVoice(active.id, blob, voice.seconds); setSendingVoice(false); setVoiceErr(err); force((x) => x + 1); }} aria-label="Envoyer le vocal" className="rounded-lg bg-red-600 px-3 py-2 text-white">
                        <Square className="h-5 w-5" />
                      </button>
                      <button type="button" onClick={voice.cancel} aria-label="Annuler le vocal" className="rounded-lg border border-border px-2 py-2 text-[#777]">
                        <X className="h-5 w-5" />
                      </button>
                    </span>
                  ) : (
                    <>
                      <button type="button" disabled={sendingVoice} onClick={async () => setVoiceErr(await voice.start())} aria-label="Enregistrer un vocal" className="rounded-lg border border-border px-3 py-2 text-[#e91e63] disabled:opacity-40">
                        <Mic className="h-5 w-5" />
                      </button>
                      <button type="button" disabled={sendingImg} onClick={() => fileRef.current?.click()} aria-label="Envoyer une image" title="Envoyer une image" className="rounded-lg border border-border px-3 py-2 text-[#e91e63] disabled:opacity-40">
                        <ImagePlus className="h-5 w-5" />
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        aria-label="Choisir une image"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (!f) return;
                          setImgErr(null);
                          setPendingFile(f);
                        }}
                      />
                    </>
                  )
                )}
                <button type="submit" disabled={!draft.trim()} className="rounded-lg bg-[#e91e63] px-5 py-2 font-medium text-white disabled:opacity-40">
                  Envoyer
                </button>
              </form>
                {voiceErr && <p className="pt-1 text-xs text-red-600">{voiceErr}</p>}
                {imgErr && <p className="pt-1 text-xs text-red-600">{imgErr}</p>}
                {sendingVoice && <p className="pt-1 text-xs text-[#777]">Envoi du vocal…</p>}
                {sendingImg && <p className="pt-1 text-xs text-[#777]">Envoi de l'image…</p>}
                {/* ponytail: root gated on state (not just content) — an always-mounted controlled Radix root can strand an empty shell + overlay on mobile that eats every tap until refresh */}
                {pendingFile && (<Dialog open onOpenChange={(o) => { if (!o) setPendingFile(null); }}>
                  <DialogContent className="max-w-sm text-center">
                    <DialogHeader>
                      <DialogTitle>Envoyer cette photo ?</DialogTitle>
                      <DialogDescription>
                        Les photos partagées doivent respecter le règlement : pas de nudité, pas de contenu
                        choquant, et seulement des personnes consentantes.{" "}
                        <Link to="/guide-photos" onClick={() => setPendingFile(null)} className="font-medium text-[#e91e63] underline">
                          Guide photos
                        </Link>
                      </DialogDescription>
                    </DialogHeader>
                    {previewUrl && (
                      <img src={previewUrl} alt="Aperçu de la photo à envoyer" className="mx-auto max-h-48 rounded-lg object-cover" />
                    )}
                    <div className="grid gap-2">
                      <button
                        type="button"
                        disabled={sendingImg}
                        onClick={async () => {
                          if (!pendingFile) return;
                          const f = pendingFile;
                          setPendingFile(null);
                          setSendingImg(true);
                          const err = await sendImage(active.id, f);
                          setSendingImg(false);
                          setImgErr(err);
                          force((x) => x + 1);
                        }}
                        className="w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white disabled:opacity-40"
                      >
                        Confirmer l'envoi
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingFile(null)}
                        className="w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium text-[#555]"
                      >
                        Annuler
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>)}
                {offensive && (<Dialog open onOpenChange={(o) => { if (!o) setOffensive(null); }}>
                  <DialogContent className="max-w-sm text-center">
                    <DialogHeader>
                      <TriangleAlert className="mx-auto h-10 w-10 text-red-600" />
                      <DialogTitle className="mt-2">Message non envoyé</DialogTitle>
                      <DialogDescription>
                        Ton message contient {offensive && offensive.length > 1 ? "des expressions" : "une expression"} à
                        caractère injurieux ({offensive?.map((w) => `« ${w} »`).join(", ")}). Sur SWIVV, le respect
                        n&apos;est pas une option : merci de reformuler ton message.
                      </DialogDescription>
                    </DialogHeader>
                    <button
                      type="button"
                      onClick={() => setOffensive(null)}
                      className="w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white"
                    >
                      Je modifie mon message
                      </button>
                  </DialogContent>
                </Dialog>)}
                {voiceReport && (<Dialog open onOpenChange={(o) => { if (!o) { setVoiceReport(null); setReportReason(""); } }}>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Signaler ce vocal ?</DialogTitle>
                      <DialogDescription>Choisis le motif — la modération l&apos;examinera.</DialogDescription>
                    </DialogHeader>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      aria-label="Motif du signalement"
                      className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
                    >
                      <option value="">Choisir un motif…</option>
                      {REPORT_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <div className="grid gap-2">
                      <button
                        type="button"
                        disabled={!reportReason || !voiceReport}
                        onClick={() => {
                          if (!voiceReport || !reportReason) return;
                          void sendFeedback({ msg_id: voiceReport, kind: "report", detail: `Vocal : ${reportReason}`, reactor: user?.name });
                          logModReport({ target: active.id, by: user?.email ?? "", at: new Date().toISOString(), detail: `Vocal : ${reportReason}` });
                          toast("Vocal signalé, la modération va l'examiner.");
                          setVoiceReport(null);
                          setReportReason("");
                        }}
                        className="w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white disabled:opacity-40"
                      >
                        Envoyer le signalement
                      </button>
                      <button
                        type="button"
                        onClick={() => { setVoiceReport(null); setReportReason(""); }}
                        className="w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium text-[#555]"
                      >
                        Annuler
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>)}
                {lightbox && (<Dialog open onOpenChange={(o) => { if (!o) { setLightbox(null); setReportReason(""); } }}>
                  <DialogContent className="max-w-lg">
                    {lightbox && (
                      <>
                        <img src={mediaUrl(lightbox.src)} alt="Photo partagée en grand" className="max-h-[60vh] w-full rounded-lg object-contain bg-black" />
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <div className="flex flex-wrap gap-1" role="group" aria-label="Réagir à la photo">
                            {[["👍", "Like"], ["👎", "Dislike"], ["❤️", "Love"], ["😢", "Sad"], ["😡", "Angry"], ["😂", "Laugh"]].map(([e, label]) => {
                              // ponytail: last-write-wins per reactor (no aggregate counts) — server tally if reaction stats ever matter
                              const mine = (fb[lightbox.msgId] ?? []).filter((f) => f.kind === "reaction" && f.reactor === user?.name).at(-1)?.detail === e;
                              return (
                                <SwivvHint key={label} narrow text={mine ? `${label} — ta réaction` : label}>
                                  <button
                                    type="button"
                                    aria-label={`Réagir ${label}`}
                                    aria-pressed={mine}
                                    onClick={() => { void sendFeedback({ msg_id: lightbox.msgId, kind: "reaction", detail: e, reactor: user?.name }); }}
                                    className={`rounded-full border px-2 py-1 text-lg leading-none hover:bg-[#e91e63]/10 ${mine ? "border-[#e91e63] bg-[#e91e63]/15" : "border-border"}`}
                                  >
                                    {e}
                                  </button>
                                </SwivvHint>
                              );
                            })}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <select
                              value={reportReason}
                              onChange={(e) => setReportReason(e.target.value)}
                              aria-label="Motif du signalement"
                              className="max-w-28 rounded-md border border-border px-1.5 py-1.5 text-xs"
                            >
                              <option value="">Signaler…</option>
                              {REPORT_REASONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <SwivvHint text="Signaler cette photo">
                              <button
                                type="button"
                                disabled={!reportReason}
                                aria-label="Envoyer le signalement"
                                onClick={() => {
                                void sendFeedback({ msg_id: lightbox.msgId, kind: "report", detail: reportReason, reactor: user?.name });
                                logModReport({ target: active.id, by: user?.email ?? "", at: new Date().toISOString(), detail: `Photo : ${reportReason}` });
                                toast("Photo signalée, la modération va l'examiner.");
                                setLightbox(null);
                                setReportReason("");
                              }}
                              className="rounded-md border border-border p-1.5 text-red-600 disabled:opacity-40"
                            >
                              <Flag className="h-4 w-4" />
                            </button>
                            </SwivvHint>
                            <SwivvHint text="Télécharger la photo">
                              <button
                                type="button"
                                aria-label="Télécharger la photo"
                              // ponytail: blob download with new-tab fallback (cross-origin ignores the download attr) — service-worker cache if offline saves ever matter
                              onClick={async () => {
                                try {
                                  const r = await fetch(lightbox.src);
                                  const b = await r.blob();
                                  const a = document.createElement("a");
                                  a.href = URL.createObjectURL(b);
                                  a.download = `swivv-photo-${Date.now()}.jpg`;
                                  a.click();
                                  window.setTimeout(() => URL.revokeObjectURL(a.href), 5000);
                                } catch {
                                  window.open(lightbox.src, "_blank");
                                }
                                void sendFeedback({ msg_id: lightbox.msgId, kind: "download", detail: "", reactor: user?.name });
                              }}
                              className="rounded-md border border-border p-1.5 text-[#555]"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            </SwivvHint>
                          </div>
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>)}
                {phoneWarn && (<Dialog open onOpenChange={(o) => { if (!o) setPhoneWarn(null); }}>
                  <DialogContent className="max-w-sm text-center">
                    <DialogHeader>
                      <TriangleAlert className="mx-auto h-10 w-10 text-amber-500" />
                      <DialogTitle className="mt-2">Partager ton numéro ?</DialogTitle>
                      <DialogDescription>
                        Ton message semble contenir un numéro de téléphone. Ne partage tes coordonnées
                        que si tu fais confiance à cette personne.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => { if (!phoneWarn) return; const bad = findOffensive(phoneWarn); setPhoneWarn(null); if (bad.length) { setOffensive(bad); return; } sendChat(active.id, phoneWarn); setDraft(""); force((x) => x + 1); }}
                        className="w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white"
                      >
                        Envoyer quand même
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhoneWarn(null)}
                        className="w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium text-[#555]"
                      >
                        Annuler
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>)}
            </>
          ) : (
            <p className="text-sm text-[#777]">Sélectionne une conversation.</p>
          )}
        </div>
      </main>
      <SwivvFooter />
      {!loading && !user && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <MessageCircle className="mx-auto h-10 w-10 text-[#e91e63]" />
            <h2 className="mt-2 text-xl font-medium text-[#333]">Tes messages t'attendent</h2>
            <p className="mt-1 text-sm text-[#777]">
              Crée un compte ou connecte-toi pour lire et envoyer des messages.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("message")}
              className="mt-4 w-full rounded-md bg-[#e91e63] px-4 py-3 font-medium text-white"
            >
              Se connecter / S'inscrire
            </button>
            <Link
              to="/browse"
              search={{ q: "", type: "", location: "" }}
              className="mt-3 block text-sm text-[#e91e63]"
            >
              Continuer à parcourir les profils
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
