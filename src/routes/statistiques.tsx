import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRawProfile, openAuthModal, profileCompleteness, SwivvAuthButtons } from "@/lib/swivv-auth";
import { mediaUrl, toggleBlock } from "@/lib/swivv-store";
import { breakdown, creationsByDay, modeReaction, REACTIONS, topPhoto, type ActiveReaction, type ReactionEvent } from "@/lib/swivv-reactions";
import { SwivvSettingsTabs } from "@/components/swivv-settings-tabs";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";
import { useAuth } from "@/hooks/use-auth";
import type { SwivvProfile } from "@/lib/swivv-data";

export const Route = createFileRoute("/statistiques")({
  head: () => ({ meta: [{ title: "Mes statistiques — SWIVV" }] }),
  component: StatsPage,
});

// ponytail: client-side aggregation capped at 1000 rows/table (no new backend) — server-side rollups if power users ever outgrow the caps
const CAP = 1000;
const UUID = /^[0-9a-f-]{36}$/i;
const DAY = 864e5;
const PERIODS = [
  { days: 7, label: "7 derniers jours" },
  { days: 30, label: "30 derniers jours" },
  { days: 90, label: "90 derniers jours" },
  { days: 0, label: "Depuis mon inscription" },
] as const;

const FIELD_LABELS: Record<string, string> = {
  name: "Nom", birthdate: "Date de naissance", gender: "Genre", seeking: "Recherche", city: "Ville", country: "Pays",
  lookingFor: "Type de relation recherché", maritalStatus: "Situation matrimoniale", tagline: "Titre du profil", bio: "Présentation",
  heightCm: "Taille", weightKg: "Poids", hairColor: "Couleur de cheveux", eyeColor: "Couleur des yeux", bodyStyle: "Silhouette",
  ethnicity: "Origine", selfAppearance: "Style", bestFeature: "Atout", occupation: "Profession", education: "Études",
  drink: "Alcool", smoke: "Tabac", drugs: "Drogues", eatingHabits: "Alimentation", employmentStatus: "Emploi",
  annualIncome: "Revenus", livingSituation: "Logement", willingToRelocate: "Mobilité", hasPets: "Animaux",
  wantsMorePets: "Autres animaux souhaités", haveChildren: "Enfants", wantMoreChildren: "Autres enfants souhaités",
  brothersCount: "Frères", sistersCount: "Sœurs", birthRank: "Rang dans la fratrie", parentsMaritalStatus: "Situation des parents",
  nationality: "Nationalité", firstLanguage: "Langue maternelle", bornOrConverted: "Parcours religieux", religion: "Religion",
  religiousValues: "Valeurs religieuses", familyValues: "Valeurs familiales", interests: "Centres d'intérêt", photos: "Photos",
};
const REPORT_STATUS: Record<string, string> = {
  new: "Reçu", investigating: "En cours d'examen", waiting: "En attente", resolved: "Résolu", dismissed: "Classé sans suite",
};
const GENERIC_TAGLINES = ["salut", "coucou", "hello", "hey", "je cherche", "cherche quelqu", "a decouvrir", "à découvrir", "femme cherche", "homme cherche"];

type Peer = { id: string; name: string; photo?: string; blocked: boolean };
type Ev = { at: number; id: string };
type ViewEv = Ev & { viewer: string };
type LikeEv = Ev & { other: string };
type MatchEv = Ev & { other: string };

const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const fmtDT = (ts: number) => new Date(ts).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function deltaText(cur: number, prev: number): string | null {
  if (prev <= 0) return cur > 0 ? "Première activité sur la période." : null;
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return "Stable par rapport à la période précédente.";
  return `${pct > 0 ? "+" : ""}${pct} % par rapport à la période précédente.`;
}

function Bars({ a, b, days }: { a: number[]; b: number[]; days: number }) {
  const max = Math.max(1, ...a, ...b);
  return (
    <div role="img" aria-label={`Visites et likes reçus par jour sur les ${days} derniers jours`}>
      <div className="flex h-28 items-end gap-[3px]">
        {a.map((v, i) => (
          <span key={i} className="flex flex-1 items-end justify-center gap-[2px]">
            <span className="w-full rounded-sm bg-[#e91e63]/70" style={{ height: `${Math.max(v > 0 ? 6 : 1, (v / max) * 100)}%` }} title={`${v} visites`} />
            <span className="w-full rounded-sm bg-[#16A34A]/70" style={{ height: `${Math.max(b[i] > 0 ? 6 : 1, (b[i] / max) * 100)}%` }} title={`${b[i]} likes`} />
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-[#777]">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#e91e63]/70" />Visites</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#16A34A]/70" />Likes reçus</span>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-2xl font-semibold text-[#333]">{value}</p>
      <p className="mt-1 text-sm font-medium text-[#555]">{label}</p>
      {sub ? <p className="mt-1 text-xs text-[#777]">{sub}</p> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-border bg-white p-4 sm:p-5">
      <h2 className="text-base font-semibold text-[#333]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const emptyState = "Continuez à compléter votre profil et à découvrir les autres membres. Vos statistiques apparaîtront ici au fur et à mesure de votre activité.";

function StatsPage() {
  const { user, loading } = useAuth();
  const [period, setPeriod] = useState<number>(30);
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<null | {
    profile: SwivvProfile | null;
    views: ViewEv[]; likesSent: LikeEv[]; likesGot: LikeEv[]; matches: MatchEv[];
    chats: { peer: string; sender: string; voice: boolean; attach: boolean; at: number }[];
    reports: { id: string; category: string; at: number; status: string }[];
    blocks: { id: string; at: number }[];
    reactActive: ActiveReaction[];
    reactEvents: ReactionEvent[];
    peers: Record<string, Peer>;
  }>(null);
  const [failed, setFailed] = useState(false);
  const [histType, setHistType] = useState("all");
  const [histQ, setHistQ] = useState("");
  const [histN, setHistN] = useState(20);
  const [photoSort, setPhotoSort] = useState("top");

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      try {
        const uid = user.id;
        const db = supabase as any;
        const [prof, v, ls, lg, m, c, r, b, ra, re] = await Promise.all([
          getMyRawProfile(),
          db.from("swivv_profile_views").select("viewer_id,created_at").eq("viewed_id", uid).order("created_at", { ascending: false }).limit(CAP),
          db.from("swivv_likes").select("liked_id,created_at").eq("liker_id", uid).order("created_at", { ascending: false }).limit(CAP),
          db.from("swivv_likes").select("liker_id,created_at").eq("liked_id", uid).order("created_at", { ascending: false }).limit(CAP),
          db.from("swivv_matches").select("user_a,user_b,created_at").or(`user_a.eq.${uid},user_b.eq.${uid}`).order("created_at", { ascending: false }).limit(CAP),
          // ponytail: counts + flags only — message bodies and file URLs are never selected into analytics
          db.from("swivv_chats").select("peer_id,sender,audio_url,image_url,created_at").eq("user_id", uid).order("created_at", { ascending: true }).limit(CAP * 2),
          db.from("swivv_reports").select("id,category,created_at,status").eq("reporter_id", uid).order("created_at", { ascending: false }).limit(CAP),
          db.from("swivv_blocks").select("blocked_id,created_at").eq("blocker_id", uid).order("created_at", { ascending: false }).limit(CAP),
          // ponytail: 200-row cap is bytes, not stinginess — photos are ~750KB data URLs and 1000 rows would pull ~750MB; server-side aggregates if reaction volume ever needs the full tail
          db.from("swivv_photo_reactions").select("photo,reaction,reactor_id,created_at,updated_at").eq("owner_id", uid).order("updated_at", { ascending: false }).limit(200),
          db.from("swivv_photo_reaction_events").select("photo,event,reaction,reactor_id,created_at").eq("owner_id", uid).order("created_at", { ascending: false }).limit(200),
        ]);
        const views: ViewEv[] = (v.data ?? []).map((x: any) => ({ viewer: String(x.viewer_id), at: Date.parse(x.created_at) || 0 }));
        const likesSent: LikeEv[] = (ls.data ?? []).map((x: any) => ({ other: String(x.liked_id), at: Date.parse(x.created_at) || 0 }));
        const likesGot: LikeEv[] = (lg.data ?? []).map((x: any) => ({ other: String(x.liker_id), at: Date.parse(x.created_at) || 0 }));
        const matches: MatchEv[] = (m.data ?? []).map((x: any) => ({ other: String(x.user_a) === uid ? String(x.user_b) : String(x.user_a), at: Date.parse(x.created_at) || 0 }));
        const chats = (c.data ?? []).map((x: any) => ({ peer: String(x.peer_id), sender: String(x.sender), voice: !!x.audio_url, attach: !!x.image_url, at: Date.parse(x.created_at) || 0 }));
        const reports = (r.data ?? []).map((x: any) => ({ id: String(x.id), category: String(x.category ?? "Autre"), at: Date.parse(x.created_at) || 0, status: String(x.status ?? "new") }));
        const blocks = (b.data ?? []).map((x: any) => ({ id: String(x.blocked_id), at: Date.parse(x.created_at) || 0 }));
        // ponytail: join against the photos I actually own — forged/deleted-photo rows never reach the stats; « récent/ancien » below means latest/earliest reaction activity (per-photo upload dates don't exist)
        const owned = new Set(((prof as SwivvProfile | null)?.photos ?? []) as string[]);
        const reactActive: ActiveReaction[] = (ra.data ?? [])
          .filter((x: any) => owned.has(String(x.photo)))
          .map((x: any) => ({ photo: String(x.photo), reaction: String(x.reaction) as ActiveReaction["reaction"], reactor: String(x.reactor_id), at: Date.parse(x.created_at) || 0, updated: Date.parse(x.updated_at) || 0 }));
        const reactEvents: ReactionEvent[] = (re.data ?? [])
          .filter((x: any) => owned.has(String(x.photo)))
          .map((x: any) => ({ photo: String(x.photo), event: x.event as ReactionEvent["event"], reaction: (x.reaction ?? null) as ReactionEvent["reaction"], reactor: String(x.reactor_id), at: Date.parse(x.created_at) || 0 }));
        const ids = [...new Set([...views.map((x) => x.viewer), ...likesSent.map((x) => x.other), ...likesGot.map((x) => x.other), ...matches.map((x) => x.other)])]
          .filter((id) => UUID.test(id)).slice(0, 200);
        const peers: Record<string, Peer> = {};
        if (ids.length) {
          const pr = await db.from("swivv_profiles").select("user_id,data").in("user_id", ids);
          for (const row of pr.data ?? []) {
            const d = (row.data ?? {}) as SwivvProfile;
            peers[String(row.user_id)] = { id: String(row.user_id), name: d.name || "Membre", photo: mediaUrl(d.photos?.[0]), blocked: false };
          }
        }
        const blockedSet = new Set(blocks.map((x: { id: string }) => x.id));
        for (const id of Object.keys(peers)) peers[id].blocked = blockedSet.has(id);
        if (live) setData({ profile: prof, views, likesSent, likesGot, matches, chats, reports, blocks, reactActive, reactEvents, peers });
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const now = Date.now();
  const cut = period === 0 ? 0 : now - period * DAY;
  const prevCut = period === 0 ? 0 : cut - period * DAY;
  const inP = (at: number) => at >= cut;
  const inPrev = (at: number) => period !== 0 && at >= prevCut && at < cut;

  const s = useMemo(() => {
    if (!data) return null;
    const viewsP = data.views.filter((x) => inP(x.at));
    const viewsPrev = data.views.filter((x) => inPrev(x.at));
    const gotP = data.likesGot.filter((x) => inP(x.at));
    const gotPrev = data.likesGot.filter((x) => inPrev(x.at));
    const sentP = data.likesSent.filter((x) => inP(x.at));
    const matchesP = data.matches.filter((x) => inP(x.at));
    const uniqViewers = new Set(viewsP.map((x) => x.viewer)).size;
    // ponytail: dedup = distinct viewers shown next to raw totals (repeat refreshes stay visible as history, not as reach)
    const convos = new Map<string, { sent: number; got: number; voiceS: number; voiceG: number; attS: number; attG: number; first: number; last: number }>();
    for (const m of data.chats) {
      let g = convos.get(m.peer);
      if (!g) { g = { sent: 0, got: 0, voiceS: 0, voiceG: 0, attS: 0, attG: 0, first: m.at, last: m.at }; convos.set(m.peer, g); }
      if (m.sender === "me") { g.sent++; if (m.voice) g.voiceS++; if (m.attach) g.attS++; }
      else { g.got++; if (m.voice) g.voiceG++; if (m.attach) g.attG++; }
      g.first = Math.min(g.first, m.at); g.last = Math.max(g.last, m.at);
    }
    const convoList = [...convos.entries()].map(([peer, g]) => ({ peer, ...g, replied: g.sent > 0 && g.got > 0, started: g.first >= cut }));
    const startedP = convoList.filter((g) => g.started && g.sent > 0);
    const repliedP = startedP.filter((g) => g.got > 0);
    const withReply = convoList.filter((g) => g.replied);
    const inactive = period === 0 ? [] : convoList.filter((g) => g.last < cut && g.first < cut);
    const totSent = data.chats.filter((m) => m.sender === "me").length;
    const totGot = data.chats.filter((m) => m.sender !== "me").length;
    const voiceS = data.chats.filter((m) => m.sender === "me" && m.voice).length;
    const voiceG = data.chats.filter((m) => m.sender !== "me" && m.voice).length;
    const attS = data.chats.filter((m) => m.sender === "me" && m.attach).length;
    const attG = data.chats.filter((m) => m.sender !== "me" && m.attach).length;
    const chartDays = period === 0 ? 30 : period;
    const av = new Array(chartDays).fill(0); const al = new Array(chartDays).fill(0);
    for (const x of data.views) { const d = Math.floor((now - x.at) / DAY); if (d >= 0 && d < chartDays) av[chartDays - 1 - d]++; }
    for (const x of data.likesGot) { const d = Math.floor((now - x.at) / DAY); if (d >= 0 && d < chartDays) al[chartDays - 1 - d]++; }
    // --- photo reactions (active = current rows; period = created/changed events in window) ---
    const reP = data.reactEvents.filter((x) => inP(x.at) && x.event !== "removed");
    const rePrev = data.reactEvents.filter((x) => inPrev(x.at) && x.event !== "removed");
    const newP = data.reactEvents.filter((x) => inP(x.at) && x.event === "created");
    const newPrev = data.reactEvents.filter((x) => inPrev(x.at) && x.event === "created");
    const reactorsP = new Set(reP.map((x) => x.reactor));
    const reactorsPrev = new Set(rePrev.map((x) => x.reactor));
    const photosP = new Set(reP.map((x) => x.photo));
    const firstSeen: Record<string, number> = {};
    for (const x of data.reactEvents) {
      if (firstSeen[x.photo] == null || x.at < firstSeen[x.photo]) firstSeen[x.photo] = x.at;
    }
    const lastAct: Record<string, number> = {};
    for (const x of data.reactEvents) {
      if (lastAct[x.photo] == null || x.at > lastAct[x.photo]) lastAct[x.photo] = x.at;
    }
    const byPhoto = new Map<string, ActiveReaction[]>();
    for (const x of data.reactActive) byPhoto.set(x.photo, [...(byPhoto.get(x.photo) ?? []), x]);
    const photoPerf = [...byPhoto.entries()].map(([photo, rows]) => ({
      photo,
      n: rows.length,
      reactors: new Set(rows.map((x) => x.reactor)).size,
      top: modeReaction(rows),
      last: lastAct[photo] ?? 0,
    }));
    const reactTop = topPhoto(data.reactActive, firstSeen);
    const reactChart = creationsByDay(data.reactEvents, chartDays, now);
    return {
      viewsP, viewsPrev, gotP, gotPrev, sentP, matchesP, uniqViewers, convoList, startedP, repliedP, withReply, inactive,
      totSent, totGot, voiceS, voiceG, attS, attG, chartDays, av, al,
      reP, rePrev, newP, newPrev, reactorsP, reactorsPrev, photosP, photoPerf, reactTop, reactChart,
      reactTotal: data.reactActive.length, reactBreak: breakdown(data.reactActive),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, period]);

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2 sm:py-1">
            <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
            <SwivvAuthButtons />
          </div>
        </header>
        <SwivvCategoryNav />
        <main className="mx-auto max-w-2xl px-4 py-8 text-center">
          <p className="text-sm text-[#777]">Connecte-toi pour voir tes statistiques.</p>
          <button type="button" onClick={() => openAuthModal("account", "signin")} className="mt-4 rounded-md bg-[#e91e63] px-6 py-3 font-medium text-white">
            Se connecter / S&apos;inscrire
          </button>
        </main>
        <SwivvFooter />
      </div>
    );
  }

  const peerName = (id: string) => data?.peers[id]?.name ?? "Membre supprimé";
  const TABS = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "profil", label: "Mon profil" },
    { id: "likes", label: "Likes et interactions" },
    { id: "messages", label: "Messages et conversations" },
    { id: "visibilite", label: "Visibilité et progression" },
    { id: "securite", label: "Sécurité et confidentialité" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-medium text-[#333]">Mes statistiques</h1>
        <SwivvSettingsTabs />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor="stats-period" className="text-sm text-[#555]">Période :</label>
          <select id="stats-period" value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="rounded-md border border-border bg-white px-3 py-2 text-sm">
            {PERIODS.map((p) => (<option key={p.label} value={p.days}>{p.label}</option>))}
          </select>
        </div>
        <div role="tablist" aria-label="Sections des statistiques" className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${tab === t.id ? "border-[#e91e63] bg-[#e91e63] text-white" : "border-border bg-white text-[#555] hover:text-[#e91e63]"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {failed && (
          <div className="mt-6 rounded-xl border border-border bg-white p-4 text-sm text-[#555]">
            Impossible de charger vos statistiques. <button type="button" onClick={() => window.location.reload()} className="font-medium text-[#e91e63] hover:underline">Réessayer</button>
          </div>
        )}
        {!data && !failed && <p className="mt-6 text-sm text-[#777]">Chargement de vos statistiques…</p>}

        {data && s && tab === "overview" && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Visites de profil" value={s.viewsP.length} sub={period === 0 ? `${s.uniqViewers} visiteurs uniques` : (deltaText(s.viewsP.length, s.viewsPrev.length) ?? `${s.uniqViewers} visiteurs uniques`)} />
              <Kpi label="Likes reçus" value={s.gotP.length} sub={period === 0 ? undefined : (deltaText(s.gotP.length, s.gotPrev.length) ?? undefined)} />
              <Kpi label="Matches" value={data.matches.length} sub={period === 0 ? undefined : `${s.matchesP.length} nouveaux sur la période`} />
              <Kpi label="Conversations" value={s.convoList.length} sub={period === 0 ? `${s.withReply.length} avec réponse` : `${s.startedP.length} commencées · ${s.repliedP.length} avec réponse`} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Likes envoyés" value={period === 0 ? data.likesSent.length : s.sentP.length} />
              <Kpi label="Messages envoyés / reçus" value={`${s.totSent} / ${s.totGot}`} />
              <Kpi label="Vocaux envoyés / reçus" value={`${s.voiceS} / ${s.voiceG}`} />
              <Kpi label="Signalements / Blocs" value={`${data.reports.length} / ${data.blocks.length}`} />
            </div>
            <Section title="Activité récente">
              <div className="flex flex-wrap gap-2">
                <select aria-label="Type d'activité" value={histType} onChange={(e) => { setHistType(e.target.value); setHistN(20); }} className="rounded-md border border-border bg-white px-3 py-2 text-sm">
                  <option value="all">Tout</option><option value="view">Visites</option><option value="sent">Likes envoyés</option>
                  <option value="got">Likes reçus</option><option value="match">Matches</option>
                </select>
                <input value={histQ} onChange={(e) => { setHistQ(e.target.value); setHistN(20); }} placeholder="Rechercher un membre…" aria-label="Rechercher un membre" className="rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <HistoryList data={data} histType={histType} histQ={histQ} histN={histN} peerName={peerName} />
              <button type="button" onClick={() => setHistN((n) => n + 20)} className="mt-3 text-sm font-medium text-[#e91e63] hover:underline">Afficher plus</button>
            </Section>
          </>
        )}

        {data && s && tab === "profil" && <ProfileTab profile={data.profile} views={s.viewsP.length} got={s.gotP.length} convos={s.convoList.length} />}

        {data && s && tab === "likes" && (
          <>
            <Section title="Likes et interactions">
              <p className="text-sm text-[#555]">
                {data.likesSent.length} envoyés · {data.likesGot.length} reçus · {data.matches.length} matches mutuels.
                {data.likesSent.length > 0 && ` ${data.matches.length} de vos likes sont devenus des matches.`}
              </p>
              {data.matches.length === 0 && data.likesGot.length === 0 && <p className="mt-2 text-sm text-[#777]">{emptyState}</p>}
            </Section>
            <LikeList title="Likes reçus" list={data.likesGot} data={data} peerName={peerName} dir="got" />
            <LikeList title="Likes envoyés" list={data.likesSent} data={data} peerName={peerName} dir="sent" />
            <LikeList title="Matches mutuels" list={data.matches} data={data} peerName={peerName} dir="match" match />
            <PhotoReactions s={s} period={period} photoSort={photoSort} setPhotoSort={setPhotoSort} />
          </>
        )}

        {data && s && tab === "messages" && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Messages envoyés" value={s.totSent} />
              <Kpi label="Messages reçus" value={s.totGot} />
              <Kpi label="Vocaux envoyés / reçus" value={`${s.voiceS} / ${s.voiceG}`} />
              <Kpi label="Photos envoyées / reçues" value={`${s.attS} / ${s.attG}`} />
            </div>
            <Section title="Taux de réponse">
              {s.startedP.length < 5 ? (
                <p className="text-sm text-[#777]">Échantillon trop petit pour un taux fiable ({s.startedP.length} conversation{s.startedP.length > 1 ? "s" : ""} commencée{s.startedP.length > 1 ? "s" : ""} sur la période). Les chiffres ci-dessous restent indicatifs.</p>
              ) : (
                <p className="text-sm text-[#555]">{s.repliedP.length} de vos {s.startedP.length} conversations commencées ont reçu une réponse ({Math.round((s.repliedP.length / s.startedP.length) * 100)} %). Le volume de messages ne mesure pas la compatibilité.</p>
              )}
              <p className="mt-2 text-sm text-[#555]">
                {s.convoList.length} correspondant{s.convoList.length > 1 ? "s" : ""} distinct{s.convoList.length > 1 ? "s" : ""} · en moyenne {s.convoList.length ? ((s.totSent + s.totGot) / s.convoList.length).toFixed(1) : "0"} messages échangés par conversation (envoyés + reçus).
                {s.inactive.length > 0 && ` ${s.inactive.length} conversation${s.inactive.length > 1 ? "s" : ""} sans activité récente.`}
              </p>
            </Section>
            <Section title="Conversations">
              {s.convoList.length === 0 ? <p className="text-sm text-[#777]">{emptyState}</p> : (
                <ul className="divide-y divide-border">
                  {[...s.convoList].sort((x, y) => y.last - x.last).slice(0, 50).map((g) => (
                    <li key={g.peer} className="flex items-center gap-3 py-2.5">
                      <PeerBadge id={g.peer} data={data} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#333]">{peerName(g.peer)}</p>
                        <p className="text-xs text-[#777]">{g.sent} envoyés · {g.got} reçus{g.voiceS + g.voiceG > 0 && ` · ${g.voiceS + g.voiceG} vocaux`}{g.attS + g.attG > 0 && ` · ${g.attS + g.attG} photos`} · {g.replied ? "avec réponse" : "sans réponse"}</p>
                        <p className="text-xs text-[#999]">Dernière activité : {fmtDT(g.last)}</p>
                      </div>
                      <Link to="/messagerie" className="shrink-0 text-sm font-medium text-[#e91e63] hover:underline">Ouvrir</Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        )}

        {data && s && tab === "visibilite" && (
          <>
            <Section title={`Visibilité — ${period === 0 ? "30 derniers jours" : PERIODS.find((p) => p.days === period)?.label}`}>
              <Bars a={s.av} b={s.al} days={s.chartDays} />
              <p className="mt-3 text-sm text-[#555]">
                Cette semaine sur SWIVV MATCH : {s.viewsP.length} visites de profil · {s.gotP.length} likes reçus · {s.matchesP.length} nouveaux matches · {s.startedP.length} nouvelles conversations.
              </p>
              {(s.viewsP.length + s.gotP.length + s.matchesP.length + s.startedP.length) === 0 && <p className="mt-2 text-sm text-[#777]">{emptyState}</p>}
            </Section>
            <Section title="Visiteurs récents">
              {s.viewsP.length === 0 ? <p className="text-sm text-[#777]">{emptyState}</p> : (
                <ul className="divide-y divide-border">
                  {s.viewsP.slice(0, 30).map((x, i) => (
                    <li key={`${x.viewer}-${x.at}-${i}`} className="flex items-center gap-3 py-2.5">
                      <PeerBadge id={x.viewer} data={data} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#333]">{peerName(x.viewer)}</p>
                        <p className="text-xs text-[#999]">{fmtDT(x.at)}</p>
                      </div>
                      {!data.peers[x.viewer]?.blocked && UUID.test(x.viewer) && (
                        <Link to="/member/$id" params={{ id: x.viewer }} className="shrink-0 text-sm font-medium text-[#e91e63] hover:underline">Voir le profil</Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        )}

        {data && tab === "securite" && (
          <>
            <Section title="Mes signalements">
              {data.reports.length === 0 ? <p className="text-sm text-[#777]">Vous n&apos;avez soumis aucun signalement.</p> : (
                <ul className="divide-y divide-border">
                  {data.reports.map((r) => (
                    <li key={r.id} className="py-2.5 text-sm">
                      <p className="font-medium text-[#333]">{r.category}</p>
                      <p className="text-xs text-[#777]">{fmtDate(r.at)} · Statut : {REPORT_STATUS[r.status] ?? r.status}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section title="Mes blocs">
              {data.blocks.length === 0 ? <p className="text-sm text-[#777]">Vous n&apos;avez bloqué aucun membre.</p> : (
                <ul className="divide-y divide-border">
                  {data.blocks.map((bl) => (
                    <li key={bl.id} className="flex items-center gap-3 py-2.5">
                      <PeerBadge id={bl.id} data={data} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#333]">{peerName(bl.id)}</p>
                        <p className="text-xs text-[#777]">{fmtDate(bl.at)} · Actif</p>
                      </div>
                      <button type="button" onClick={() => { toggleBlock(bl.id); data.blocks = data.blocks.filter((x) => x.id !== bl.id); setData({ ...data }); }} className="shrink-0 text-sm font-medium text-[#e91e63] hover:underline">
                        Débloquer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        )}
      </main>
      <SwivvFooter />
    </div>
  );
}

function PeerBadge({ id, data }: { id: string; data: { peers: Record<string, Peer> } }) {
  const p = data.peers[id];
  const photo = p?.photo;
  return photo ? (
    <img src={photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" loading="lazy" />
  ) : (
    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fce4ec] text-sm font-semibold text-[#e91e63]">
      {(p?.name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

function HistoryList({ data, histType, histQ, histN, peerName }: {
  data: { views: ViewEv[]; likesSent: LikeEv[]; likesGot: LikeEv[]; matches: MatchEv[]; peers: Record<string, Peer> };
  histType: string; histQ: string; histN: number; peerName: (id: string) => string;
}) {
  const q = histQ.trim().toLowerCase();
  const all: { at: number; label: string; id: string; key: string }[] = [
    ...(histType === "all" || histType === "view" ? data.views.map((x, i) => ({ at: x.at, label: "Visite de profil", id: x.viewer, key: `v${i}` })) : []),
    ...(histType === "all" || histType === "sent" ? data.likesSent.map((x, i) => ({ at: x.at, label: "Like envoyé", id: x.other, key: `s${i}` })) : []),
    ...(histType === "all" || histType === "got" ? data.likesGot.map((x, i) => ({ at: x.at, label: "Like reçu", id: x.other, key: `g${i}` })) : []),
    ...(histType === "all" || histType === "match" ? data.matches.map((x, i) => ({ at: x.at, label: "Match mutuel", id: x.other, key: `m${i}` })) : []),
  ].filter((e) => !q || peerName(e.id).toLowerCase().includes(q))
    .sort((x, y) => y.at - x.at).slice(0, histN);
  if (!all.length) return <p className="mt-2 text-sm text-[#777]">Aucune activité pour ce filtre.</p>;
  return (
    <ul className="mt-2 divide-y divide-border">
      {all.map((e) => (
        <li key={e.key} className="flex items-center gap-3 py-2">
          <PeerBadge id={e.id} data={data} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-[#333]"><span className="font-medium">{e.label}</span> — {peerName(e.id)}</p>
            <p className="text-xs text-[#999]">{fmtDT(e.at)}</p>
          </div>
          {!data.peers[e.id]?.blocked && UUID.test(e.id) && (
            <Link to="/member/$id" params={{ id: e.id }} className="shrink-0 text-sm font-medium text-[#e91e63] hover:underline">Voir</Link>
          )}
        </li>
      ))}
    </ul>
  );
}

type PhotoPerf = { photo: string; n: number; reactors: number; top: string | null; last: number };
type ReactBreak = { id: string; emoji: string; label: string; n: number; pct: number };
type ReactSummary = {
  reactTotal: number; newP: { length: number }; newPrev: { length: number };
  reactorsP: Set<string>; reactorsPrev: Set<string>; photosP: Set<string>;
  reactTop: string | null; reactBreak: ReactBreak[]; reactChart: number[]; chartDays: number;
  photoPerf: PhotoPerf[];
};

function PhotoReactions({ s, period, photoSort, setPhotoSort }: {
  s: ReactSummary; period: number; photoSort: string; setPhotoSort: (v: string) => void;
}) {
  const empty = s.reactTotal === 0 && s.newP.length === 0;
  const top = s.photoPerf.find((x) => x.photo === s.reactTop);
  const sorted = [...s.photoPerf].sort((a, b) =>
    photoSort === "recent" ? b.last - a.last : photoSort === "oldest" ? a.last - b.last : b.n - a.n || b.last - a.last,
  );
  const max = Math.max(1, ...s.reactChart);
  const emojiOf = (id: string | null) => REACTIONS.find((r) => r.id === id);
  return (
    <>
      <Section title="Interactions sur mes photos">
        <p className="text-sm text-[#555]">
          {s.reactTotal} réaction{s.reactTotal > 1 ? "s" : ""} active{s.reactTotal > 1 ? "s" : ""} en ce moment
          {period !== 0 && ` · ${s.newP.length} nouvelle${s.newP.length > 1 ? "s" : ""} sur la période`}.
        </p>
        {empty ? (
          <p className="mt-2 text-sm text-[#777]">{emptyState}</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Réactions reçues" value={s.reactTotal} sub={period === 0 ? "actives en ce moment" : (deltaText(s.newP.length, s.newPrev.length) ?? "sur la période")} />
              <Kpi label="Membres ayant réagi" value={s.reactorsP.size} sub={period === 0 ? "au total" : (deltaText(s.reactorsP.size, s.reactorsPrev.size) ?? "sur la période")} />
              <Kpi label="Photos avec réactions" value={s.photosP.size} sub={period === 0 ? "au total" : "sur la période"} />
              <div className="rounded-xl border border-border bg-white p-4">
                {top ? (
                  <span className="flex items-center gap-3">
                    <img src={mediaUrl(top.photo)} alt="" loading="lazy" className="h-12 w-12 rounded-lg object-cover" />
                    <span>
                      <span className="block text-2xl font-semibold text-[#333]">{top.n}</span>
                      <span className="mt-1 block text-sm font-medium text-[#555]">Photo la plus réactive</span>
                    </span>
                  </span>
                ) : (
                  <>
                    <p className="text-2xl font-semibold text-[#333]">—</p>
                    <p className="mt-1 text-sm font-medium text-[#555]">Photo la plus réactive</p>
                  </>
                )}
              </div>
            </div>
            <h3 className="mt-5 text-sm font-semibold text-[#333]">Répartition des réactions actives</h3>
            <ul className="mt-2 space-y-2">
              {s.reactBreak.map((b) => (
                <li key={b.id} className="flex items-center gap-2 text-sm">
                  <span aria-hidden="true" className="w-6 text-center text-lg leading-none">{b.emoji}</span>
                  <span className="w-32 shrink-0 truncate text-[#555]">{b.label}</span>
                  <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#f0f0f0]">
                    <span className="block h-full rounded-full bg-[#e91e63]/70" style={{ width: `${b.pct}%` }} />
                  </span>
                  <span className="w-20 shrink-0 text-right text-[#333]">{b.n} · {b.pct} %</span>
                </li>
              ))}
            </ul>
            <h3 className="mt-5 text-sm font-semibold text-[#333]">Nouvelles réactions par jour</h3>
            <div role="img" aria-label={`Nouvelles réactions par jour sur les ${s.chartDays} derniers jours`} className="mt-2 flex h-20 items-end gap-[3px]">
              {s.reactChart.map((v, i) => (
                <span key={i} className="w-full rounded-sm bg-[#e91e63]/70" style={{ height: `${Math.max(v > 0 ? 8 : 2, (v / max) * 100)}%` }} title={`${v} nouvelles réactions`} />
              ))}
            </div>
          </>
        )}
      </Section>
      {!empty && (
        <Section title="Performance de mes photos">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="photo-sort" className="text-sm text-[#555]">Trier :</label>
            <select id="photo-sort" value={photoSort} onChange={(e) => setPhotoSort(e.target.value)} className="rounded-md border border-border bg-white px-3 py-2 text-sm">
              <option value="top">Plus de réactions</option>
              <option value="recent">Activité récente</option>
              <option value="oldest">Activité ancienne</option>
            </select>
          </div>
          <p className="mt-2 text-xs text-[#777]">« Récent / ancien » = dernière réaction reçue (les dates d&apos;ajout par photo ne sont pas suivies).</p>
          <ul className="mt-2 divide-y divide-border">
            {sorted.slice(0, 50).map((x) => {
              const t = emojiOf(x.top);
              return (
                <li key={x.photo} className="flex items-center gap-3 py-2.5">
                  <img src={mediaUrl(x.photo)} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#333]">{x.n} réaction{x.n > 1 ? "s" : ""} · {x.reactors} membre{x.reactors > 1 ? "s" : ""}</p>
                    <p className="text-xs text-[#777]">
                      {t ? `${t.emoji} ${t.label} en tête` : "Aucune réaction active"} · Dernière activité : {x.last ? fmtDT(x.last) : "—"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </>
  );
}

function LikeList({ title, list, data, peerName, dir, match }: {
  title: string; list: LikeEv[] | MatchEv[]; data: { peers: Record<string, Peer> }; peerName: (id: string) => string; dir: string; match?: boolean;
}) {  return (
    <Section title={`${title} (${list.length})`}>
      {list.length === 0 ? <p className="text-sm text-[#777]">Rien ici pour le moment.</p> : (
        <ul className="divide-y divide-border">
          {list.slice(0, 50).map((x, i) => (
            <li key={`${dir}-${i}`} className="flex items-center gap-3 py-2.5">
              <PeerBadge id={x.other} data={data} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#333]">{peerName(x.other)}</p>
                <p className="text-xs text-[#999]">{match ? "Match mutuel" : dir === "got" ? "Vous a liké" : "Vous avez liké"} · {fmtDT(x.at)}</p>
              </div>
              {!data.peers[x.other]?.blocked && UUID.test(x.other) && (
                <Link to="/member/$id" params={{ id: x.other }} className="shrink-0 text-sm font-medium text-[#e91e63] hover:underline">Voir le profil</Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function ProfileTab({ profile, views, got, convos }: { profile: SwivvProfile | null; views: number; got: number; convos: number }) {
  const pct = profileCompleteness(profile);
  const missing = (Object.keys(FIELD_LABELS) as (keyof SwivvProfile)[]).filter((k) => {
    const v = profile?.[k];
    if (v === undefined || v === null) return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "number") return !Number.isFinite(v);
    return !String(v).trim();
  });
  const tagline = String(profile?.tagline ?? "").trim();
  const bio = String(profile?.bio ?? "").trim();
  const photos = profile?.photos ?? [];
  const capsRatio = tagline ? (tagline.replace(/[^A-ZÀ-Þ]/g, "").length / tagline.length) : 0;
  const generic = GENERIC_TAGLINES.some((g) => tagline.toLowerCase().includes(g));

  type Tip = { level: "À compléter" | "Recommandé" | "Optionnel"; text: string; to: string; cta: string };
  // ponytail: profile-edit tips deep-link the missing-only pass (?revoir=manquantes) — a plain /inscription visit would restore the saved position instead of the first gap
  const FLOW = "/inscription?revoir=manquantes";
  const tips: Tip[] = [];
  if (!photos.length) tips.push({ level: "À compléter", text: "Vous n'avez pas de photo de profil. Ajoutez une photo claire et récente qui vous représente bien.", to: "/mon-profil", cta: "Ajouter une photo" });
  else if (photos.length === 1) tips.push({ level: "Recommandé", text: "Votre profil ne contient qu'une seule photo. Ajouter une photo supplémentaire pourrait donner une vision plus complète de votre profil.", to: "/mon-profil", cta: "Ajouter une photo" });
  if (!tagline) tips.push({ level: "À compléter", text: "Votre titre est vide. Une phrase distinctive aide les autres membres à vous remarquer.", to: FLOW, cta: "Modifier mon profil" });
  else if (tagline.length < 10 || generic) tips.push({ level: "Recommandé", text: `Votre titre (« ${tagline} ») est très court ou générique. Inspirez-vous de vos centres d'intérêt pour le rendre plus personnel — par exemple à partir de « ${(profile?.interests ?? []).slice(0, 2).join(", ") || "vos loisirs"} ». Ce n'est qu'une piste, à valider par vous.`, to: FLOW, cta: "Modifier mon profil" });
  else if (capsRatio > 0.7 && tagline.length > 5) tips.push({ level: "Optionnel", text: "Votre titre est presque tout en majuscules, ce qui peut donner une impression de cri. Envisagez une casse normale.", to: FLOW, cta: "Modifier mon profil" });
  if (!bio) tips.push({ level: "À compléter", text: "Votre section « À propos de moi » est vide. Ajoutez quelques phrases pour aider les autres membres à mieux vous connaître et à entamer la conversation.", to: FLOW, cta: "Compléter ma présentation" });
  else if (bio.length < 50) tips.push({ level: "Recommandé", text: "Votre présentation est très courte. Quelques phrases sur vos valeurs, vos loisirs ou vos intentions aideraient à démarrer des échanges.", to: FLOW, cta: "Compléter ma présentation" });
  else if (bio.length > 1500) tips.push({ level: "Optionnel", text: "Votre présentation est très longue. Une version plus concise a plus de chances d'être lue en entier.", to: FLOW, cta: "Modifier mon profil" });
  if (!(profile?.interests ?? []).length) tips.push({ level: "Recommandé", text: "Ajoutez vos centres d'intérêt : c'est le moyen le plus simple de donner aux autres une accroche pour vous écrire.", to: FLOW, cta: "Modifier mon profil" });
  if (views > 5 && got === 0) tips.push({ level: "Recommandé", text: "Vous recevez des visites, mais peu de likes. Pensez à vérifier votre photo principale et votre présentation. L'activité dépend aussi des préférences, de la localisation et du nombre de membres actifs.", to: "/mon-profil", cta: "Revoir mon profil" });
  if (convos > 0) tips.push({ level: "Optionnel", text: `Vous avez ${convos} conversation${convos > 1 ? "s" : ""} en cours. Continuez à privilégier les échanges qui vous intéressent réellement.`, to: "/messagerie", cta: "Voir mes messages" });

  return (
    <>
      <Section title="Complétude du profil">
        <div className="flex items-center gap-4">
          <p className="text-3xl font-semibold text-[#e91e63]">{pct} %</p>
          <p className="text-sm text-[#555]">Ce score mesure la complétude de votre profil, pas votre attractivité ni vos chances de rencontrer quelqu&apos;un.</p>
        </div>
        {missing.length > 0 ? (
          <p className="mt-2 text-sm text-[#555]">Sections incomplètes : {missing.slice(0, 12).map((k) => FIELD_LABELS[String(k)] ?? String(k)).join(", ")}{missing.length > 12 && ` (+${missing.length - 12} autres)`}.</p>
        ) : (
          <p className="mt-2 text-sm font-medium text-[#16A34A]">Profil complet, bravo !</p>
        )}
        {pct < 100 && (
          <a href="/inscription?revoir=manquantes" className="mt-3 inline-block rounded-md bg-[#e91e63] px-5 py-2.5 text-sm font-medium text-white">
            Complétez votre profil maintenant
          </a>
        )}
      </Section>
      <Section title="Comment améliorer mon profil ?">
        {tips.length === 0 ? <p className="text-sm text-[#777]">Rien à signaler : votre profil est bien rempli. Les suggestions apparaîtront ici si quelque chose manque.</p> : (
          <ul className="space-y-3">
            {tips.map((t, i) => (
              <li key={i} className="rounded-lg border border-border p-3">
                <p className={`text-xs font-semibold ${t.level === "À compléter" ? "text-[#DC2626]" : t.level === "Recommandé" ? "text-[#F97316]" : "text-[#777]"}`}>{t.level}</p>
                <p className="mt-1 text-sm text-[#333]">{t.text}</p>
                <a href={t.to} className="mt-2 inline-block text-sm font-medium text-[#e91e63] hover:underline">{t.cta}</a>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
