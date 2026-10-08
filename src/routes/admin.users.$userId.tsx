import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit, useAdminRole } from "@/lib/admin";

export const Route = createFileRoute("/admin/users/$userId")({
  component: AdminUserDetail,
} as any);

const TABS = ["Aperçu", "Profil", "Photos", "Likes", "Matchs", "Messages", "Signalements", "Blocs", "Modération", "Vérification", "Confiance", "Support", "Notifications", "Notes", "Timeline"] as const;

// ponytail: missing social tables read as "not collected yet" (migration pending) — never fake zeros; the flag flips automatically once applied
async function safe<T>(p: PromiseLike<{ data: T | null; error: unknown }>, miss: { v: boolean }): Promise<T | null> {
  try {
    const { data, error } = await p;
    if (error) {
      if (String((error as any)?.message ?? error).match(/does not exist|relation .* not found|schema cache/i)) miss.v = true;
      return null;
    }
    return data;
  } catch {
    miss.v = true;
    return null;
  }
}

function AdminUserDetail() {
  const { userId } = (Route as any).useParams();
  const { level } = useAdminRole();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Aperçu");
  const [profile, setProfile] = useState<any>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [verif, setVerif] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketMsgs, setTicketMsgs] = useState<Record<string, any[]>>({});
  const [cases, setCases] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [likesSent, setLikesSent] = useState<any[]>([]);
  const [likesRecv, setLikesRecv] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [blocksOut, setBlocksOut] = useState<any[]>([]);
  const [blocksIn, setBlocksIn] = useState<any[]>([]);
  const [viewsRecv, setViewsRecv] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [related, setRelated] = useState<any[]>([]);
  const [missing, setMissing] = useState(false);
  const [draft, setDraft] = useState("");
  const [warnMsg, setWarnMsg] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [suspendFor, setSuspendFor] = useState("7");
  const [confirmBan, setConfirmBan] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tlKind, setTlKind] = useState("all");
  const canAct = level >= 80;
  const canReadMsgs = level >= 50;

  async function refresh() {
    setErr(null);
    const miss = { v: false };
    try {
      const q = supabase as any;
      const [p, st, n, rep, v, t, c, nt, m, ls, lr, ma, bo, bi, vr, au] = await Promise.all([
        safe(q.from("swivv_profiles").select("data,updated_at").eq("user_id", userId).maybeSingle(), miss),
        safe(q.from("swivv_user_status").select("status").eq("user_id", userId).maybeSingle(), miss),
        safe(q.from("swivv_internal_notes").select("*").eq("target_kind", "user").eq("target_id", userId).order("created_at", { ascending: false }).limit(50), miss),
        safe(q.from("swivv_reports").select("*").or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`).order("created_at", { ascending: false }).limit(100), miss),
        safe(q.from("swivv_verification_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20), miss),
        safe(q.from("swivv_support_tickets").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50), miss),
        safe(q.from("swivv_moderation_cases").select("*").eq("subject_user_id", userId).order("created_at", { ascending: false }).limit(50), miss),
        safe(q.from("swivv_notifications").select("type,title,message,read,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50), miss),
        safe(q.from("swivv_chats").select("peer_id,sender,body,audio_url,created_at").or(`user_id.eq.${userId},peer_id.eq.u:${userId}`).order("created_at", { ascending: false }).limit(50), miss),
        safe(q.from("swivv_likes").select("liked_id,created_at").eq("liker_id", userId).order("created_at", { ascending: false }).limit(200), miss),
        safe(q.from("swivv_likes").select("liker_id,created_at").eq("liked_id", userId).order("created_at", { ascending: false }).limit(200), miss),
        safe(q.from("swivv_matches").select("user_a,user_b,created_at").or(`user_a.eq.${userId},user_b.eq.${userId}`).order("created_at", { ascending: false }).limit(200), miss),
        safe(q.from("swivv_blocks").select("blocked_id,created_at").eq("blocker_id", userId).order("created_at", { ascending: false }).limit(200), miss),
        safe(q.from("swivv_blocks").select("blocker_id,created_at").eq("blocked_id", userId).order("created_at", { ascending: false }).limit(200), miss),
        safe(q.from("swivv_profile_views").select("viewer_id,created_at").eq("viewed_id", userId).order("created_at", { ascending: false }).limit(200), miss),
        safe(q.from("swivv_audit_log").select("action,actor_id,created_at,metadata").eq("target_id", userId).order("created_at", { ascending: false }).limit(100), miss),
      ]);
      setMissing(miss.v);
      if ((p as any)?.data) {
        setProfile((p as any).data);
        setUpdatedAt((p as any).updated_at ?? null);
      }
      if ((st as any)?.status) setStatus((st as any).status);
      setNotes(n ?? []);
      setReports(rep ?? []);
      setVerif(v ?? []);
      setTickets(t ?? []);
      setCases(c ?? []);
      setNotifs(nt ?? []);
      setMessages(m ?? []);
      setLikesSent(ls ?? []);
      setLikesRecv(lr ?? []);
      setMatches(ma ?? []);
      setBlocksOut(bo ?? []);
      setBlocksIn(bi ?? []);
      setViewsRecv(vr ?? []);
      setAuditTrail(au ?? []);
      if ((m ?? []).length > 0) audit("admin.user.messages", "user", userId, { count: (m ?? []).length });
      // resolve counterpart names in one query
      const ids = new Set<string>();
      const grab = (rows: any[], ...keys: string[]) => rows.forEach((r) => keys.forEach((k) => {
        const bare = typeof r[k] === "string" && r[k].startsWith("u:") ? r[k].slice(2) : r[k];
        if (bare && /^[0-9a-f-]{36}$/i.test(bare)) ids.add(bare);
      }));
      grab(ls ?? [], "liked_id");
      grab(lr ?? [], "liker_id");
      grab(ma ?? [], "user_a", "user_b");
      grab(bo ?? [], "blocked_id");
      grab(bi ?? [], "blocker_id");
      grab(vr ?? [], "viewer_id");
      grab(m ?? [], "peer_id");
      grab(rep ?? [], "reporter_id", "reported_user_id");
      for (const mid of [...mirrorIds((p as any)?.data?.likes ?? []), ...mirrorIds((p as any)?.data?.matches ?? [])]) {
        const bare = mid.startsWith("u:") ? mid.slice(2) : mid;
        if (/^[0-9a-f-]{36}$/i.test(bare)) ids.add(bare);
      }
      ids.delete(userId);
      if (ids.size) {
        const { data: rows } = await q.from("swivv_profiles").select("user_id,data").in("user_id", [...ids].slice(0, 200));
        const map: Record<string, string> = {};
        for (const r of (rows as any[]) ?? []) map[r.user_id] = (r.data as any)?.name ?? r.user_id.slice(0, 8);
        setNames(map);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }

  // related accounts: reporters of X who reported others too (shared-reporter overlap)
  useEffect(() => {
    if (!reports.length) {
      setRelated([]);
      return;
    }
    const reporters = [...new Set(reports.filter((r) => r.reported_user_id === userId).map((r) => r.reporter_id).filter(Boolean))];
    if (!reporters.length) {
      setRelated([]);
      return;
    }
    (supabase as any)
      .from("swivv_reports")
      .select("reported_user_id")
      .in("reporter_id", reporters)
      .neq("reported_user_id", userId)
      .limit(200)
      .then(({ data }: any) => {
        const count: Record<string, number> = {};
        for (const r of data ?? []) count[r.reported_user_id] = (count[r.reported_user_id] ?? 0) + 1;
        setRelated(Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ id, sharedReporters: n })));
      });
  }, [reports, userId]);

  useEffect(() => {
    refresh();
    audit("admin.user.view", "user", userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const d = profile ?? {};
  const fmtDate = (v: any) => {
    if (!v) return "—";
    const t = new Date(v);
    return isNaN(+t) ? String(v) : t.toLocaleDateString("fr-FR");
  };
  const nm = (id: string) => {
    if (!id) return "—";
    const bare = id.startsWith("u:") ? id.slice(2) : id;
    if (/^[0-9a-f-]{36}$/i.test(bare)) return names[bare] ?? `${bare.slice(0, 8)}…`;
    return `Démo #${bare}`;
  };

  // ponytail: explainable risk from real signals only (no protected attributes, no black box) — thresholds split when volume grows
  const risk = useMemo(() => {
    const reasons: string[] = [];
    let s = 0;
    const month = Date.now() - 30 * 864e5;
    const recentRep = reports.filter((r) => r.reported_user_id === userId && new Date(r.created_at).getTime() > month);
    if (recentRep.length) {
      s += recentRep.length * 2;
      reasons.push(`${recentRep.length} signalement(s) reçu(s) en 30 j`);
    }
    const confirmed = reports.filter((r) => r.reported_user_id === userId && ["resolved"].includes(r.status)).length;
    if (confirmed) {
      s += confirmed * 2;
      reasons.push(`${confirmed} signalement(s) confirmé(s)`);
    }
    if (blocksIn.length) {
      s += Math.min(blocksIn.length, 5);
      reasons.push(`${blocksIn.length} blocage(s) reçu(s)`);
    }
    if (status === "suspended" || status === "banned" || auditTrail.some((a) => /suspend|banned/.test(a.action))) {
      s += 3;
      reasons.push("suspension/ban actuel ou passé");
    }
    if (d.joinedAt && Date.now() - new Date(d.joinedAt).getTime() < 7 * 864e5) {
      s += 1;
      reasons.push("compte de moins de 7 jours");
    }
    const failedVerif = verif.filter((x) => x.status === "rejected").length;
    if (failedVerif) {
      s += failedVerif;
      reasons.push(`vérification rejetée ×${failedVerif}`);
    }
    const lvl = s >= 7 ? "CRITIQUE" : s >= 4 ? "ÉLEVÉ" : s >= 2 ? "MOYEN" : "FAIBLE";
    return { score: s, level: lvl, reasons };
  }, [reports, blocksIn, status, auditTrail, verif, d.joinedAt, userId]);

  const repSent = reports.filter((r) => r.reporter_id === userId);
  const repRecv = reports.filter((r) => r.reported_user_id === userId);
  const completeness = useMemo(() => {
    const checks: [string, boolean][] = [
      ["Bio", !!d.bio],
      ["Tagline", !!d.tagline],
      ["Centres d'intérêt", Array.isArray(d.interests) ? d.interests.length > 0 : !!d.interests],
      ["Métier", !!d.occupation],
      ["Photos", (d.photos ?? []).length > 0],
    ];
    const done = checks.filter(([, ok]) => ok).length;
    return { pct: Math.round((done / checks.length) * 100), missing: checks.filter(([, ok]) => !ok).map(([k]) => k), photos: (d.photos ?? []).length };
  }, [d]);

  // ponytail: browser mirrors (data.likes/matches) stand in until the social migration lands — server rows win when both exist; mirrors carry no timestamps
  const mirrorIds = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const sentAll = likesSent.length ? likesSent.map((x) => ({ id: x.liked_id as string, at: x.created_at as string | null, approx: false })) : mirrorIds(d.likes).map((id) => ({ id, at: null as string | null, approx: true }));
  const recvAll = likesRecv.length ? likesRecv.map((x) => ({ id: x.liker_id as string, at: x.created_at as string | null, approx: false })) : [];
  const matchAll = matches.length ? matches.map((x) => ({ id: (x.user_a === userId ? x.user_b : x.user_a) as string, at: x.created_at as string | null, approx: false })) : mirrorIds(d.matches).map((id) => ({ id: id.startsWith("u:") ? id.slice(2) : id, at: null as string | null, approx: true }));

  const timeline = useMemo(() => {
    const ev: { at: string; kind: string; label: string }[] = [];
    if (d.joinedAt) ev.push({ at: d.joinedAt, kind: "account", label: "Compte créé" });
    if (updatedAt) ev.push({ at: updatedAt, kind: "profile", label: "Profil mis à jour" });
    for (const r of reports) ev.push({ at: r.created_at, kind: "reports", label: r.reporter_id === userId ? `Signalement envoyé (${r.category})` : `Signalé (${r.category})` });
    for (const c of cases) ev.push({ at: c.created_at, kind: "moderation", label: `Cas modération (${c.status})` });
    for (const t of tickets) ev.push({ at: t.created_at, kind: "support", label: `Ticket « ${t.subject ?? t.category} » (${t.status})` });
    for (const x of verif) ev.push({ at: x.created_at, kind: "verification", label: `Vérification ${x.kind} (${x.status})` });
    for (const a of auditTrail) ev.push({ at: a.created_at, kind: "moderation", label: `Admin: ${a.action}` });
    for (const l of sentAll) ev.push({ at: l.at ?? updatedAt ?? d.joinedAt, kind: "likes", label: `Like vers ${nm(l.id)}${l.approx ? " (navigateur, date inconnue)" : ""}` });
    for (const l of recvAll) ev.push({ at: l.at ?? updatedAt ?? d.joinedAt, kind: "likes", label: `Like reçu de ${nm(l.id)}${l.approx ? " (navigateur, date inconnue)" : ""}` });
    for (const m of matchAll) ev.push({ at: m.at ?? updatedAt ?? d.joinedAt, kind: "likes", label: `Match avec ${nm(m.id)}${m.approx ? " (navigateur, date inconnue)" : ""}` });
    // ponytail: one event per conversation (metadata only — bodies never enter the timeline) — per-message rows if volume ever needs them
    const peers = new Map<string, { n: number; last: string }>();
    for (const m of messages) {
      const p = peers.get(m.peer_id) ?? { n: 0, last: m.created_at };
      p.n += 1;
      if (m.created_at > p.last) p.last = m.created_at;
      peers.set(m.peer_id, p);
    }
    for (const [peer, s] of peers) ev.push({ at: s.last, kind: "messages", label: `Conversation avec ${nm(peer)} — ${s.n} message(s)` });
    for (const n of notes) ev.push({ at: n.created_at, kind: "notes", label: `Note interne ajoutée` });
    return ev.filter((e) => e.at).sort((a, b) => +new Date(b.at) - +new Date(a.at)).filter((e) => tlKind === "all" || e.kind === tlKind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, cases, tickets, verif, auditTrail, matches, notes, messages, sentAll, recvAll, matchAll, d.joinedAt, updatedAt, tlKind, names]);

  async function setAccountStatus(next: string, days?: number) {
    setMsg(null);
    const until = next === "suspended" && days ? new Date(Date.now() + days * 864e5).toISOString() : null;
    const { error } = await (supabase as any).from("swivv_user_status").upsert(
      { user_id: userId, status: next, reason: null, until, updated_by: (await supabase.auth.getUser()).data.user?.id },
      { onConflict: "user_id" },
    );
    if (error) {
      setMsg(error.message);
      return;
    }
    setStatus(next);
    setConfirmBan(false);
    audit(`admin.user.${next}`, "user", userId, days ? { days } : undefined);
    setMsg(next === "active" ? "Compte restauré." : `Statut → ${next}${until ? ` jusqu'au ${new Date(until).toLocaleDateString("fr-FR")}` : ""}.`);
  }

  async function updateData(mut: (cur: any) => any, action: string, okMsg: string) {
    setMsg(null);
    const { data: row } = await (supabase as any).from("swivv_profiles").select("data").eq("user_id", userId).maybeSingle();
    const { error } = await (supabase as any).from("swivv_profiles").update({ data: mut((row as any)?.data ?? {}) }).eq("user_id", userId);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit(action, "user", userId);
    setMsg(okMsg);
    refresh();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("swivv_internal_notes").insert({ target_kind: "user", target_id: userId, author_id: user?.id, body: draft.trim() });
    if (error) {
      setMsg(error.message);
      return;
    }
    setDraft("");
    audit("admin.note.add", "user", userId);
    refresh();
  }

  async function warn() {
    if (!warnMsg.trim()) return;
    const { error } = await (supabase as any).from("swivv_notifications").insert({ user_id: userId, type: "warning", title: "Avertissement", message: warnMsg.trim() });
    if (error) {
      setMsg(error.message);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from("swivv_internal_notes").insert({ target_kind: "user", target_id: userId, author_id: user?.id, body: `Avertissement envoyé : ${warnMsg.trim()}` });
    audit("admin.user.warn", "user", userId);
    setWarnMsg("");
    setMsg("Avertissement envoyé + noté.");
    refresh();
  }

  async function contact() {
    if (!contactMsg.trim()) return;
    const { error } = await (supabase as any).from("swivv_notifications").insert({ user_id: userId, type: "admin", title: "Message de l'équipe SWIVV", message: contactMsg.trim() });
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.user.contact", "user", userId);
    setContactMsg("");
    setMsg("Message envoyé au membre.");
  }

  function exportJson() {
    const bundle = { userId, exportedAt: new Date().toISOString(), status, profile: d, reports, verif, tickets, cases, notifs, messagesMeta: messages, likesSent, likesRecv, matches, blocksOut, blocksIn, viewsRecv, auditTrail, risk };
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `member-${userId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    audit("admin.user.export", "user", userId, { format: "json" });
    setMsg("Export JSON téléchargé + tracé dans l'audit.");
  }

  const riskCls = risk.level === "FAIBLE" ? "bg-green-100 text-green-800" : risk.level === "MOYEN" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
  const stat = (k: string, v: number | string) => (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <p className="text-xs uppercase text-[#999]">{k}</p>
      <p className="text-xl font-medium text-[#333]">{v}</p>
    </div>
  );
  const rows = (items: any[], render: (x: any, i: number) => React.ReactNode, empty: string) => (
    <ul className="mt-2 space-y-1 text-sm">{items.length ? items.map(render) : <li className="text-[#999]">{empty}</li>}</ul>
  );

  return (
    <div>
      {/* sticky member header */}
      <div className="sticky top-0 z-10 -mx-2 bg-[#f4f3fa]/95 px-2 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
          {(d.photos ?? [])[0] ? <img src={d.photos[0]} alt="" className="h-14 w-14 rounded-full object-cover" /> : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e91e63] text-xl text-white">{(d.name ?? "?").charAt(0)}</span>}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-medium text-[#333]">{d.name ?? userId}{d.age ? `, ${d.age}` : ""}{d.city ? ` · ${d.city}` : ""}</h1>
            <p className="truncate font-mono text-xs text-[#999]">{userId}</p>
            <p className="mt-0.5 flex flex-wrap gap-1 text-xs">
              <span className={`rounded-full px-2 py-0.5 ${status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>● {status.toUpperCase()}</span>
              <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[#555]">{verif.some((x) => x.status === "approved") ? "✓ vérifié" : "non vérifié"}</span>
              <span className={`rounded-full px-2 py-0.5 ${riskCls}`}>⚠ risque {risk.level}</span>
              <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[#555]">Premium : non collecté</span>
            </p>
            <p className="mt-0.5 text-xs text-[#999]">Membre depuis le {fmtDate(d.joinedAt)} · actif : {d.lastActive ? fmtDate(d.lastActive) : "—"} · complétion {completeness.pct} %</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {canAct && (
              <>
                <button type="button" onClick={() => setAccountStatus("suspended", Number(suspendFor))} className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white">Suspendre</button>
                <button type="button" onClick={() => setConfirmBan(true)} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white">Bannir</button>
                <button type="button" onClick={() => setAccountStatus("active")} className="rounded-md border border-border px-3 py-1.5 text-sm text-[#555]">Restaurer</button>
                <button type="button" onClick={exportJson} className="rounded-md border border-border px-3 py-1.5 text-sm text-[#555]">Export JSON</button>
              </>
            )}
          </div>
        </div>
        {confirmBan && (
          <div role="alert" className="mt-2 rounded-lg bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">Bannissement définitif — confirmer une 2ᵉ fois. Enregistré dans l'audit avec ton identité.</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setAccountStatus("banned")} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white">Oui, bannir définitivement</button>
              <button type="button" onClick={() => setConfirmBan(false)} className="rounded-md border border-border bg-white px-4 py-2 text-sm text-[#555]">Annuler</button>
            </div>
          </div>
        )}
      </div>

      {err && <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err} <button type="button" onClick={refresh} className="font-medium underline">Réessayer</button></p>}
      {msg && <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">{msg}</p>}
      {missing && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Likes/matchs/blocs/vues : table(s) non collectée(s) — applique la migration <code>20261008000000_member360_social.sql</code>. Les chiffres affichés restent locaux au navigateur du membre.</p>}

      <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Sections membre">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === t ? "bg-[#14112b] text-white" : "bg-white text-[#555]"}`}>{t}</button>
        ))}
      </nav>

      {tab === "Aperçu" && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stat("Likes envoyés", sentAll.length)}
          {stat("Likes reçus", recvAll.length)}
          {stat("Matchs", matchAll.length)}
          {stat("Messages", messages.length)}
          {stat("Vues reçues", viewsRecv.length)}
          {stat("Signalements reçus", repRecv.length)}
          {stat("Blocs reçus", blocksIn.length)}
          {stat("Risque", risk.level)}
        </div>
      )}

      {tab === "Profil" && (
        <section className="mt-3 rounded-xl bg-white p-4 shadow-sm">
          {d.tagline ? <p className="text-sm italic text-[#777]">« {d.tagline} »</p> : null}
          {d.bio ? <p className="mt-2 text-sm text-[#555]">{d.bio}</p> : null}
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm lg:grid-cols-3">
            {Object.entries(d).filter(([k, v]) => !["photos", "likes", "matches", "tagline", "bio"].includes(k) && v !== "" && v != null).map(([k, v]) => (
              <div key={k}><dt className="text-[#999]">{k}</dt><dd className="break-words text-[#333]">{Array.isArray(v) ? v.join(", ") : String(v)}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-[#555]">Complétion : {completeness.pct} % · photos : {completeness.photos}{completeness.missing.length ? ` · manque : ${completeness.missing.join(", ")}` : ""}</p>
          {canAct && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => updateData((cur) => ({ ...cur, profileHidden: !(cur as any).profileHidden }), "admin.user.hide", (d as any).profileHidden ? "Profil ré-affiché." : "Profil masqué.")} className="rounded-md border border-border px-3 py-1.5 text-sm text-[#555]">{(d as any).profileHidden ? "Ré-afficher le profil" : "Masquer le profil"}</button>
            </div>
          )}
        </section>
      )}

      {tab === "Photos" && (
        <section className="mt-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(d.photos ?? []).map((p: string, i: number) => (
              <div key={p} className="relative">
                <img src={p} alt="" className="aspect-square w-full rounded-lg object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-[#e91e63] px-2 py-0.5 text-xs text-white">Principale</span>}
                {canAct && (
                  <div className="mt-1 flex gap-1">
                    {i > 0 && <button type="button" onClick={() => updateData((cur) => ({ ...cur, photos: [p, ...((cur as any).photos ?? []).filter((x: string) => x !== p)] }), "admin.photo.primary", "Photo principale mise à jour.")} className="rounded border border-border px-2 py-0.5 text-xs text-[#555]">Principale</button>}
                    <button type="button" onClick={() => { if (window.confirm("Retirer cette photo de l'affichage ? (l'asset n'est pas détruit)")) updateData((cur) => ({ ...cur, photos: ((cur as any).photos ?? []).filter((x: string) => x !== p) }), "admin.photo.remove", "Photo retirée de l'affichage."); }} className="rounded border border-border px-2 py-0.5 text-xs text-red-700">Retirer</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {(d.photos ?? []).length === 0 && <p className="text-sm text-[#999]">Aucune photo.</p>}
        </section>
      )}

      {tab === "Likes" && (
        <section className="mt-3 grid gap-2 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-medium text-[#333]">Envoyés ({sentAll.length})</h2>
            {rows(sentAll, (x, i) => <li key={i} className="text-[#555]"><MemberLink id={x.id} name={nm(x.id)} /> · {x.at ? fmtDate(x.at) : "date inconnue"} {x.approx ? <em className="text-xs text-[#999]">(navigateur)</em> : null}</li>, missing ? "Non collecté." : "Aucun.")}
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-medium text-[#333]">Reçus ({recvAll.length})</h2>
            {rows(recvAll, (x, i) => <li key={i} className="text-[#555]"><MemberLink id={x.id} name={nm(x.id)} /> · {x.at ? fmtDate(x.at) : "date inconnue"}</li>, missing ? "Non collecté." : "Aucun.")}
          </div>
        </section>
      )}

      {tab === "Matchs" && (
        <section className="mt-3 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-medium text-[#333]">Matchs ({matchAll.length}) — consentement mutuel réel</h2>
          {rows(matchAll, (x, i) => <li key={i} className="text-[#555]"><MemberLink id={x.id} name={nm(x.id)} /> · {x.at ? `depuis le ${fmtDate(x.at)}` : "date inconnue"} {x.approx ? <em className="text-xs text-[#999]">(navigateur)</em> : null}</li>, missing ? "Non collecté." : "Aucun.")}
        </section>
      )}

      {tab === "Messages" && (
        <section className="mt-3 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-medium text-[#333]">Conversations ({messages.length} messages récents)</h2>
          <p className="text-xs text-[#999]">{canReadMsgs ? "Accès tracé dans l'audit — n'ouvrir que pour une enquête." : "Contenus réservés aux modérateurs (niveau 50+)."}</p>
          <ul className="mt-2 max-h-96 space-y-1 overflow-y-auto text-sm">
            {messages.map((m: any, i: number) => (
              <li key={`${m.created_at}-${i}`} className="text-[#555]">
                <span className={`font-medium ${m.sender === "me" ? "text-[#e91e63]" : "text-[#333]"}`}>{m.sender === "me" ? "→" : "←"}</span> <MemberLink id={m.peer_id} name={nm(m.peer_id)} />{" "}
                {canReadMsgs ? (m.audio_url ? <em className="text-[#999]">[vocal]</em> : (m.body || "—")) : <em className="text-[#999]">[contenu masqué]</em>}{" "}
                <span className="text-xs text-[#999]">· {new Date(m.created_at).toLocaleString("fr-FR")}</span>
              </li>
            ))}
            {messages.length === 0 && <li className="text-[#999]">Aucun.</li>}
          </ul>
        </section>
      )}

      {tab === "Signalements" && (
        <section className="mt-3 grid gap-2 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-medium text-[#333]">Reçus ({repRecv.length})</h2>
            {rows(repRecv, (r) => <li key={r.id} className="text-[#555]">{r.category} · {r.priority} · {r.status} — de {nm(r.reporter_id)} · {fmtDate(r.created_at)}{r.description ? ` — « ${r.description} »` : ""}</li>, "Aucun.")}
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-medium text-[#333]">Envoyés ({repSent.length}) — confirmés {repSent.filter((r) => r.status === "resolved").length} · rejetés {repSent.filter((r) => r.status === "dismissed").length}</h2>
            {rows(repSent, (r) => <li key={r.id} className="text-[#555]">{r.category} · {r.status} — contre {nm(r.reported_user_id)} · {fmtDate(r.created_at)}</li>, "Aucun.")}
          </div>
        </section>
      )}

      {tab === "Blocs" && (
        <section className="mt-3 grid gap-2 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-medium text-[#333]">Effectués ({blocksOut.length})</h2>
            {rows(blocksOut, (x, i) => <li key={i} className="text-[#555]"><MemberLink id={x.blocked_id} name={nm(x.blocked_id)} /> · {fmtDate(x.created_at)}</li>, missing ? "Non collecté." : "Aucun.")}
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-medium text-[#333]">Reçus ({blocksIn.length})</h2>
            {rows(blocksIn, (x, i) => <li key={i} className="text-[#555]"><MemberLink id={x.blocker_id} name={nm(x.blocker_id)} /> · {fmtDate(x.created_at)}</li>, missing ? "Non collecté." : "Aucun.")}
          </div>
        </section>
      )}

      {tab === "Modération" && (
        <section className="mt-3 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-medium text-[#333]">Cas ({cases.length}) + historique audit ({auditTrail.length})</h2>
          {rows([...cases.map((c) => ({ at: c.created_at, label: `Cas ${c.status}${c.action_taken ? ` → ${c.action_taken}` : ""}` })), ...auditTrail.map((a) => ({ at: a.created_at, label: `Admin ${a.action}` }))],
            (x, i) => <li key={i} className="text-[#555]">{x.label} · {new Date(x.at).toLocaleString("fr-FR")}</li>, "Aucun antécédent.")}
          {canAct && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select value={suspendFor} onChange={(e) => setSuspendFor(e.target.value)} aria-label="Durée de suspension" className="rounded-md border border-border bg-white px-3 py-2 text-sm">
                <option value="1">24 h</option>
                <option value="7">7 jours</option>
                <option value="30">30 jours</option>
              </select>
              <button type="button" onClick={() => setAccountStatus("suspended", Number(suspendFor))} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white">Suspendre</button>
              <input value={warnMsg} onChange={(e) => setWarnMsg(e.target.value)} placeholder="Motif de l'avertissement…" maxLength={500} aria-label="Motif" className="min-w-52 flex-1 rounded-md border border-border px-3 py-2 text-sm" />
              <button type="button" onClick={warn} className="rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white">Avertir</button>
            </div>
          )}
        </section>
      )}

      {tab === "Vérification" && (
        <section className="mt-3 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-[#999]">Le badge « vérifié » du profil est auto-déclaré côté client — seules les demandes ci-dessous font foi.</p>
          {rows(verif, (x, i) => <li key={i} className="text-[#555]">{x.kind} · {x.status} · {fmtDate(x.created_at)}</li>, "Aucune demande.")}
        </section>
      )}

      {tab === "Confiance" && (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-medium text-[#333]">Risque : <span className={`rounded-full px-2 py-0.5 text-sm ${riskCls}`}>{risk.level}</span> <span className="text-xs text-[#999]">(score {risk.score})</span></h2>
            <ul className="mt-2 space-y-1 text-sm">{risk.reasons.length ? risk.reasons.map((r, i) => <li key={i} className="text-[#555]">⚠ {r}</li>) : <li className="text-[#999]">Aucun signal.</li>}</ul>
            <p className="mt-2 text-xs text-[#999]">Indicateurs opérationnels uniquement — jamais une preuve, jamais basé sur des attributs sensibles.</p>
          </section>
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-medium text-[#333]">Comptes potentiellement liés ({related.length})</h2>
            <p className="text-xs text-[#999]">Via signaleurs communs — à investiguer, jamais un motif de ban automatique.</p>
            {rows(related, (r) => <li key={r.id} className="text-[#555]"><MemberLink id={r.id} name={nm(r.id)} /> · {r.sharedReporters} signaleur(s) en commun</li>, "Aucun.")}
            <h2 className="mt-3 font-medium text-[#333]">Sécurité</h2>
            <p className="mt-1 text-sm text-[#999]">Sessions, appareils, IPs, historique de connexion : non collectés à ce jour. Statut : {status}.</p>
          </section>
        </div>
      )}

      {tab === "Support" && (
        <section className="mt-3 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-medium text-[#333]">Tickets ({tickets.length})</h2>
          {rows(tickets, (t) => (
            <li key={t.id} className="text-[#555]">
              « {t.subject ?? t.category} » · {t.status} · {fmtDate(t.created_at)}{" "}
              <button type="button" onClick={async () => {
                if (ticketMsgs[t.id]) {
                  setTicketMsgs((m) => ({ ...m, [t.id]: undefined as any }));
                  return;
                }
                const { data } = await (supabase as any).from("swivv_support_messages").select("body,is_staff,created_at").eq("ticket_id", t.id).order("created_at");
                setTicketMsgs((m) => ({ ...m, [t.id]: data ?? [] }));
              }} className="text-xs text-[#e91e63] hover:underline">{ticketMsgs[t.id] ? "Masquer" : "Voir"}</button>
              {ticketMsgs[t.id]?.map((m: any, i: number) => <span key={i} className="block pl-3 text-[13px] text-[#777]">{m.is_staff ? "Équipe" : "Membre"} : {m.body}</span>)}
            </li>
          ), "Aucun.")}
          {canAct && (
            <div className="mt-3 flex gap-2">
              <input value={contactMsg} onChange={(e) => setContactMsg(e.target.value)} placeholder="Écrire au membre (notification)…" maxLength={1000} aria-label="Message au membre" className="flex-1 rounded-md border border-border px-3 py-2 text-sm" />
              <button type="button" onClick={contact} className="rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white">Contacter</button>
            </div>
          )}
        </section>
      )}

      {tab === "Notifications" && (
        <section className="mt-3 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-medium text-[#333]">Notifications envoyées ({notifs.length})</h2>
          {rows(notifs, (n: any, i: number) => <li key={i} className="text-[#555]">[{n.type}] {n.title} — {n.read ? "lu" : "non lu"} · {new Date(n.created_at).toLocaleString("fr-FR")}</li>, "Aucune.")}
        </section>
      )}

      {tab === "Notes" && (
        <section className="mt-3 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-medium text-[#333]">Notes internes (invisibles à l'utilisateur)</h2>
          <form onSubmit={addNote} className="mt-2 flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ajouter une note…" maxLength={1000} aria-label="Note interne" className="flex-1 rounded-md border border-border px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white">Noter</button>
          </form>
          <ul className="mt-2 space-y-2">
            {notes.map((n: any) => (
              <li key={n.id} className="rounded-lg bg-[#f7f7f7] p-2 text-sm text-[#555]">{n.body}<span className="block text-xs text-[#999]">{new Date(n.created_at).toLocaleString("fr-FR")}</span></li>
            ))}
          </ul>
        </section>
      )}

      {tab === "Timeline" && (
        <section className="mt-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-[#333]">Timeline ({timeline.length})</h2>
            <select value={tlKind} onChange={(e) => setTlKind(e.target.value)} aria-label="Filtrer" className="rounded-md border border-border bg-white px-2 py-1 text-sm">
              {[["all", "Tout"], ["account", "Compte"], ["profile", "Profil"], ["likes", "Likes/matchs"], ["messages", "Messages"], ["moderation", "Modération"], ["reports", "Signalements"], ["support", "Support"], ["verification", "Vérification"], ["notes", "Notes"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <ul className="mt-2 max-h-96 space-y-1 overflow-y-auto text-sm">
            {timeline.map((e, i) => <li key={i} className="text-[#555]"><span className="text-xs text-[#999]">{new Date(e.at).toLocaleString("fr-FR")}</span> — {e.label}</li>)}
            {timeline.length === 0 && <li className="text-[#999]">Aucun événement.</li>}
          </ul>
        </section>
      )}
    </div>
  );
}

function MemberLink({ id, name }: { id: string; name: string }) {
  const bare = id.startsWith("u:") ? id.slice(2) : id;
  if (!/^[0-9a-f-]{36}$/i.test(bare)) return <span>{name}</span>;
  return <a href={`/admin/users/${bare}`} className="text-[#e91e63] hover:underline">{name}</a>;
}
