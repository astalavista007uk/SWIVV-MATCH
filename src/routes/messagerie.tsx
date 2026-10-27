import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Flag, ImagePlus, MessageCircle, Mic, Smile, Square, TriangleAlert, UserX, X, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getProfile } from "@/lib/swivv-data";
import { fmtFull, getAppLang, getChat, getChattedIds, getFeedback, getPeer, isBlockedById, isBlockedId, isMatch, toggleBlock, logModReport, markAllRead, mediaUrl, rememberPeer, sendChat, sendFeedback, sendImage, sendVoice, subscribe, syncChatsNow, useDeletedIds, useSignedMediaMap, useTotalCount, useUnreadCount, type ChatFeedback } from "@/lib/swivv-store";
import { supabase } from "@/integrations/supabase/client";
import { findOffensive, REPORT_REASONS } from "@/lib/swivv-moderation";
import { SwivvAuthButtons, openAuthModal, useSwivvUser } from "@/lib/swivv-auth";
import { useAuth } from "@/hooks/use-auth";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { SwivvHint } from "@/components/swivv-hint";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvVoicePlayer } from "@/components/swivv-voice-player";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/messagerie")({
  head: () => ({ meta: [{ title: "Messages — SWIVV" }] }),
  component: MessagesPage,
});

// ponytail: 40 hand-picked emoji, no picker dependency — emoji-mart only if search/categories/skin tones are ever required
const EMOJIS = [
  "😀",
  "😂",
  "😊",
  "😍",
  "🥰",
  "😘",
  "😎",
  "🤔",
  "😉",
  "🙃",
  "😅",
  "😢",
  "😭",
  "😡",
  "🤗",
  "😴",
  "🤤",
  "😇",
  "🥳",
  "🤩",
  "😜",
  "😏",
  "😬",
  "🙄",
  "😮",
  "😱",
  "🤯",
  "🥺",
  "😔",
  "😌",
  "👍",
  "👎",
  "👏",
  "🙏",
  "💪",
  "🔥",
  "❤️",
  "💔",
  "✨",
  "🎉",
];

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
    if (Number(j?.responseStatus) === 403 && /DISTINCT/i.test(String(j?.responseDetails))) return { text, same: true };
    if (Number(j?.responseStatus) !== 200) return null;
    const t = j?.responseData?.translatedText;
    if (typeof t !== "string" || !t.trim()) return null;
    if (t.trim() === text.trim()) return { text, same: true };
    trCache.set(key, t);
    return { text: t, same: false };
  } catch {
    return null;
  }
}

function MessagesPage() {
  const t = useT();
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
  // ponytail: inbox lives in localStorage — SSR can't see it, so hydrate empty first, then fill; avoids a structural hydration mismatch (server list 0, client list N)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // ponytail: inbox = profiles with ≥1 sent/received message only — seeds resolve directly, real peers via the directory, unknown ids get a placeholder
  // ponytail: blocked threads stay listed (history is never deleted) — banner + no composer below, icons mark the direction
  // ponytail: a fresh match has no message yet, so it isn't in getChattedIds — the requested peer is prepended so "Envoyer un message" opens their empty thread instead of list[0]; persisted "match with no message" rows if the inbox ever needs to remember them
  const list = !mounted ? [] : (() => {
    const ids = getChattedIds();
    if (activeId && !ids.includes(activeId)) ids.unshift(activeId);
    return ids;
  })().map((id) => {
    const s = getProfile(id);
    if (s) return { id: s.id, name: s.name, photo: s.photo, age: `${s.age}`, sub: s.online ? t("En ligne") : s.lastActive, gender: s.gender, seed: true as const };
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
  // ponytail: private bucket — thread media resolves to 1h signed URLs; lightbox + download reuse the same map via lightbox.src
  const signed = useSignedMediaMap(chat.flatMap((m) => [m.audio, m.image]));
  // ponytail: blocked thread = history stays, composer goes — blocker gets the unblock button, blocked side only the notice
  const iBlocked = active ? isBlockedId(active.id) : false;
  const threadBlocked = active ? (iBlocked || isBlockedById(active.id)) : false;
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
  const lightboxSrc = lightbox ? (signed[lightbox.src] ?? mediaUrl(lightbox.src) ?? lightbox.src) : "";

  // ponytail: feedback keyed by opaque msg_id (no user-mapped threads yet) — client filters to this thread; server-scoped subscription when threads grow
  useEffect(() => {
    if (!active) return;
    const ids = getChat(active.id).filter((m) => m.image).map((m) => m.id);
    let live = true;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    getFeedback(ids).then((rows) => {
      if (!live) return;
      const byMsg: Record<string, ChatFeedback[]> = {};
      for (const r of rows) (byMsg[r.msg_id] ??= []).push(r);
      setFb(byMsg);
    });
    // ponytail: fixed topic + async removeChannel = .on() on a still-subscribed leftover; drop it before re-creating
    void (async () => {
      for (const c of supabase.getChannels()) if (c.topic === "realtime:swivv-feedback") await supabase.removeChannel(c);
      if (!live) return;
      ch = supabase
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
    })();
    return () => {
      live = false;
      if (ch) void supabase.removeChannel(ch);
    };
    // ponytail: chat.length resubscribes on new messages so fresh image ids join the filter — stable channel if traffic ever grows
  }, [active?.id, chat.length]);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDetailsElement>(null);

  // ponytail: emoji lands at the caret, not appended — resets the caret after React re-renders; grapheme-accurate insertion is cosmetically irrelevant for ZWJ sequences
  const addEmoji = (e: string) => {
    const el = inputRef.current;
    const at = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? at;
    if (draft.length - (end - at) + e.length > 500) return;
    setDraft(draft.slice(0, at) + e + draft.slice(end));
    if (emojiRef.current) emojiRef.current.open = false;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + e.length, at + e.length);
    });
  };

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
      <header className="border-b border-border bg-black text-white">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-[300px_1fr]">
        <div className="rounded-xl bg-white p-2">
          {/* ponytail: live totals (unread clears on open via markAllRead) — shared inbox header, desktop + mobile render the same h1; counts are localStorage, so 0 until mounted or SSR/client disagree */}
          <h1 className="whitespace-nowrap p-2 font-medium">{t("Conversations ({total} · {unread} non lu{s})", { total: mounted ? total : 0, unread: mounted ? unread : 0, s: mounted && unread > 1 ? "s" : "" })}</h1>
          <p className="px-2 pb-1 text-xs text-[#999]">{t("Les messages de plus de 3 mois sont supprimés automatiquement, lus ou non.")}</p>
          {list.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveId(p.id)}
              className={`flex w-full items-center gap-3 rounded-lg p-2 text-left ${active?.id === p.id ? "bg-[#e60050]/10" : ""}`}
            >
              <img src={p.photo} alt={p.name} className={`h-11 w-11 rounded-full object-cover ${deleted.has(p.id) ? "opacity-60 grayscale" : ""}`} />
              <span>
                <span className="block font-medium text-[#333]">
                  {p.name}{p.age ? `, ${p.age}` : ""}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#999]">
                  {t("{n} message(s)", { n: getChat(p.id).length })}
                  {isMatch(p.id) && (
                    <span className="flex items-center gap-1 text-[#e60050]" aria-label={t("Vocaux et images disponibles")}>
                      <Mic className="h-3.5 w-3.5" />
                      <ImagePlus className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {deleted.has(p.id) && (
                    <SwivvHint align="left" text={t("Ce compte a été supprimé — l'historique est conservé.")}>
                      <span className="inline-flex items-center gap-1 text-[#999]" aria-label={t("{name} : compte supprimé", { name: p.name })}>
                        <UserX className="h-3.5 w-3.5" />
                      </span>
                    </SwivvHint>
                  )}
                  {isBlockedId(p.id) && (
                    <SwivvHint align="left" text={t("Tu as bloqué ce membre — la conversation est en pause.")}>
                      <span className="inline-flex items-center gap-1 text-[#e60050]" aria-label={t("{name} : bloqué par toi", { name: p.name })}>
                        <Ban className="h-3.5 w-3.5" />
                      </span>
                    </SwivvHint>
                  )}
                  {!isBlockedId(p.id) && isBlockedById(p.id) && (
                    <SwivvHint align="left" text={t("Ce membre a bloqué la communication.")}>
                      <span className="inline-flex items-center gap-1 text-amber-600" aria-label={t("{name} : communication bloquée", { name: p.name })}>
                        <TriangleAlert className="h-3.5 w-3.5" />
                      </span>
                    </SwivvHint>
                  )}
                </span>
              </span>
            </button>
          ))}
          {list.length === 0 && (
            <p className="p-2 text-xs text-[#777]">
              {t("Aucune conversation pour l'instant. Écris à un profil pour le retrouver ici.")}
            </p>
          )}
        </div>

        <div className="flex min-h-[480px] flex-col rounded-xl bg-white p-4">
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <Link to="/member/$id" params={{ id: active.id }} aria-label={`Voir le profil de ${active.name}`}>
                  <img src={active.photo} alt={active.name} className="h-10 w-10 rounded-full object-cover hover:ring-2 hover:ring-[#e60050]" />
                </Link>
                <div>
                  <p className="font-medium">{active.name}</p>
                  <p className="text-xs text-[#999]">{active.sub}</p>
                </div>
                <Link to="/member/$id" params={{ id: active.id }} className="ml-auto text-sm text-[#e60050] underline">
                  {t("Voir profil de {name}", { name: active.name })}
                </Link>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto py-4" aria-live="polite">
                {chat.length === 0 && <p className="text-sm text-[#999]">{t("Dis bonjour à {name} !", { name: active.name })}</p>}
                {chat.map((m) => (
                  <div key={m.id} className={m.image
                    ? `w-fit max-w-[80%] rounded-lg ${m.from === "me" ? "ml-auto" : ""}`
                    : `max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.from === "me" ? "ml-auto bg-[#e60050] text-white" : "bg-[#f2f2f2] text-[#333]"}`}>
                    {m.image ? (
                      <>
                        {m.from === "me" ? (
                          <span className="relative inline-block rounded-md bg-[#e60050] p-px">
                            <img src={m.image ? (signed[m.image] ?? mediaUrl(m.image)) : undefined} alt="Image envoyée par toi" className="h-40 w-auto rounded-sm" loading="lazy" />
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
                            className="inline-block rounded-md bg-[#e60050] p-px"
                            aria-label={t("Agrandir la photo")}
                          >
                            <img src={m.image ? (signed[m.image] ?? mediaUrl(m.image)) : undefined} alt={`Image envoyée par ${active.name}`} className="h-40 w-auto rounded-sm" loading="lazy" />
                          </button>
                        )}
                        <p className="mt-1 text-[11px] text-[#999]">{fmtFull(m.ts, m.at)}</p>
                      </>
                    ) : m.audio ? (
                      <>
                        <span className="flex items-center gap-1">
                          <SwivvVoicePlayer src={m.audio ? (signed[m.audio] ?? mediaUrl(m.audio)) : undefined} dark={m.from === "me"} />
                          {/* ponytail: report on received vocals only — reporting your own makes no sense; same rule if text messages ever gain flags */}
                          {m.from !== "me" && (
                          <SwivvHint text={t("Signaler ce vocal")}>
                            <button
                              type="button"
                              aria-label={t("Signaler ce vocal")}
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
                        {m.from !== "me" && !tr[m.id]?.same && (
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
              {threadBlocked ? (
                <div className="mt-4 rounded-lg bg-[#f2f2f2] p-3 text-center">
                  <p className="text-sm font-medium text-[#555]">Communication avec {active.name} bloquée.</p>
                  {iBlocked && (
                    <button type="button" onClick={() => { toggleBlock(active.id); force((x) => x + 1); }} className="mt-1 text-sm font-medium text-[#e60050] hover:underline">
                      Débloquer
                    </button>
                  )}
                </div>
              ) : (
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
                    const chatErr = sendChat(active.id, draft.trim());
                    if (chatErr) { toast.error(chatErr); return; }
                    setDraft("");
                    force((x) => x + 1);
                    window.setTimeout(() => force((x) => x + 1), 1500);
                  }}
                  className="flex gap-2 border-t border-border pt-3"
                >
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onFocus={() => emojiRef.current && (emojiRef.current.open = false)}
                    placeholder={t("Écris à {name}…", { name: active.name })}
                    aria-label={t("Écris ton message")}
                    maxLength={500}
                    className="flex-1 rounded-lg border border-border bg-[#f7f7f7] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e60050]"
                  />
                  {/* ponytail: native <details> = free open/close + keyboard, no popover lib; desktop only — mobile users have the OS keyboard emoji tray */}
                  <details
                    ref={emojiRef}
                    onKeyDown={(e) => e.key === "Escape" && (e.currentTarget.open = false)}
                    className="relative hidden sm:block"
                  >
                    <summary
                      aria-label={t("Insérer un émoji")}
                      className="flex h-full cursor-pointer list-none items-center rounded-lg border border-border px-3 py-2 text-[#e60050] hover:bg-[#f7f7f7] [&::-webkit-details-marker]:hidden"
                    >
                      <SwivvHint text={t("Émojis")} narrow above>
                        <Smile className="h-5 w-5" />
                      </SwivvHint>
                    </summary>
                    <div
                      role="group"
                      aria-label={t("Émojis")}
                      className="absolute bottom-full left-0 z-20 mb-2 grid w-72 grid-cols-8 gap-0.5 rounded-2xl border border-border bg-white p-2 shadow-xl"
                    >
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => addEmoji(e)}
                          className="rounded-lg p-1 text-xl leading-none transition-colors hover:bg-[#f7f7f7]"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </details>
                  {isMatch(active.id) && (
                    voice.recording ? (
                      <span className="flex items-center gap-1">
                        <span className="text-sm font-medium tabular-nums text-red-600">{voice.seconds}s</span>
                        <button type="button" onClick={async () => { const blob = await voice.stop(); if (!blob) return; setSendingVoice(true); const err = await sendVoice(active.id, blob, voice.seconds); setSendingVoice(false); setVoiceErr(err); force((x) => x + 1); }} aria-label={t("Envoyer le vocal")} className="rounded-lg bg-red-600 px-3 py-2 text-white">
                          <Square className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={voice.cancel} aria-label={t("Annuler le vocal")} className="rounded-lg border border-border px-2 py-2 text-[#777]">
                          <X className="h-5 w-5" />
                        </button>
                      </span>
                    ) : (
                      <>
                        <SwivvHint text={t("Enregistrer un vocal")} narrow above>
                          <button type="button" disabled={sendingVoice} onClick={async () => setVoiceErr(await voice.start())} aria-label={t("Enregistrer un vocal")} className="rounded-lg border border-border px-3 py-2 text-[#e60050] disabled:opacity-40">
                            <Mic className="h-5 w-5" />
                          </button>
                        </SwivvHint>
                        <SwivvHint text={t("Envoyer une image")} narrow above>
                          <button type="button" disabled={sendingImg} onClick={() => fileRef.current?.click()} aria-label={t("Envoyer une image")} className="rounded-lg border border-border px-3 py-2 text-[#e60050] disabled:opacity-40">
                            <ImagePlus className="h-5 w-5" />
                          </button>
                        </SwivvHint>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          aria-label={t("Choisir une image")}
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
                  <button type="submit" disabled={!draft.trim()} className="rounded-lg bg-[#e60050] px-5 py-2 font-medium text-white disabled:opacity-40">
                    Envoyer
                  </button>
                </form>
              )}
                {voiceErr && <p className="pt-1 text-xs text-red-600">{voiceErr}</p>}
                {imgErr && <p className="pt-1 text-xs text-red-600">{imgErr}</p>}
                {sendingVoice && <p className="pt-1 text-xs text-[#777]">{t("Envoi du vocal…")}</p>}
                {sendingImg && <p className="pt-1 text-xs text-[#777]">{t("Envoi de l'image…")}</p>}
                {/* ponytail: root gated on state (not just content) — an always-mounted controlled Radix root can strand an empty shell + overlay on mobile that eats every tap until refresh */}
                {pendingFile && (<Dialog open onOpenChange={(o) => { if (!o) setPendingFile(null); }}>
                  <DialogContent className="max-w-sm text-center">
                    <DialogHeader>
                      <DialogTitle>{t("Envoyer cette photo ?")}</DialogTitle>
                      <DialogDescription>
                        {t("Les photos partagées doivent respecter le règlement : pas de nudité, pas de contenu choquant, et seulement des personnes consentantes.")}{" "}
                        <Link to="/guide-photos" onClick={() => setPendingFile(null)} className="font-medium text-[#e60050] underline">
                          {t("Guide photos")}
                        </Link>
                      </DialogDescription>
                    </DialogHeader>
                    {previewUrl && (
                      <img src={previewUrl} alt={t("Aperçu de la photo à envoyer")} className="mx-auto max-h-48 rounded-lg object-cover" />
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
                        className="w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white disabled:opacity-40"
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
                      <DialogTitle className="mt-2">{t("Message non envoyé")}</DialogTitle>
                      <DialogDescription>
                        Ton message contient {offensive && offensive.length > 1 ? "des expressions" : "une expression"} à
                        caractère injurieux ({offensive?.map((w) => `« ${w} »`).join(", ")}). Sur SWIVV, le respect
                        n&apos;est pas une option : merci de reformuler ton message.
                      </DialogDescription>
                    </DialogHeader>
                    <button
                      type="button"
                      onClick={() => setOffensive(null)}
                      className="w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white"
                    >
                      Je modifie mon message
                      </button>
                  </DialogContent>
                </Dialog>)}
                {voiceReport && (<Dialog open onOpenChange={(o) => { if (!o) { setVoiceReport(null); setReportReason(""); } }}>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>{t("Signaler ce vocal ?")}</DialogTitle>
                      <DialogDescription>{t("Choisis le motif — la modération l'examinera.")}</DialogDescription>
                    </DialogHeader>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      aria-label={t("Motif du signalement")}
                      className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
                    >
                      <option value="">{t("Choisir un motif…")}</option>
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
                        className="w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white disabled:opacity-40"
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
                        <img src={lightboxSrc} alt="Photo partagée en grand" className="max-h-[60vh] w-full rounded-lg object-contain bg-black" />
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <div className="flex flex-wrap gap-1" role="group" aria-label={t("Réagir à la photo")}>
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
                                    className={`rounded-full border px-2 py-1 text-lg leading-none hover:bg-[#e60050]/10 ${mine ? "border-[#e60050] bg-[#e60050]/15" : "border-border"}`}
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
                              aria-label={t("Motif du signalement")}
                              className="max-w-28 rounded-md border border-border px-1.5 py-1.5 text-xs"
                            >
                              <option value="">{t("Signaler…")}</option>
                              {REPORT_REASONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <SwivvHint text={t("Signaler cette photo")}>
                              <button
                                type="button"
                                disabled={!reportReason}
                                aria-label={t("Envoyer le signalement")}
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
                            <SwivvHint text={t("Télécharger la photo")}>
                              <button
                                type="button"
                                aria-label={t("Télécharger la photo")}
                              // ponytail: blob download with new-tab fallback (cross-origin ignores the download attr) — service-worker cache if offline saves ever matter
                              onClick={async () => {
                                try {
                                  const r = await fetch(lightboxSrc);
                                  const b = await r.blob();
                                  const a = document.createElement("a");
                                  a.href = URL.createObjectURL(b);
                                  a.download = `swivv-photo-${Date.now()}.jpg`;
                                  a.click();
                                  window.setTimeout(() => URL.revokeObjectURL(a.href), 5000);
                                } catch {
                                  window.open(lightboxSrc, "_blank");
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
                      <DialogTitle className="mt-2">{t("Partager ton numéro ?")}</DialogTitle>
                      <DialogDescription>
                        {t("Ton message semble contenir un numéro de téléphone. Ne partage tes coordonnées que si tu fais confiance à cette personne.")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => { if (!phoneWarn) return; const bad = findOffensive(phoneWarn); setPhoneWarn(null); if (bad.length) { setOffensive(bad); return; } const chatErr = sendChat(active.id, phoneWarn); if (chatErr) { toast.error(chatErr); return; } setDraft(""); force((x) => x + 1); }}
                        className="w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white"
                      >
                        {t("Envoyer quand même")}
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
            <p className="text-sm text-[#777]">{t("Sélectionne une conversation.")}</p>
          )}
        </div>
      </main>
      <SwivvFooter />
      {!loading && !user && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <MessageCircle className="mx-auto h-10 w-10 text-[#e60050]" />
            <h2 className="mt-2 text-xl font-medium text-[#333]">{t("Tes messages t'attendent")}</h2>
            <p className="mt-1 text-sm text-[#777]">
              {t("Crée un compte ou connecte-toi pour lire et envoyer des messages.")}
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("message")}
              className="mt-4 w-full rounded-md bg-[#e60050] px-4 py-3 font-medium text-white"
            >
              Se connecter / S'inscrire
            </button>
            <Link
              to="/browse"
              search={{ q: "", type: "", location: "" }}
              className="mt-3 block text-sm text-[#e60050]"
            >
              {t("Continuer à parcourir les profils")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
