import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";
import { profileCompleteness } from "@/lib/swivv-auth";
import { SCAN_CAP, bucketByDay, fmtDelta, median, toCsv } from "@/lib/admin-metrics";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
} as any);

const TABS = ["Acquisition", "Activation", "Engagement", "Interactions", "Rétention", "Qualité", "Confiance"] as const;
const RANGES = [
  { days: 7, label: "7 j" },
  { days: 30, label: "30 j" },
  { days: 90, label: "90 j" },
];

// ponytail: history reconstructed from created_at (labelled "reconstitué"); swivv_events feeds funnels going forward —
// no UTM/source tracking (lawful basis absent), no sessions table, no paid products (revenue tab omitted, not faked)
function AdminAnalytics() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Acquisition");
  const [range, setRange] = useState(30);
  const [d, setD] = useState<Record<string, any>>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const now = Date.now();
        const since = new Date(now - range * 864e5).toISOString();
        const prevStart = new Date(now - 2 * range * 864e5).toISOString();
        const q = supabase as any;
        const [
          legacyHead, legacy, events, profHead, profs, chats,
          likes, matches, views, reacts, reports, verifs, reopens,
        ] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).then((r) => (r.error ? null : r.count)),
          supabase.from("profiles").select("id,created_at").order("created_at", { ascending: false }).limit(5000).then((r) => (r.error ? null : (r.data ?? []))),
          q.from("swivv_events").select("type,created_at").order("created_at", { ascending: false }).limit(5000).then((r: any) => (r.error ? null : (r.data ?? []))),
          supabase.from("swivv_profiles").select("user_id", { count: "exact", head: true }),
          supabase.from("swivv_profiles").select("user_id,data,updated_at").limit(2000),
          supabase.from("swivv_chats").select("msg_id,created_at").gte("created_at" as any, prevStart).order("created_at" as any, { ascending: false }).limit(SCAN_CAP),
          q.from("swivv_likes").select("liker_id,created_at").gte("created_at", prevStart).order("created_at", { ascending: false }).limit(5000),
          q.from("swivv_matches").select("user_a,user_b,created_at").gte("created_at", prevStart).order("created_at", { ascending: false }).limit(5000),
          q.from("swivv_profile_views").select("viewer_id,created_at").gte("created_at", prevStart).order("created_at", { ascending: false }).limit(5000),
          q.from("swivv_photo_reaction_events").select("created_at").gte("created_at", prevStart).order("created_at", { ascending: false }).limit(5000),
          q.from("swivv_reports").select("status,priority,created_at,resolved_at").order("created_at", { ascending: false }).limit(1000),
          q.from("swivv_verification_requests").select("status,created_at").order("created_at", { ascending: false }).limit(1000),
          q.from("swivv_audit_log").select("created_at").eq("action", "admin.verify.reopen").order("created_at", { ascending: false }).limit(200),
        ]);
        if (profs.error) throw profs.error;
        const leg = (legacy ?? []) as { id: string; created_at: string }[];
        const createdBy = new Map(leg.map((x) => [x.id, new Date(x.created_at).getTime()]));
        const members = (profs.data ?? []) as { user_id: string; data: any; updated_at: string }[];
        const upd = new Map(members.map((m) => [m.user_id, new Date(m.updated_at).getTime()]));
        const inWin = (iso: string, from: string) => iso >= from;
        const day = new Date(now - 864e5).toISOString();

        // registrations (legacy created_at; events when live)
        const regsSeries = bucketByDay(leg.filter((x) => x.created_at >= prevStart).map((x) => ({ created_at: x.created_at })), range, now);
        const regsCur = leg.filter((x) => inWin(x.created_at, since)).length;
        const regsPrev = leg.filter((x) => x.created_at >= prevStart && x.created_at < since).length;
        const evSignups = ((events ?? []) as { type: string; created_at: string }[]).filter((e) => e.type === "signup_completed" && inWin(e.created_at, since)).length;

        // funnel
        const completeIds = new Set(members.filter((m) => profileCompleteness(m.data) >= 80).map((m) => m.user_id));
        const interacted = new Set<string>();
        for (const l of (likes.data ?? []) as any[]) interacted.add(l.liker_id);
        for (const m of (matches.data ?? []) as any[]) {
          interacted.add(m.user_a);
          interacted.add(m.user_b);
        }
        for (const v of (views.data ?? []) as any[]) interacted.add(v.viewer_id);

        // activity
        const act = (cut: string) => members.filter((m) => m.updated_at >= cut).length;
        const dau = act(day);
        const wau = act(new Date(now - 7 * 864e5).toISOString());
        const mau = act(new Date(now - 30 * 864e5).toISOString());
        const actSeries = bucketByDay(members.filter((m) => m.updated_at >= prevStart).map((m) => ({ created_at: m.updated_at })), range, now);

        // messages distinct
        const msgCur = new Set<string>();
        const msgPrev = new Set<string>();
        for (const m of ((chats.data ?? []) as { msg_id: string; created_at: string }[])) (m.created_at >= since ? msgCur : msgPrev).add(m.msg_id);
        const msgTrend = bucketByDay(
          (() => {
            const seen = new Set<string>();
            const out: { created_at: string }[] = [];
            for (const m of ((chats.data ?? []) as { msg_id: string; created_at: string }[])) if (!seen.has(m.msg_id)) {
              seen.add(m.msg_id);
              out.push(m);
            }
            return out;
          })(),
          range, now,
        );

        const split = (rows: any[]) => ({
          cur: rows.filter((r) => inWin(r.created_at, since)),
          prev: rows.filter((r) => r.created_at >= prevStart && r.created_at < since),
        });
        const lk = split((likes.data ?? []) as any[]);
        const ma = split((matches.data ?? []) as any[]);
        const vw = split((views.data ?? []) as any[]);
        const rx = split((reacts.data ?? []) as any[]);
        const matchTrend = bucketByDay((ma.cur as any[]).map((r) => ({ created_at: r.created_at })), range, now);

        // activation delays (approx: legacy created_at → profile updated_at / first recorded interaction)
        const reg2complete: number[] = [];
        for (const m of members) {
          const c = createdBy.get(m.user_id);
          if (c && completeIds.has(m.user_id)) reg2complete.push((new Date(m.updated_at).getTime() - c) / 36e5);
        }
        const firstAct = new Map<string, number>();
        const touch = (id: string, iso: string) => {
          const t = new Date(iso).getTime();
          if (!Number.isFinite(t)) return;
          const p = firstAct.get(id);
          if (p == null || t < p) firstAct.set(id, t);
        };
        for (const l of (likes.data ?? []) as any[]) touch(l.liker_id, l.created_at);
        for (const m of (matches.data ?? []) as any[]) {
          touch(m.user_a, m.created_at);
          touch(m.user_b, m.created_at);
        }
        for (const v of (views.data ?? []) as any[]) touch(v.viewer_id, v.created_at);
        const reg2first: number[] = [];
        for (const [id, t] of firstAct) {
          const c = createdBy.get(id);
          if (c && t >= c) reg2first.push((t - c) / 864e5);
        }

        // cohorts: last 8 signup weeks
        const weekStart = (t: number) => {
          const dd = new Date(t);
          dd.setHours(0, 0, 0, 0);
          dd.setDate(dd.getDate() - ((dd.getDay() + 6) % 7));
          return dd.getTime();
        };
        const cohorts: { week: string; size: number; d1: number; d7: number; d30: number }[] = [];
        const w0 = weekStart(now);
        for (let w = 7; w >= 0; w--) {
          const s = w0 - w * 7 * 864e5;
          const e = s + 7 * 864e5;
          const inC = leg.filter((x) => {
            const t = new Date(x.created_at).getTime();
            return t >= s && t < e;
          });
          const ret = (days: number) => inC.filter((x) => (upd.get(x.id) ?? 0) >= new Date(x.created_at).getTime() + days * 864e5).length;
          cohorts.push({
            week: `sem. ${new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`,
            size: inC.length,
            d1: inC.length ? Math.round((100 * ret(1)) / inC.length) : 0,
            d7: inC.length ? Math.round((100 * ret(7)) / inC.length) : 0,
            d30: inC.length ? Math.round((100 * ret(30)) / inC.length) : 0,
          });
        }

        // inactivity + quality
        const inac = [0, 0, 0, 0];
        for (const m of members) {
          const age = now - new Date(m.updated_at).getTime();
          inac[age <= 7 * 864e5 ? 0 : age <= 30 * 864e5 ? 1 : age <= 90 * 864e5 ? 2 : 3]++;
        }
        const qDist = [0, 0, 0];
        const phDist = [0, 0, 0, 0];
        let withBio = 0;
        for (const m of members) {
          const pc = profileCompleteness(m.data);
          qDist[pc < 50 ? 0 : pc < 80 ? 1 : 2]++;
          const n = (m.data?.photos ?? []).length;
          phDist[n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3]++;
          if (((m.data?.bio ?? "") as string).trim()) withBio++;
        }

        // trust
        const reps = (reports.data ?? []) as any[];
        const openRep = reps.filter((r) => ["new", "investigating", "waiting"].includes(r.status)).length;
        const resH = reps.filter((r) => r.resolved_at && r.created_at).map((r) => (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 36e5);
        const vfs = (verifs.data ?? []) as any[];
        const vApproved = vfs.filter((x) => x.status === "approved").length;

        setD({
          legacyNull: legacy == null,
          eventsLive: events != null,
          accounts: legacyHead,
          regsSeries, regsCur, regsPrev, evSignups,
          profils: profHead.count ?? members.length,
          complets: completeIds.size, interacted: interacted.size, scanned: members.length,
          reg2complete: median(reg2complete.filter((h) => h >= 0)),
          reg2first: median(reg2first),
          dau, wau, mau, actSeries,
          msgCur: msgCur.size, msgPrev: msgPrev.size, msgTrend,
          lkCur: lk.cur.length, lkPrev: lk.prev.length,
          maCur: ma.cur.length, maPrev: ma.prev.length, matchTrend,
          vwCur: vw.cur.length, vwPrev: vw.prev.length,
          rxCur: rx.cur.length, rxPrev: rx.prev.length,
          cohorts, inac,
          qDist, phDist, withBio,
          openRep, resMed: median(resH),
          repPer1k: mau ? Math.round((1000 * openRep) / mau) : null,
          vRate: vfs.length ? Math.round((100 * vApproved) / vfs.length) : null,
          vTotal: vfs.length,
          reopens: ((reopens.data ?? []) as any[]).length,
        });
        audit("admin.analytics.view");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Chargement impossible.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const rangeLabel = RANGES.find((r) => r.days === range)?.label ?? "";
  const v = (x: any) => (x == null ? "…" : String(x));
  const chart = (data: any[], lines: { k: string; c: string }[], h = "h-48") => (
    <div className={`mt-2 ${h}`}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={Math.max(1, Math.floor(data.length / 8))} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          {lines.map((l) => <Line key={l.k} type="monotone" dataKey={l.k} stroke={l.c} strokeWidth={2} dot={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
  const bars = (data: { label: string; n: number }[], color: string) => (
    <div className="mt-2 h-48">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-18} dy={8} height={48} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="n" fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
  const kpi = (label: string, value: string, def: string, delta?: string) => (
    <div className="rounded-xl bg-white p-4 shadow-sm" title={def}>
      <p className="text-3xl font-bold text-[#333]">{value}</p>
      <p className="mt-1 text-sm text-[#777]">
        {label}
        {delta && delta !== "—" && (
          <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${delta.startsWith("-") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{delta}</span>
        )}
      </p>
    </div>
  );
  const src = "Source : horodatages Supabase (reconstitué), fuseau Europe/Paris";
  const exportCsv = () => {
    const series: Record<string, { day: string; n: number }[]> = {
      Acquisition: d.regsSeries ?? [], Activation: [], Engagement: d.msgTrend ?? [],
      Interactions: d.matchTrend ?? [], Rétention: [], Qualité: [], Confiance: [],
    };
    const csv = toCsv(["jour", tab], (series[tab] ?? []).map((r) => [r.day, r.n]));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${tab}-${range}j.csv`;
    a.click();
    URL.revokeObjectURL(url);
    audit("admin.analytics.export", "analytics", undefined, { tab, range });
  };

  if (err) return <p className="text-sm text-red-600">{err}</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-medium text-[#333]">Analytics</h1>
        <div className="ml-auto flex gap-1" role="group" aria-label="Période">
          {RANGES.map((r) => (
            <button key={r.days} type="button" onClick={() => setRange(r.days)} aria-pressed={range === r.days}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${range === r.days ? "bg-[#6747c7] text-white" : "bg-white text-[#555]"}`}>{r.label}</button>
          ))}
        </div>
        <button type="button" onClick={exportCsv} className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-[#555]">Export CSV</button>
      </div>
      <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Onglets">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === t ? "bg-[#14112b] text-white" : "bg-white text-[#555]"}`}>{t}</button>
        ))}
      </nav>

      {tab === "Acquisition" && (
        <div className="mt-3">
          {d.legacyNull ? (
            <p className="rounded-xl bg-white p-4 text-sm text-[#777] shadow-sm">Inscriptions indisponibles pour ce rôle (table profiles lisible admin uniquement). Événements signup : {v(d.evSignups)}.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {kpi("Comptes auth (total)", v(d.accounts), "Lignes profiles (toutes époques).")}
                {kpi(`Inscrits (${rangeLabel})`, v(d.regsCur), "created_at legacy sur la période (5000 derniers max).", d.regsCur != null ? fmtDelta(d.regsCur, d.regsPrev) : undefined)}
                {kpi(`Signups trackés (${rangeLabel})`, v(d.evSignups), d.eventsLive ? "Événements signup_completed (collecte depuis le 12/10/2026)." : "Table swivv_events absente — applique la migration 20261015000000.")}
                {kpi("Source d'inscription", "—", "Non suivie (UTM) — base légale absente, non collecté.")}
              </div>
              <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-[#333]">Inscriptions / jour ({rangeLabel})</p>
                <p className="text-xs text-[#999]">{src}</p>
                {chart(d.regsSeries ?? [], [{ k: "n", c: "#6747c7" }])}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "Activation" && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpi("Profils → complétés", d.complets == null ? "…" : `${d.complets} / ${d.scanned}`, "Complétude ≥ 80 % sur les 2000 profils scannés.")}
            {kpi("Taux de complétion", d.complets == null ? "…" : `${Math.round((100 * d.complets) / Math.max(1, d.scanned))} %`, "Complétés / scannés (base 2000).")}
            {kpi("Inscription → profil (médiane)", d.reg2complete == null ? "—" : `${Math.round(d.reg2complete)} h`, "legacy.created_at → profile.updated_at, profils complétés (approx).")}
            {kpi("Inscription → 1re interaction (médiane)", d.reg2first == null ? "—" : `${d.reg2first.toFixed(1)} j`, "legacy.created_at → 1er like/match/vue enregistré (borné aux scans).")}
          </div>
          <p className="mt-2 text-xs text-[#999]">Entonnoir : comptes ({v(d.accounts)}) → profils dating ({v(d.profils)}) → complétés ({v(d.complets)}) → ont interagi ({v(d.interacted)}). {src}</p>
        </div>
      )}

      {tab === "Engagement" && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpi("Actifs 24 h / 7 j / 30 j", d.dau == null ? "…" : `${d.dau} / ${d.wau} / ${d.mau}`, "Profils avec updated_at récent (proxy d'activité, pas de sessions).")}
            {kpi(`Messages (${rangeLabel})`, v(d.msgCur), "msg_id distincts (1 envoi = 1).", d.msgCur != null ? fmtDelta(d.msgCur, d.msgPrev) : undefined)}
            {kpi(`Vues (${rangeLabel})`, v(d.vwCur), "Lignes swivv_profile_views.", d.vwCur != null ? fmtDelta(d.vwCur, d.vwPrev) : undefined)}
            {kpi("Sessions", "—", "Non suivies — instrumenter swivv_events.session_start pour activer.")}
          </div>
          <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-[#333]">Messages / jour ({rangeLabel})</p>
            <p className="text-xs text-[#999]">{src}</p>
            {chart(d.msgTrend ?? [], [{ k: "n", c: "#6747c7" }])}
          </div>
          <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-[#333]">Profils actifs / jour ({rangeLabel}, proxy updated_at)</p>
            <p className="text-xs text-[#999]">{src}</p>
            {chart(d.actSeries ?? [], [{ k: "n", c: "#e60050" }])}
          </div>
        </div>
      )}

      {tab === "Interactions" && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpi(`Matchs (${rangeLabel})`, v(d.maCur), "Entité réelle swivv_matches par created_at.", d.maCur != null ? fmtDelta(d.maCur, d.maPrev) : undefined)}
            {kpi(`Likes (${rangeLabel})`, v(d.lkCur), "Lignes swivv_likes.", d.lkCur != null ? fmtDelta(d.lkCur, d.lkPrev) : undefined)}
            {kpi(`Réactions photo (${rangeLabel})`, v(d.rxCur), "Événements (historique append-only).", d.rxCur != null ? fmtDelta(d.rxCur, d.rxPrev) : undefined)}
            {kpi(`Vues (${rangeLabel})`, v(d.vwCur), "Toutes vues, répétées incluses.", d.vwCur != null ? fmtDelta(d.vwCur, d.vwPrev) : undefined)}
          </div>
          <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-[#333]">Matchs / jour ({rangeLabel})</p>
            <p className="text-xs text-[#999]">{src}</p>
            {chart(d.matchTrend ?? [], [{ k: "n", c: "#e60050" }])}
          </div>
        </div>
      )}

      {tab === "Rétention" && (
        <div className="mt-3">
          <p className="text-xs text-[#999]">Cohortes par semaine d'inscription (legacy) · retenu = updated_at ≥ J+n (définition comportementale transparente). Churn = inactif 90 j+.</p>
          <div className="mt-2 overflow-x-auto rounded-xl bg-white p-4 shadow-sm">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs text-[#999]"><th>Cohorte</th><th>Taille</th><th>J+1</th><th>J+7</th><th>J+30</th></tr>
              </thead>
              <tbody>
                {(d.cohorts ?? []).map((c: any) => (
                  <tr key={c.week} className="border-t border-border">
                    <td className="py-1.5 text-[#333]">{c.week}</td>
                    <td>{c.size}</td>
                    <td>{c.size ? `${c.d1} %` : "—"}</td>
                    <td>{c.size ? `${c.d7} %` : "—"}</td>
                    <td>{c.size ? `${c.d30} %` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-[#333]">Inactivité (base {v(d.scanned)} profils)</p>
            {bars(
              [
                { label: "≤ 7 j", n: (d.inac ?? [0, 0, 0, 0])[0] },
                { label: "8-30 j", n: (d.inac ?? [0, 0, 0, 0])[1] },
                { label: "31-90 j", n: (d.inac ?? [0, 0, 0, 0])[2] },
                { label: "90 j+", n: (d.inac ?? [0, 0, 0, 0])[3] },
              ],
              "#6747c7",
            )}
          </div>
        </div>
      )}

      {tab === "Qualité" && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpi("Avec bio", d.withBio == null ? "…" : `${d.withBio} / ${d.scanned}`, "Bio non vide (base 2000).")}
            {kpi("Complétés (≥ 80 %)", v(d.complets), "Même définition que le dashboard.")}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-[#333]">Complétude</p>
              {bars(
                [
                  { label: "< 50 %", n: (d.qDist ?? [0, 0, 0])[0] },
                  { label: "50-79 %", n: (d.qDist ?? [0, 0, 0])[1] },
                  { label: "≥ 80 %", n: (d.qDist ?? [0, 0, 0])[2] },
                ],
                "#e60050",
              )}
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-[#333]">Photos par profil</p>
              {bars(
                [
                  { label: "0", n: (d.phDist ?? [0, 0, 0, 0])[0] },
                  { label: "1", n: (d.phDist ?? [0, 0, 0, 0])[1] },
                  { label: "2-3", n: (d.phDist ?? [0, 0, 0, 0])[2] },
                  { label: "4+", n: (d.phDist ?? [0, 0, 0, 0])[3] },
                ],
                "#6747c7",
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "Confiance" && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpi("Signalements / 1000 actifs", v(d.repPer1k), "Ouverts / actifs 30 j × 1000.")}
            {kpi("File modération", v(d.openRep), "Signalements new/investigating/waiting.")}
            {kpi("Résolution médiane", d.resMed == null ? "—" : `${Math.round(d.resMed)} h`, "resolved_at − created_at, signalements résolus.")}
            {kpi("Vérifications approuvées", d.vRate == null ? "—" : `${d.vRate} %`, `${v(d.vTotal)} demandes au total.`)}
            {kpi("Réexamens (appels)", v(d.reopens), "Transitions rejected → pending (audit admin.verify.reopen).")}
          </div>
        </div>
      )}
    </div>
  );
}
