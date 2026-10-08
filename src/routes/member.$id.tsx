import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ban, Flag, Heart, MessageCircle, Mic, Square, X } from "lucide-react";
import { SWIVV_PROFILES, getProfile, type SwivvProfile } from "@/lib/swivv-data";
import { displayPct, load, MatchTooltip, topMatches } from "@/routes/matches";
import { fmtFull, getBlocked, getLikes, isMatch, isReported, logModReport, mediaUrl, rememberPeer, reportMember, sendFeedback, toggleBlock, toggleLike, bumpProfileView, getChat, sendChat, sendVoice, subscribe } from "@/lib/swivv-store";
import { PROFILE_REPORT_REASONS, REPORT_REASONS, findOffensive } from "@/lib/swivv-moderation";
import { toast } from "sonner";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { SwivvAuthButtons, getSwivvUser, requireSwivvAuth } from "@/lib/swivv-auth";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvHint } from "@/components/swivv-hint";
import { SwivvVoicePlayer } from "@/components/swivv-voice-player";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvProfileView } from "@/components/swivv-profile-view";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/member/$id")({
  head: ({ params }) => ({
    meta: [{ title: `${getProfile(params.id)?.name ?? "Profil"} — SWIVV` }],
  }),
  component: MemberPage,
});

function MemberPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [, force] = useState(0);
  const [reportChoice, setReportChoice] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const seed = getProfile(id);
  // ponytail: real members resolve by uid on demand — extend getProfile with a cache if remote lookups multiply
  const [remote, setRemote] = useState<SwivvProfile | null>(null);
  const [remoteDone, setRemoteDone] = useState(false);
  useEffect(() => {
    if (seed || !id.startsWith("u:")) return;
    (supabase as any)
      .from("swivv_profiles")
      .select("data")
      .eq("user_id", id.slice(2))
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.data?.name) setRemote({ ...data.data, id });
        setRemoteDone(true);
      })
      .catch(() => setRemoteDone(true));
  }, [id, seed]);
  const profile = seed ?? remote;
  useEffect(() => { bumpProfileView(id); }, [id]);
  // ponytail: peer directory feeds the message inbox (real ids don't resolve from seeds) — refresh on view, keyed by id
  useEffect(() => {
    if (profile) rememberPeer({ id: profile.id, name: profile.name, photo: profile.photo });
  }, [profile?.id]);
  // ponytail: all hooks above the early return — profile flips null→remote on real-member loads, hook count must not change
  const [msgOpen, setMsgOpen] = useState(false);

  if (!profile) {
    if (id.startsWith("u:") && !remoteDone) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-[#777]">Chargement…</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-medium">Profil introuvable</h1>
        <Link to="/browse" search={{ q: "", type: "", location: "" }} className="mt-4 inline-block text-[#e91e63] underline">
          Retour aux profils
        </Link>
      </div>
    );
  }

  const liked = getLikes().includes(profile.id);
  const matched = isMatch(profile.id);
  const blocked = getBlocked().includes(profile.id);
  const reported = isReported(profile.id);

  // Similar profiles: same gender as visited profile, ranked by real similarities
  // (city, age, interests, height, religion, languages, marital status, intention).
  function similarityScore(a: SwivvProfile, b: SwivvProfile) {
    let score = 0;
    if (a.city === b.city) score += 30;
    if (a.country === b.country) score += 5;
    score += Math.max(0, 20 - Math.abs(a.age - b.age) * 2);
    const sharedInterests = b.interests.filter((i) => a.interests.includes(i)).length;
    score += sharedInterests * 12;
    if (a.religion === b.religion) score += 15;
    const sharedLang = b.languages.filter((l) => a.languages.includes(l)).length;
    score += sharedLang * 5;
    if (a.maritalStatus === b.maritalStatus) score += 10;
    if (a.lookingFor === b.lookingFor) score += 10;
    score += Math.max(0, 10 - Math.abs(a.heightCm - b.heightCm) / 2);
    if (a.occupation === b.occupation) score += 5;
    if (b.online) score += 2;
    return score;
  }

  const similar = SWIVV_PROFILES.filter((p) => p.id !== profile.id && p.gender === profile.gender)
    .map((p) => ({ p, score: similarityScore(profile, p) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 6)
    .map((x) => x.p);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <Link to="/browse" search={{ q: "", type: "", location: "" }} className="text-sm text-[#555]">
          ← Retour
          </Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <SwivvProfileView
          profile={profile}
          badge={
            <MatchTooltip
              fem={profile.gender === "woman"}
              badge={
                <p className="mt-2 inline-block rounded-full bg-[#e91e63]/10 px-3 py-1 text-sm font-medium text-[#e91e63]">
                  {displayPct(profile, load())}% compatible · {profile.lookingFor}
                </p>
              }
              items={topMatches(profile, load())}
            />
          }
          actions={
            <>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    requireSwivvAuth("like", () => {
                      const r = toggleLike(profile.id);
                      force((x) => x + 1);
                      if (r.matched) nav({ to: "/messagerie" });
                    })
                  }
                  aria-pressed={liked}
                  className={`flex-1 rounded-md px-4 py-3 font-medium ${liked ? "bg-red-50 text-red-600 border border-red-200" : "bg-[#e91e63] text-white"}`}
                >
                  <Heart className={`mr-2 inline h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
                  {liked ? "Liké !" : "Liker"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requireSwivvAuth("message", () => setMsgOpen(true))
                  }
                  className="flex flex-1 items-center justify-center rounded-md border border-[#e91e63] px-4 py-3 font-medium text-[#e91e63]"
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Message
                </button>
              </div>
              {matched && (
                <p className="mt-2 rounded-md bg-green-50 p-2 text-center text-sm font-medium text-green-700">
                  C&apos;est un match ! Va dans Messages pour discuter.
                </p>
              )}
              {blocked ? (
                <div className="mt-2 rounded-md bg-[#f2f2f2] p-3 text-center">
                  <p className="text-sm font-medium text-[#555]">Membre bloqué — tu ne le verras plus dans les profils.</p>
                  <button
                    type="button"
                    onClick={() => requireSwivvAuth("unblock", () => { toggleBlock(profile.id); force((x) => x + 1); })}
                    className="mt-1 text-sm font-medium text-[#e91e63] hover:underline"
                  >
                    Débloquer
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  {reported ? (
                    <span className="flex flex-1 items-center justify-center rounded-md bg-[#f2f2f2] px-3 py-2 text-sm font-medium text-[#777]">
                      <Flag className="mr-1.5 h-4 w-4" /> Signalé
                    </span>
                  ) : (
                    <details className="relative flex-1">
                      <summary className="flex cursor-pointer list-none items-center justify-center whitespace-nowrap rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-[#555] hover:text-red-600 [&::-webkit-details-marker]:hidden">
                        <Flag className="mr-1.5 h-4 w-4" /> Signaler
                      </summary>
                      <div className="absolute inset-x-0 top-full z-10 mt-1 rounded-md border border-border bg-white p-3 shadow-md">
                        <p className="text-sm font-medium text-[#333]">Pourquoi signaler {profile.name} ?</p>
                        <div className="mt-2 space-y-1.5" role="radiogroup" aria-label="Motif du signalement">
                          {PROFILE_REPORT_REASONS.map((r) => (
                            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm text-[#555]">
                              <input
                                type="radio"
                                name="report-reason"
                                value={r}
                                checked={reportChoice === r}
                                onChange={() => setReportChoice(r)}
                                className="accent-red-600"
                              />
                              {r}
                            </label>
                          ))}
                        </div>
                        {reportChoice === "Autre" && (
                          <input
                            value={reportDetail}
                            onChange={(e) => setReportDetail(e.target.value)}
                            placeholder="Précise le motif…"
                            maxLength={300}
                            aria-label="Précise le motif"
                            autoFocus
                            className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-red-600"
                          />
                        )}
                        <button
                          type="button"
                          disabled={!reportChoice || (reportChoice === "Autre" && !reportDetail.trim())}
                          onClick={() => requireSwivvAuth("report", async () => { const me = await getSwivvUser(); reportMember(profile.id, me?.email, reportChoice === "Autre" ? reportDetail.trim() : reportChoice); setReportChoice(""); setReportDetail(""); force((x) => x + 1); })}
                          className="mt-2 w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
                        >
                          Envoyer le signalement
                        </button>
                      </div>
                    </details>
                  )}
                  <details className="relative flex-1">
                    <summary className="flex cursor-pointer list-none items-center justify-center whitespace-nowrap rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-[#555] hover:text-red-600 [&::-webkit-details-marker]:hidden">
                      <Ban className="mr-1.5 h-4 w-4" /> Bloquer
                    </summary>
                    <div className="absolute inset-x-0 top-full z-10 mt-1 rounded-md border border-border bg-white p-3 shadow-md">
                      <p className="text-sm text-[#333]">Bloquer {profile.name} ? Il disparaîtra de tes profils.</p>
                      <button
                        type="button"
                        onClick={() => requireSwivvAuth("block", () => { toggleBlock(profile.id); force((x) => x + 1); })}
                        className="mt-2 w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white"
                      >
                        Oui, bloquer
                      </button>
                    </div>
                  </details>
                </div>
              )}
            </>
          }
          after={
            <section aria-label="Profils similaires" className="mt-8">
              <h2 className="font-medium text-[#333]">
                Profils similaires ({profile.gender === "woman" ? "femmes" : "hommes"})
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {similar.map((p) => {
                  const shared = p.interests.filter((i) => profile.interests.includes(i));
                  const sameCity = p.city === profile.city;
                  return (
                    <Link key={p.id} to="/member/$id" params={{ id: p.id }} className="overflow-hidden rounded-lg bg-white">
                      <img src={p.photo} alt={p.name} loading="lazy" className="aspect-square w-full object-cover" />
                      <div className="p-2">
                        <p className="text-sm font-medium text-[#333]">
                          {p.name}, {p.age}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-[#777]">
                          {sameCity ? `${p.city} · ` : ""}
                          {shared.length > 0 ? `${shared.slice(0, 2).join(", ")}` : p.lookingFor}
                          {p.religion === profile.religion ? " · même religion" : ""}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          }
        />
      </main>
      <SwivvFooter />
      {msgOpen && <MessageDialog profile={profile} onClose={() => { setMsgOpen(false); force((x) => x + 1); }} />}
    </div>
  );
}

// ponytail: same fixed-overlay pattern as AuthModal, history included so first contact works — shared <ChatBox> with /messagerie if a third composer appears
function MessageDialog({ profile, onClose }: { profile: SwivvProfile; onClose: () => void }) {
  const [draft, setDraft] = useState("");
  const [, force] = useState(0);
  const chat = getChat(profile.id);
  // ponytail: live thread — server-pushed messages re-render without refresh
  useEffect(() => subscribe(() => force((x) => x + 1)), []);
  const voice = useVoiceRecorder();
  const [sendingVoice, setSendingVoice] = useState(false);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);
  const [voiceReport, setVoiceReport] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    // ponytail: same block-then-rephrase as /messagerie (report dialogs bypass this path so quoting abuse stays allowed) — shared <ChatBox> if a third composer appears
    const bad = findOffensive(draft);
    if (bad.length) {
      toast.error(`Message non envoyé — langage inapproprié (${bad.map((w) => `« ${w} »`).join(", ")}). Reformule ton message.`);
      return;
    }
    sendChat(profile.id, draft.trim());
    setDraft("");
    force((x) => x + 1);
    window.setTimeout(() => force((x) => x + 1), 1500);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Message à ${profile.name}`} className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <img src={profile.photo} alt={profile.name} className="h-10 w-10 rounded-full object-cover" />
          <div>
            <p className="font-medium">{profile.name}</p>
            <p className="text-xs text-[#999]">{profile.online ? "En ligne" : profile.lastActive}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="ml-auto rounded-full px-2 py-1 text-xl leading-none text-[#777] hover:text-[#333]">
            ×
          </button>
        </div>
        <div className="min-h-[120px] flex-1 space-y-2 overflow-y-auto py-3" aria-live="polite">
          {chat.length === 0 && <p className="text-sm text-[#999]">Dis bonjour à {profile.name} !</p>}
          {chat.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.from === "me" ? "ml-auto bg-[#e91e63] text-white" : "bg-[#f2f2f2] text-[#333]"}`}>
              {m.audio ? (
                <>
                  <span className="flex items-center gap-1">
                    <SwivvVoicePlayer src={mediaUrl(m.audio)} dark={m.from === "me"} />
                    <SwivvHint text="Signaler ce vocal">
                      <button
                        type="button"
                        aria-label="Signaler ce vocal"
                        onClick={() => { setVoiceReport(m.id); setReportReason(""); }}
                        className={`shrink-0 rounded p-1 ${m.from === "me" ? "text-white/70 hover:text-white" : "text-[#999] hover:text-red-600"}`}
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                    </SwivvHint>
                  </span>
                  {!!m.dur && <p className={`mt-1 text-[11px] ${m.from === "me" ? "text-white/70" : "text-[#999]"}`}>{m.dur}s · {fmtFull(m.ts, m.at)}</p>}
                </>
              ) : (
                <p>{m.text}</p>
              )}
              {!m.audio && <p className={`mt-1 text-[11px] ${m.from === "me" ? "text-white/70" : "text-[#999]"}`}>{fmtFull(m.ts, m.at)}</p>}
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-border pt-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Écris à ${profile.name}…`}
            aria-label="Écris ton message"
            maxLength={500}
            autoFocus
            className="flex-1 rounded-lg border border-border bg-[#f7f7f7] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
          />
          {isMatch(profile.id) && (
            voice.recording ? (
              <span className="flex items-center gap-1">
                <span className="text-sm font-medium tabular-nums text-red-600">{voice.seconds}s</span>
                <button type="button" onClick={async () => { const blob = await voice.stop(); if (!blob) return; setSendingVoice(true); const err = await sendVoice(profile.id, blob, voice.seconds); setSendingVoice(false); setVoiceErr(err); force((x) => x + 1); }} aria-label="Envoyer le vocal" className="rounded-lg bg-red-600 px-3 py-2 text-white">
                  <Square className="h-5 w-5" />
                </button>
                <button type="button" onClick={voice.cancel} aria-label="Annuler le vocal" className="rounded-lg border border-border px-2 py-2 text-[#777]">
                  <X className="h-5 w-5" />
                </button>
              </span>
            ) : (
              <button type="button" disabled={sendingVoice} onClick={async () => setVoiceErr(await voice.start())} aria-label="Enregistrer un vocal" className="rounded-lg border border-border px-3 py-2 text-[#e91e63] disabled:opacity-40">
                <Mic className="h-5 w-5" />
              </button>
            )
          )}
          <button type="submit" disabled={!draft.trim()} className="rounded-lg bg-[#e91e63] px-5 py-2 font-medium text-white disabled:opacity-40">
            Envoyer
          </button>
        </form>
        {voiceErr && <p className="pt-1 text-xs text-red-600">{voiceErr}</p>}
        {sendingVoice && <p className="pt-1 text-xs text-[#777]">Envoi du vocal…</p>}
        <Link to="/messagerie" onClick={() => { try { sessionStorage.setItem("swivv-active-chat", profile.id); } catch {} }} className="mt-2 text-center text-sm text-[#e91e63] hover:underline">
          Tout l&apos;historique dans Messages
        </Link>
        {voiceReport !== null && (
          <div role="dialog" aria-modal="true" aria-label="Signaler ce vocal" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" onClick={() => { setVoiceReport(null); setReportReason(""); }}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
              <p className="font-medium text-[#333]">Signaler ce vocal ?</p>
              <p className="mt-1 text-sm text-[#777]">Choisis le motif — la modération l&apos;examinera.</p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                aria-label="Motif du signalement"
                className="mt-3 w-full rounded-md border border-border px-3 py-2.5 text-sm"
              >
                <option value="">Choisir un motif…</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  disabled={!reportReason}
                  onClick={async () => {
                    const me = await getSwivvUser();
                    void sendFeedback({ msg_id: voiceReport, kind: "report", detail: `Vocal : ${reportReason}`, reactor: me?.name });
                    logModReport({ target: profile.id, by: me?.email ?? "", at: new Date().toISOString(), detail: `Vocal : ${reportReason}` });
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
