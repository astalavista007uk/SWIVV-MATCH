import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";
import { profileCompleteness } from "@/lib/swivv-auth";
import { SCAN_CAP, bucketByDay, firstResponse, fmtDelta } from "@/lib/admin-metrics";

function Card({ label, value, def, delta, to, search }: {
  label: string;
  value: string;
  def?: string;
  delta?: string;
  to?: string;
  search?: Record<string, string>;
}) {
  const body = (
    <div className="rounded-xl bg-white p-4 shadow-sm" title={def}>
      <p className="text-3xl font-bold text-[#333]">{value}</p>
      <p className="mt-1 text-sm text-[#777]">
        {label}
        {delta && delta !== "—" && (
          <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${delta.startsWith("-") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {delta}
          </span>
        )}
      </p>
    </div>
  );
  return to ? <Link to={to} search={search as any}>{body}</Link> : body;
}

function Missing({ label, def }: { label: string; def: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm" title={def}>
      <p className="text-3xl font-bold text-[#bbb]">—</p>
      <p className="mt-1 text-sm text-[#777]">{label}</p>
    </div>
  );
}

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
} as any);

const RANGES = [
  { days: 1, label: "24 h" },
  { days: 7, label: "7 j" },
  { days: 30, label: "30 j" },
];
const OPEN_REPORTS = ["new", "investigating", "waiting"];
const OPEN_CASES = ["open", "investigating", "waiting"];
const OPEN_TICKETS = ["open", "assigned", "waiting_user", "waiting_internal"];

// ponytail: capped scans (profiles 2k, messages 20k, legacy 5k) with honest "plafond" labels — server-side aggregation if caps ever bind
function AdminDashboard() {
  const [d, setD] = useState<Record<string, any>>({});
  const [err, setErr] = useState<string | null>(null);
  const [range, setRange] = useState(7);

  useEffect(() => {
    (async () => {
      try {
        const now = Date.now();
        const since = new Date(now - range * 864e5).toISOString();
        const prevStart = new Date(now - 2 * range * 864e5).toISOString();
        const day14 = new Date(now - 14 * 864e5).toISOString();
        const t0 = performance.now();
        const ping = await supabase.from("swivv_profiles").select("user_id", { count: "exact", head: true });
        if (ping.error) throw ping.error;
        const pingMs = Math.round(performance.now() - t0);
        const [
          profCount, legacyCount, legacyScan, profs, chatsTotal, msgScan,
          rep, cas, tick, stat, ver, mail,
          likesCur, likesPrev, matchCur, matchPrev, viewsCur, viewsPrev, reactCur, reactPrev, matchTrend,
        ] = await Promise.all([
          supabase.from("swivv_profiles").select("user_id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }).then((r) => (r.error ? null : r.count)),
          supabase.from("profiles").select("id,created_at").order("created_at", { ascending: false }).limit(5000).then((r) => (r.error ? null : (r.data ?? []))),
          supabase.from("swivv_profiles").select("data,updated_at").limit(2000),
          supabase.from("swivv_chats").select("msg_id", { count: "exact", head: true }),
          supabase.from("swivv_chats").select("msg_id,created_at").gte("created_at" as any, prevStart).order("created_at" as any, { ascending: false }).limit(SCAN_CAP),
          supabase.from("swivv_reports").select("id,status,priority"),
          supabase.from("swivv_moderation_cases").select("id,status"),
          supabase.from("swivv_support_tickets").select("id,status,priority,created_at"),
          supabase.from("swivv_user_status").select("user_id,status"),
          supabase.from("swivv_verification_requests").select("id,status"),
          (supabase as any).from("swivv_email_log").select("status").then((r: any) => (r.error ? null : (r.data ?? []))),
          (supabase as any).from("swivv_likes").select("liker_id", { count: "exact", head: true }).gte("created_at", since),
          (supabase as any).from("swivv_likes").select("liker_id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", since),
          (supabase as any).from("swivv_matches").select("user_a", { count: "exact", head: true }).gte("created_at", since),
          (supabase as any).from("swivv_matches").select("user_a", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", since),
          (supabase as any).from("swivv_profile_views").select("id", { count: "exact", head: true }).gte("created_at", since),
          (supabase as any).from("swivv_profile_views").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", since),
          (supabase as any).from("swivv_photo_reaction_events").select("id", { count: "exact", head: true }).gte("created_at", since),
          (supabase as any).from("swivv_photo_reaction_events").select("id", { count: "exact", head: true }).gte("created_at", prevStart).lt("created_at", since),
          (supabase as any).from("swivv_matches").select("created_at").gte("created_at", day14).order("created_at", { ascending: true }).limit(5000),
        ]);
        if (profs.error) throw profs.error;
        const rows = (profs.data ?? []) as { data: any; updated_at: string }[];
        const day = new Date(now - 864e5).toISOString();
        const week = new Date(now - 7 * 864e5).toISOString();
        const month = new Date(now - 30 * 864e5).toISOString();
        let men = 0, women = 0, a1 = 0, a7 = 0, a30 = 0, complete = 0;
        for (const r of rows) {
          if (r.data?.gender === "man") men++;
          else if (r.data?.gender === "woman") women++;
          if (r.updated_at >= day) a1++;
          if (r.updated_at >= week) a7++;
          if (r.updated_at >= month) a30++;
          if (profileCompleteness(r.data) >= 80) complete++;
        }
        const leg = legacyScan ?? [];
        const regs = {
          d1: leg.filter((x: any) => x.created_at >= day).length,
          d7: leg.filter((x: any) => x.created_at >= week).length,
          d30: leg.filter((x: any) => x.created_at >= month).length,
        };
        // ponytail: distinct msg_id per window (each message is stored once per participant) — counts cap at SCAN_CAP rows scanned
        const cur = new Set<string>();
        const prv = new Set<string>();
        const trendRows: { created_at: string }[] = [];
        for (const m of ((msgScan.data ?? []) as { msg_id: string; created_at: string }[])) {
          if (m.created_at >= since) cur.add(m.msg_id);
          else prv.add(m.msg_id);
          if (m.created_at >= day14) trendRows.push(m);
        }
        const open = (list: any[] | null | undefined, ...st: string[]) => (list ?? []).filter((x) => st.includes(x.status)).length;
        const reports = (rep.data ?? []) as { status: string; priority: string }[];
        const tickets = (tick.data ?? []) as { id: string; status: string; priority: string; created_at: string }[];
        const openTickets = tickets.filter((t) => OPEN_TICKETS.includes(t.status));
        let ticketMsgs: { ticket_id: string; created_at: string; is_staff: boolean }[] = [];
        if (openTickets.length) {
          const tm = await supabase
            .from("swivv_support_messages")
            .select("ticket_id,created_at,is_staff")
            .in("ticket_id", openTickets.slice(0, 100).map((t) => t.id))
            .order("created_at", { ascending: true })
            .limit(5000);
          if (!tm.error) ticketMsgs = (tm.data ?? []) as any;
        }
        const fr = firstResponse(openTickets, ticketMsgs);
        const mails = (mail ?? []) as { status: string }[];
        setD({
          users: profCount.count ?? rows.length,
          accounts: legacyCount,
          regs,
          men, women, a1, a7, a30, complete, incomplete: rows.length - complete, scanned: rows.length,
          verifs: open(ver.data, "pending"),
          messages: chatsTotal.count ?? 0,
          msgCur: cur.size, msgPrev: prv.size,
          likesCur: likesCur.count ?? 0, likesPrev: likesPrev.count ?? 0,
          matchCur: matchCur.count ?? 0, matchPrev: matchPrev.count ?? 0,
          viewsCur: viewsCur.count ?? 0, viewsPrev: viewsPrev.count ?? 0,
          reactCur: reactCur.count ?? 0, reactPrev: reactPrev.count ?? 0,
          msgTrend: bucketByDay(trendRows, 14, now),
          matchTrend: bucketByDay((matchTrend.data ?? []) as any, 14, now),
          reportsOpen: reports.filter((r) => OPEN_REPORTS.includes(r.status)).length,
          reportsNew: open(rep.data, "new"),
          reportsCrit: reports.filter((r) => r.priority === "critical" && OPEN_REPORTS.includes(r.status)).length,
          cases: open(cas.data, ...OPEN_CASES),
          suspended: (stat.data ?? []).filter((x: any) => x.status === "suspended").length,
          banned: (stat.data ?? []).filter((x: any) => x.status === "banned").length,
          tickets: openTickets.length,
          ticketsHigh: openTickets.filter((t) => t.priority === "high" || t.priority === "critical").length,
          frAvg: fr.avgH, frN: fr.responded, frOver: fr.overdue,
          mailSent: mails.filter((m) => m.status === "sent").length,
          mailFail: mails.filter((m) => m.status === "failed").length,
          mailNull: mail == null,
          pingMs,
        });
        audit("admin.dashboard.view");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Chargement impossible.");
      }
    })();
  }, [range]);

  if (err) return <p className="text-sm text-red-600">{err}</p>;
  const rangeLabel = RANGES.find((r) => r.days === range)?.label ?? "";
  const v = (x: any) => (x == null ? "…" : String(x));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-medium text-[#333]">Dashboard</h1>
        <div className="ml-auto flex gap-1" role="group" aria-label="Période">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setRange(r.days)}
              aria-pressed={range === r.days}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${range === r.days ? "bg-[#6747c7] text-white" : "bg-white text-[#555]"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <h2 className="mt-6 font-medium text-[#555]">A · Utilisateurs</h2>
      <p className="text-xs text-[#999]">Profils dating (swivv_profiles) · comptes auth (profiles, toutes époques) · actifs = updated_at récent · complété = profil rempli à ≥ 80 %.</p>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Profils dating" value={v(d.users)} def="Lignes swivv_profiles (total)." to="/admin/users" />
        {d.accounts == null && d.users == null ? <Missing label="Comptes auth" def="Table profiles illisible pour ce rôle." /> : <Card label="Comptes auth" value={v(d.accounts)} def="Lignes profiles créées par le trigger à l'inscription (toutes époques)." />}
        {d.regs ? (
          <>
            <Card label={`Inscrits (${range === 1 ? "24 h" : rangeLabel})`} value={String(range === 1 ? d.regs.d1 : range === 7 ? d.regs.d7 : d.regs.d30)} def="Comptes auth créés sur la période (created_at, 5000 derniers max)." />
            <Card label="Actifs (24 h / 7 j / 30 j)" value={d.a1 == null ? "…" : `${d.a1} / ${d.a7} / ${d.a30}`} def="Profils avec updated_at récent." />
          </>
        ) : (
          <>
            <Missing label="Inscrits" def="Table profiles illisible pour ce rôle." />
            <Card label="Actifs (7 j)" value={v(d.a7)} def="Profils avec updated_at < 7 j." />
          </>
        )}
        <Card label="Hommes / Femmes" value={d.men == null ? "…" : `${d.men} / ${d.women}`} def="Champ gender des profils (base 2000 max)." />
        <Card label="Complétés / Incomplets" value={d.complete == null ? "…" : `${d.complete} / ${d.incomplete}`} def="Complété = profileCompleteness ≥ 80 % (base 2000 max)." />
        <Card label="Vérifications en attente" value={v(d.verifs)} def="Demandes status pending." to="/admin/verification" search={{ status: "pending" }} />
        <Card label="Suspendus / Bannis" value={d.suspended == null ? "…" : `${d.suspended} / ${d.banned}`} def="Table swivv_user_status." to="/admin/users" search={{ status: "suspended" }} />
      </div>

      <h2 className="mt-6 font-medium text-[#555]">B · Engagement ({rangeLabel}, vs période précédente)</h2>
      <p className="text-xs text-[#999]">Messages dédupliqués par msg_id (1 envoi = 1, pas 1 par participant) · matchs/likes/vues/réactions par created_at · tendance 14 derniers jours.</p>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label={`Messages envoyés (${rangeLabel})`} value={v(d.msgCur)} def="msg_id distincts sur la période (scan 20k max)." delta={d.msgCur != null ? fmtDelta(d.msgCur, d.msgPrev) : undefined} />
        <Card label={`Nouveaux matchs (${rangeLabel})`} value={v(d.matchCur)} def="Lignes swivv_matches par created_at." delta={d.matchCur != null ? fmtDelta(d.matchCur, d.matchPrev) : undefined} />
        <Card label={`Likes (${rangeLabel})`} value={v(d.likesCur)} def="Lignes swivv_likes par created_at." delta={d.likesCur != null ? fmtDelta(d.likesCur, d.likesPrev) : undefined} />
        <Card label={`Réactions photo (${rangeLabel})`} value={v(d.reactCur)} def="Événements swivv_photo_reaction_events (historique, dédupliqué par nature)." delta={d.reactCur != null ? fmtDelta(d.reactCur, d.reactPrev) : undefined} />
        <Card label={`Vues de profil (${rangeLabel})`} value={v(d.viewsCur)} def="Lignes swivv_profile_views (toutes vues, rép pétées incluses)." delta={d.viewsCur != null ? fmtDelta(d.viewsCur, d.viewsPrev) : undefined} />
        <Card label="Messages (total copies)" value={v(d.messages)} def="Lignes swivv_chats (1 copie par participant)." />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[#333]">Messages / jour (14 j, dédupliqués)</p>
          <div className="mt-2 h-48">
            <ResponsiveContainer>
              <LineChart data={d.msgTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={3} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="n" stroke="#6747c7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[#333]">Matchs / jour (14 j)</p>
          <div className="mt-2 h-48">
            <ResponsiveContainer>
              <BarChart data={d.matchTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={3} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="n" fill="#e91e63" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h2 className="mt-6 font-medium text-[#555]">C · Confiance et sécurité</h2>
      <p className="text-xs text-[#999]">Ouverts = new/investigating/waiting (signalements) ou open/investigating/waiting (cas).</p>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Signalements ouverts" value={v(d.reportsOpen)} def="Status new, investigating ou waiting." to="/admin/reports" search={{ status: "new" }} />
        <Card label="À revoir (new)" value={v(d.reportsNew)} def="Status new, jamais examinés." to="/admin/reports" search={{ status: "new" }} />
        <Card label="Critiques ouverts" value={v(d.reportsCrit)} def="Priorité critical + statut ouvert." to="/admin/reports" search={{ status: "new" }} />
        <Card label="Cas de modération en cours" value={v(d.cases)} def="Status open, investigating ou waiting." to="/admin/moderation" search={{ status: "open" }} />
      </div>

      <h2 className="mt-6 font-medium text-[#555]">D · Support</h2>
      <p className="text-xs text-[#999]">Ouverts = open/assigned/waiting_* · en retard = sans réponse staff depuis plus de 48 h (politique SLA).</p>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Tickets ouverts" value={v(d.tickets)} def="Status open, assigned, waiting_user ou waiting_internal." to="/admin/support" search={{ status: "open" }} />
        <Card label="Haute priorité non résolus" value={v(d.ticketsHigh)} def="Priorité high ou critical + statut ouvert." to="/admin/support" search={{ status: "open" }} />
        <Card label="1re réponse moyenne" value={d.frAvg == null ? (d.frN === 0 ? "—" : "…") : `${d.frAvg} h`} def={`Écart création → 1er message staff, sur ${d.frN ?? "…"} ticket(s) ouvert(s) répondu(s) (100 max).`} />
        <Card label="Tickets en retard" value={v(d.frOver)} def="Ouverts sans réponse staff depuis plus de 48 h." to="/admin/support" search={{ status: "open" }} />
      </div>

      <h2 className="mt-6 font-medium text-[#555]">E · Santé système</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Supabase" value={d.pingMs == null ? "…" : `${d.pingMs} ms`} def="Aller-retour mesuré sur une requête head (connectivité temps réel)." />
        {d.mailNull ? (
          <Missing label="E-mails" def="Journal swivv_email_log illisible pour ce rôle." />
        ) : (
          <>
            <Card label="E-mails envoyés" value={String(d.mailSent ?? "…")} def="Journal swivv_email_log, status sent (total)." />
            <Card label="E-mails en échec" value={String(d.mailFail ?? "…")} def="Journal swivv_email_log, status failed (total)." />
          </>
        )}
        <Missing label="Erreurs applicatives" def="Aucune instrumentation d'erreurs déployée." />
      </div>
      <p className="mt-2 text-xs text-[#999]">Pas de traitements planifiés configurés (ni worker d'envoi d'e-mails, ni cron) — les files d'annonces et d'e-mails sont traitées manuellement.</p>
    </div>
  );
}
