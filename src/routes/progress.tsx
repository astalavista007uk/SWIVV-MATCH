import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  CalendarCheck2,
  Eye,
  Flame,
  Heart,
  Lock,
  MessageCircle,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRawProfile, openAuthModal, SwivvAuthButtons } from "@/lib/swivv-auth";
import { getMatches } from "@/lib/swivv-store";
import {
  achievements,
  dayOrdinal,
  lastDays,
  nextProfileStep,
  periodStats,
  profileCompleteness,
  qualifyingDays,
  streak,
  weeklyReplies,
  type AchievementId,
  type ChatRow,
  type MatchRow,
} from "@/lib/swivv-progress";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvSettingsTabs } from "@/components/swivv-settings-tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import type { SwivvProfile } from "@/lib/swivv-data";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "SWIVV Progress — SWIVV MATCH" }] }),
  // ponytail: tab rides ?tab= like Mes statistiques — browser history restores the exact tab, unknown values fall back
  validateSearch: (s: Record<string, unknown>) => ({
    tab: TAB_IDS.includes(s.tab as string) ? (s.tab as string) : "progress",
  }),
  component: ProgressPage,
});

const TAB_IDS = ["progress", "achievements", "stats"];
const UUID = /^[0-9a-f-]{36}$/i;
// ponytail: same 1000-row client cap as Mes statistiques — server rollups if a member ever outgrows it
const CAP = 1000;
const SEEN_KEY = "swivv-progress-seen";
const PERIODS = [
  { days: 7, label: "7 derniers jours" },
  { days: 30, label: "30 derniers jours" },
] as const;

const ACHIEVEMENT_ICONS: Record<AchievementId, typeof BadgeCheck> = {
  ready: BadgeCheck,
  spark: Heart,
  starter: MessageCircle,
  twoWay: MessagesSquare,
  connector: CalendarCheck2,
  champion: ShieldCheck,
};

type Data = {
  profile: SwivvProfile | null;
  chats: ChatRow[];
  matches: MatchRow[];
  visits: number[];
};

const fmtDay = (at: number) =>
  new Date(at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const ordDate = (ord: number) => new Date(ord * 864e5);
const ordLabel = (ord: number) =>
  ordDate(ord).toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" });
const ordNum = (ord: number) =>
  ordDate(ord).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

function ProgressPage() {
  const { user, loading } = useAuth();
  const { tab } = Route.useSearch();
  const nav = Route.useNavigate();
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [period, setPeriod] = useState(7);

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped jsonb tables, same pattern as the other SWIVV pages
      const db = supabase as any;
      // ponytail: one parallel read, each query degrades to [] on failure — a broken optional metric never blanks the page
      const rows = <T,>(p: PromiseLike<{ data: unknown }>): Promise<T[]> =>
        Promise.resolve(p)
          .then((r) => (r.data ?? []) as T[])
          .catch(() => [] as T[]);
      try {
        const [profile, m, c, v] = await Promise.all([
          getMyRawProfile().catch(() => null),
          rows<{ user_a: string; user_b: string; created_at: string }>(
            db
              .from("swivv_matches")
              .select("user_a,user_b,created_at")
              .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
              .limit(CAP),
          ),
          // ponytail: counts + timestamps only — message bodies never enter progress calculations
          rows<{ peer_id: string; sender: "me" | "them"; created_at: string }>(
            db
              .from("swivv_chats")
              .select("peer_id,sender,created_at")
              .eq("user_id", user.id)
              .limit(CAP),
          ),
          rows<{ created_at: string }>(
            db.from("swivv_profile_views").select("created_at").eq("viewed_id", user.id).limit(CAP),
          ),
        ]);
        const matches: MatchRow[] = m.map((x) => ({
          other: String(x.user_a) === user.id ? String(x.user_b) : String(x.user_a),
          at: Date.parse(x.created_at) || 0,
        }));
        // ponytail: local matches (seeds + pre-mirror pairs) have no server date — they unlock badges but never claim a day
        const seen = new Set(matches.map((x) => x.other));
        for (const id of getMatches()) {
          const bare = id.replace(/^u:/, "");
          if (!seen.has(bare)) {
            seen.add(bare);
            matches.push({ other: bare, at: 0 });
          }
        }
        const chats: ChatRow[] = c
          .map((x) => ({
            peer: String(x.peer_id),
            sender: x.sender,
            at: Date.parse(x.created_at) || 0,
          }))
          .filter((x) => x.at > 0);
        if (live)
          setData({
            profile: profile ?? null,
            chats,
            matches,
            visits: v.map((x) => Date.parse(x.created_at) || 0).filter(Boolean),
          });
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const now = Date.now();
  const completion = profileCompleteness(data?.profile);
  const badges = useMemo(
    () =>
      achievements({
        profile: data?.profile ?? null,
        chats: data?.chats ?? [],
        matches: data?.matches ?? [],
        now,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );
  const unlocked = badges.filter((b) => b.unlocked);

  // Subtle, once-only unlock notice: ids live in localStorage, so a reload can't re-announce them.
  useEffect(() => {
    if (!data) return;
    const ids = unlocked.map((b) => b.id);
    let prev: string[] = [];
    try {
      prev = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    } catch {
      /* corrupt/absent key means no previous view */
    }
    const fresh = unlocked.filter((b) => !prev.includes(b.id));
    if (prev.length > 0 && fresh.length > 0) {
      toast.success(
        fresh.length === 1
          ? `Succès débloqué : ${fresh[0].name}`
          : `${fresh.length} succès débloqués`,
        {
          description: "Retrouve-les dans l'onglet Succès.",
        },
      );
    }
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
    } catch {
      /* private mode: notice simply repeats next visit */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading) return null;

  if (!user) {
    return (
      <Shell>
        <main className="mx-auto max-w-2xl px-4 py-8 text-center">
          <p className="text-sm text-[#777]">Connecte-toi pour voir ta progression.</p>
          <button
            type="button"
            onClick={() => openAuthModal("account", "signin")}
            className="mt-4 rounded-md bg-[#e91e63] px-6 py-3 font-medium text-white"
          >
            Se connecter / S&apos;inscrire
          </button>
        </main>
      </Shell>
    );
  }

  const days = qualifyingDays(data?.chats ?? [], data?.matches ?? []);
  const run = streak(days, now);
  const replies = weeklyReplies(data?.chats ?? [], now);
  const step = nextProfileStep(data?.profile);
  const week = lastDays(now, 7);
  const stats = periodStats({
    chats: data?.chats ?? [],
    matches: data?.matches ?? [],
    visits: data?.visits ?? [],
    now,
    days: period,
  });

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <SwivvSettingsTabs />
        <div className="mt-4 rounded-[28px] bg-[#e6eaef] p-2 sm:p-3">
          <div className="rounded-[22px] bg-white p-5 sm:p-7">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e91e63]">
                  SWIVV Progress
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#1b1b1e]">
                  Ta progression
                </h1>
                <p className="mt-1 max-w-xl text-sm text-[#777]">
                  Des repères pour avancer à ton rythme, sans pression ni classement.
                </p>
              </div>
            </header>

            {failed && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-border bg-white p-4 text-sm text-[#555]"
              >
                Certaines données n&apos;ont pas pu être chargées.{" "}
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="font-medium text-[#e91e63] hover:underline"
                >
                  Réessayer
                </button>
              </div>
            )}
            {!data && !failed && (
              <p className="mt-6 text-sm text-[#777]">Chargement de ta progression…</p>
            )}

            {data && (
              <Tabs
                value={tab}
                onValueChange={(next) => nav({ search: { tab: next } })}
                className="mt-6"
              >
                <TabsList
                  aria-label="Sections de SWIVV Progress"
                  className="flex h-auto gap-1 overflow-x-auto rounded-full bg-[#f1f2f4] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {[
                    { id: "progress", label: "Progression" },
                    { id: "achievements", label: "Succès" },
                    { id: "stats", label: "Statistiques" },
                  ].map((t) => (
                    <TabsTrigger
                      key={t.id}
                      value={t.id}
                      className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-[#555] shadow-none data-[state=active]:bg-[#1b1b1e] data-[state=active]:text-white data-[state=active]:shadow-none"
                    >
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="progress" className="mt-6 focus-visible:outline-none">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* --- streak --- */}
                    <Card>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1b1b1e]">
                            <Flame className="h-4 w-4 text-[#e91e63]" aria-hidden="true" />
                            Série de connexion
                          </h2>
                          <p className="mt-2 text-3xl font-semibold text-[#1b1b1e]">
                            {run.current}{" "}
                            <span className="text-base font-normal text-[#777]">
                              jour{run.current > 1 ? "s" : ""} d&apos;affilée
                            </span>
                          </p>
                        </div>
                        <span className="rounded-full bg-[#fce4ec] px-3 py-1 text-xs font-medium text-[#c2185b]">
                          Record : {run.best} j
                        </span>
                      </div>

                      <ol
                        className="mt-4 grid grid-cols-7 gap-1.5"
                        aria-label="Activité des 7 derniers jours"
                      >
                        {week.map((ord) => {
                          const active = days.has(ord);
                          const isToday = ord === dayOrdinal(now);
                          return (
                            <li key={ord} className="flex flex-col items-center gap-1.5">
                              <span className="text-[11px] uppercase tracking-wide text-[#999]">
                                {ordLabel(ord)}
                              </span>
                              <span
                                className={`group relative flex h-8 w-full items-center justify-center rounded-lg border text-[11px] font-medium ${
                                  active
                                    ? "border-[#e91e63] bg-[#e91e63] text-white"
                                    : "border-dashed border-[#d8d8db] bg-white text-[#bbb]"
                                } ${isToday ? "ring-2 ring-[#e91e63]/30 ring-offset-1" : ""}`}
                              >
                                {active ? (
                                  <Heart
                                    className="h-3.5 w-3.5"
                                    fill="currentColor"
                                    strokeWidth={0}
                                    aria-hidden="true"
                                  />
                                ) : (
                                  "·"
                                )}
                                {/* ponytail: CSS-only hover tip mirroring MatchTooltip — tap users keep the sr-only text; popover API if touch needs it */}
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden w-max -translate-x-1/2 whitespace-nowrap rounded-lg bg-black px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg group-hover:block"
                                >
                                  {ordNum(ord)}
                                </span>
                                <span className="sr-only">
                                  {ordNum(ord)} :{" "}
                                  {active ? "activité qualifiante" : "aucune activité qualifiante"}
                                  {isToday ? " (aujourd'hui)" : ""}
                                </span>
                              </span>
                            </li>
                          );
                        })}
                      </ol>

                      <p className="mt-3 text-sm text-[#555]">
                        {run.current === 0
                          ? "Un like réciproque ou une vraie conversation suffit à démarrer ta série. Aucune obligation de revenir chaque jour."
                          : "Tu construis ton parcours vers des rencontres sincères, un échange à la fois."}
                      </p>
                    </Card>

                    {/* --- profile completion --- */}
                    <Card>
                      <h2 className="text-sm font-semibold text-[#1b1b1e]">Complétude du profil</h2>
                      <div className="mt-3 flex items-center gap-4">
                        <p className="text-3xl font-semibold text-[#e91e63]">{completion}&nbsp;%</p>
                        <div className="min-w-0 flex-1">
                          <Progress
                            value={completion}
                            aria-label={`Profil complété à ${completion} %`}
                            className="h-2.5 bg-[#f1f2f4] [&>div]:bg-[#e91e63]"
                          />
                          <p className="mt-2 text-xs text-[#777]">
                            Ce score mesure la complétude, pas ton attractivité.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl bg-[#f7f7f8] p-3">
                        {step ? (
                          <>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#777]">
                              Prochaine étape
                            </p>
                            <p className="mt-1 text-sm text-[#333]">Compléter « {step.label} »</p>
                            {/* ponytail: plain anchor like the Mon profil tips — the profile flow reads ?revoir= from the URL on load */}
                            <a
                              href={step.to}
                              className="mt-2 inline-block rounded-full bg-[#e91e63] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#c2185b]"
                            >
                              Compléter mon profil
                            </a>
                          </>
                        ) : (
                          <p className="flex items-center gap-2 text-sm font-medium text-[#16A34A]">
                            <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Profil complet,
                            bravo.
                          </p>
                        )}
                      </div>
                    </Card>

                    {/* --- weekly goal --- */}
                    <Card>
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1b1b1e]">
                        <Target className="h-4 w-4 text-[#e91e63]" aria-hidden="true" />
                        Objectif de la semaine
                      </h2>
                      <p className="mt-2 text-sm text-[#555]">
                        Répondre à au moins une conversation entamée par l&apos;autre personne.
                      </p>
                      <div className="mt-3">
                        <Progress
                          value={replies > 0 ? 100 : 0}
                          aria-label={replies > 0 ? "Objectif atteint" : "Objectif non atteint"}
                          className="h-2.5 bg-[#f1f2f4] [&>div]:bg-[#e91e63]"
                        />
                        <p className="mt-2 text-xs text-[#777]">
                          {replies > 0
                            ? `Objectif atteint : ${replies} conversation${replies > 1 ? "s" : ""} relancée${replies > 1 ? "s" : ""} cette semaine.`
                            : "0 pour l'instant — une seule réponse suffit, sans envoi massif."}
                        </p>
                      </div>
                      <Link
                        to="/messagerie"
                        className="mt-3 inline-block rounded-full border border-[#e91e63] px-4 py-1.5 text-sm font-medium text-[#e91e63] hover:bg-[#e91e63]/10"
                      >
                        Ouvrir mes messages
                      </Link>
                    </Card>

                    {/* --- compact summary --- */}
                    <Card>
                      <h2 className="text-sm font-semibold text-[#1b1b1e]">
                        En un coup d&apos;œil
                      </h2>
                      <ul className="mt-3 space-y-2 text-sm text-[#333]">
                        <li className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-[#e91e63]" aria-hidden="true" />
                            Matches mutuels
                          </span>
                          <span className="font-semibold">{data.matches.length}</span>
                        </li>
                        <li className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <MessagesSquare className="h-4 w-4 text-[#e91e63]" aria-hidden="true" />
                            Conversations suivies
                          </span>
                          <span className="font-semibold">
                            {new Set(data.chats.map((c) => c.peer)).size}
                          </span>
                        </li>
                        <li className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#e91e63]" aria-hidden="true" />
                            Succès débloqués
                          </span>
                          <span className="font-semibold">
                            {unlocked.length} / {badges.filter((b) => b.available).length}
                          </span>
                        </li>
                      </ul>
                      <p className="mt-3 text-xs text-[#999]">
                        Ces chiffres restent privés : ils ne sont visibles que par toi.
                      </p>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="achievements" className="mt-6 focus-visible:outline-none">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1b1b1e]">Succès</h2>
                      <p className="text-sm text-[#777]">
                        {unlocked.length} débloqué{unlocked.length > 1 ? "s" : ""} sur{" "}
                        {badges.filter((b) => b.available).length}. Chaque succès ne se débloque
                        qu&apos;une fois.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fce4ec] px-3 py-1 text-xs font-medium text-[#c2185b]">
                      Privé par défaut
                    </span>
                  </div>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {badges.map((b) => {
                      const Icon = ACHIEVEMENT_ICONS[b.id];
                      return (
                        <li
                          key={b.id}
                          aria-label={`${b.name} — ${b.unlocked ? "débloqué" : b.available ? "verrouillé" : "bientôt disponible"}`}
                          className={`rounded-[20px] border p-4 ${b.unlocked ? "border-[#f5c2d6] bg-white" : "border-dashed border-[#dcdcdf] bg-[#fafafa]"}`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${b.unlocked ? "bg-[#e91e63] text-white" : "bg-[#efeff1] text-[#9a9aa0]"}`}
                            >
                              <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p
                                className={`flex items-center gap-1.5 font-semibold ${b.unlocked ? "text-[#1b1b1e]" : "text-[#6b6b70]"}`}
                              >
                                {b.name}
                                {!b.unlocked && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                              </p>
                              <p className="mt-1 text-xs text-[#777]">{b.description}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-[#555]">
                            <span className="font-medium">Condition : </span>
                            {b.condition}
                          </p>
                          <p
                            className={`mt-2 text-xs font-medium ${b.unlocked ? "text-[#16A34A]" : "text-[#999]"}`}
                          >
                            {b.unlocked && b.at
                              ? `Débloqué le ${fmtDay(b.at)}`
                              : b.unlocked
                                ? "Débloqué"
                                : b.available
                                  ? "Pas encore débloqué"
                                  : "Bientôt disponible"}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </TabsContent>

                <TabsContent value="stats" className="mt-6 focus-visible:outline-none">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1b1b1e]">Statistiques privées</h2>
                      <p className="text-sm text-[#777]">
                        Calculées sur tes propres données, jamais sur celles des autres membres.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="progress-period" className="text-sm text-[#555]">
                        Période :
                      </label>
                      <select
                        id="progress-period"
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value))}
                        className="rounded-full border border-[#ececee] bg-[#f7f7f8] px-3 py-2 text-sm"
                      >
                        {PERIODS.map((p) => (
                          <option key={p.days} value={p.days}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Tile
                      icon={Heart}
                      label="Matches mutuels"
                      value={stats.matches}
                      hint="Nouveaux matches réciproques sur la période."
                    />
                    <Tile
                      icon={MessageCircle}
                      label="Conversations commencées"
                      value={stats.started}
                      hint="Conversations où tu as envoyé le premier message."
                    />
                    <Tile
                      icon={MessagesSquare}
                      label="Échanges à deux"
                      value={stats.twoWay}
                      hint="Conversations devenues bidirectionnelles sur la période."
                    />
                    <Tile
                      icon={Eye}
                      label="Visites reçues"
                      value={stats.visits}
                      hint="Consultations de ton profil par d'autres membres."
                    />
                    <Tile
                      icon={CalendarCheck2}
                      label="Jours actifs"
                      value={stats.activeDays}
                      hint="Jours avec un match ou une vraie conversation."
                    />
                    <Tile
                      icon={Users}
                      label="Profil complété"
                      value={`${completion} %`}
                      hint="Part des informations de profil renseignées."
                    />
                    <Tile
                      icon={Sparkles}
                      label="Succès débloqués"
                      value={unlocked.length}
                      hint="Succès obtenus depuis ton inscription."
                    />
                    <Tile
                      icon={Flame}
                      label="Série actuelle"
                      value={`${run.current} j`}
                      hint="Jours consécutifs d'activité qualifiante."
                    />
                  </div>

                  {stats.matches +
                    stats.started +
                    stats.twoWay +
                    stats.visits +
                    stats.activeDays ===
                    0 && (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#dcdcdf] bg-[#fafafa] p-4 text-sm text-[#777]">
                      Aucune activité sur cette période. Un profil complété et un échange sincère
                      suffisent à faire vivre ces chiffres — le volume n&apos;est pas un objectif.
                    </div>
                  )}
                  <p className="mt-4 text-xs text-[#999]">
                    Les jours sont comptés en heure locale, du lundi au dimanche. Les visites de
                    profil ne sont affichées que lorsqu&apos;elles sont enregistrées par SWIVV
                    MATCH.
                  </p>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home">
            <SwivvLogo />
          </Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
      {children}
      <SwivvFooter />
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-[20px] border border-[#ececee] p-5">{children}</section>;
}

function Tile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Heart;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#ececee] bg-white p-4">
      {/* ponytail: CSS-only black hint mirroring MatchTooltip — hover only, tap users get the sr-only text; popover API if touch needs it */}
      <p className="group relative flex items-center gap-2 text-xs font-medium text-[#777]">
        <Icon className="h-4 w-4 text-[#e91e63]" aria-hidden="true" />
        {label}
        <span className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-48 rounded-lg bg-black p-2.5 text-left text-[11px] font-normal leading-snug text-white shadow-lg group-hover:block">
          {hint}
        </span>
      </p>
      <p className="mt-2 text-2xl font-semibold text-[#1b1b1e]">{value}</p>
      <span className="sr-only">{hint}</span>
    </div>
  );
}
