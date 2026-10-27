import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { audit } from "@/lib/admin";
import { repeatCounts, sortQueue, timeSince } from "@/lib/admin-reports";

const STATUSES = ["new", "investigating", "waiting", "resolved", "dismissed"];
const PRIORITIES = ["low", "normal", "high", "critical"];

export const Route = createFileRoute("/admin/reports")({
  validateSearch: (s: Record<string, unknown>) => ({ status: typeof s.status === "string" ? s.status : undefined }),
  component: AdminReports,
} as any);

type Detail = { prev: any[]; cases: any[]; audit: any[]; tickets: any[]; notes: any[] } | null;

// ponytail: 200 newest server-side + client filters (status server-filtered, rest client) — keyset pagination when the queue outgrows 200
function AdminReports() {
  const [rows, setRows] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [staff, setStaff] = useState<{ id: string; role: string }[]>([]);
  const [filter, setFilter] = useState((Route.useSearch() as any).status ?? "new");
  const [cat, setCat] = useState("all");
  const [pri, setPri] = useState("all");
  const [date, setDate] = useState("all");
  const [assign, setAssign] = useState("all");
  const [repeatsOnly, setRepeatsOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, Detail>>({});
  const [resolution, setResolution] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);

  async function load() {
    let q = supabase.from("swivv_reports").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) {
      setMsg(error.message);
      return;
    }
    const list = (data ?? []) as any[];
    setRows(list);
    const { data: { user } } = await supabase.auth.getUser();
    setMyId(user?.id ?? null);
    const ids = new Set<string>();
    for (const r of list) for (const k of ["reporter_id", "reported_user_id", "assigned_to"]) if (typeof r[k] === "string" && /^[0-9a-f-]{36}$/i.test(r[k])) ids.add(r[k]);
    const st = await (supabase as any).from("user_roles").select("user_id,role");
    const members = [...new Set([...ids, ...((st.data ?? []) as any[]).map((x) => x.user_id as string)])].slice(0, 200);
    if (members.length) {
      const { data: profs } = await (supabase as any).from("swivv_profiles").select("user_id,data").in("user_id", members);
      const map: Record<string, string> = {};
      for (const p of (profs as any[]) ?? []) map[p.user_id] = (p.data as any)?.name ?? p.user_id.slice(0, 8);
      setNames(map);
    }
    setStaff(((st.data ?? []) as any[]).map((x) => ({ id: x.user_id as string, role: x.role as string })));
  }

  useEffect(() => {
    load();
    audit("admin.reports.view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const nm = (id: string | null | undefined) => {
    if (!id) return "—";
    return /^[0-9a-f-]{36}$/i.test(id) ? (names[id] ?? `${id.slice(0, 8)}…`) : `Démo #${id}`;
  };
  const repeats = useMemo(() => repeatCounts(rows), [rows]);
  const cats = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean))], [rows]);
  const shown = useMemo(() => {
    const now = Date.now();
    const cut = date === "24h" ? now - 864e5 : date === "7d" ? now - 7 * 864e5 : date === "30d" ? now - 30 * 864e5 : 0;
    return sortQueue(
      rows.filter((r) => {
        if (cat !== "all" && r.category !== cat) return false;
        if (pri !== "all" && r.priority !== pri) return false;
        if (cut && new Date(r.created_at).getTime() < cut) return false;
        if (assign === "me" && r.assigned_to !== myId) return false;
        if (assign === "none" && r.assigned_to) return false;
        if (repeatsOnly && (repeats[r.reported_user_id] ?? 0) < 2) return false;
        return true;
      }),
      repeats,
    );
  }, [rows, cat, pri, date, assign, repeatsOnly, repeats, myId]);
  const distinctTargets = useMemo(() => new Set(rows.map((r) => r.reported_user_id).filter(Boolean)).size, [rows]);

  async function update(id: string, patch: Database["public"]["Tables"]["swivv_reports"]["Update"], log: string) {
    const { error } = await supabase.from("swivv_reports").update(patch).eq("id", id);
    if (error) {
      setMsg(error.message);
      return false;
    }
    audit(log, "report", id, patch as Record<string, unknown>);
    await load();
    return true;
  }

  async function openDetail(r: any) {
    if (openId === r.id) {
      setOpenId(null);
      return;
    }
    setOpenId(r.id);
    setResolution(r.resolution ?? "");
    if (detail[r.id] !== undefined) return;
    const q = supabase as any;
    const [prev, cases, au, tick, notes] = await Promise.all([
      q.from("swivv_reports").select("id,category,status,priority,created_at,resolution").eq("reported_user_id", r.reported_user_id).neq("id", r.id).order("created_at", { ascending: false }).limit(20),
      q.from("swivv_moderation_cases").select("id,status,action_taken,created_at").eq("subject_user_id", r.reported_user_id).order("created_at", { ascending: false }).limit(20),
      q.from("swivv_audit_log").select("action,created_at").eq("target_id", r.reported_user_id).order("created_at", { ascending: false }).limit(20),
      q.from("swivv_support_tickets").select("id,subject,status,created_at").eq("user_id", r.reported_user_id).order("created_at", { ascending: false }).limit(10),
      q.from("swivv_internal_notes").select("body,created_at").eq("target_kind", "report").eq("target_id", r.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setDetail((d) => ({ ...d, [r.id]: { prev: prev.data ?? [], cases: cases.data ?? [], audit: au.data ?? [], tickets: tick.data ?? [], notes: notes.data ?? [] } }));
  }

  async function requestInfo(r: any) {
    if (!r.reporter_id) {
      setMsg("Signaleur anonyme — impossible de demander un complément.");
      return;
    }
    const ok = await update(r.id, { status: "waiting" }, "admin.report.info_request");
    if (!ok) return;
    await (supabase as any).from("swivv_notifications").insert({ user_id: r.reporter_id, type: "admin", title: "Complément demandé", message: `L'équipe SWIVV examine ton signalement (${r.category}). Merci de préciser les faits via le support.` });
    setMsg("Complément demandé au signaleur.");
  }

  async function addNote(r: any) {
    if (!note.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("swivv_internal_notes").insert({ target_kind: "report", target_id: r.id, author_id: user?.id, body: note.trim() });
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.report.note", "report", r.id);
    setNote("");
    setDetail((d) => ({ ...d, [r.id]: undefined as any }));
    openDetail(r);
    setMsg("Note ajoutée.");
  }

  const sel = "rounded-md border border-border bg-white px-3 py-2 text-sm";

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Signalements ({shown.length})</h1>
      <p className="mt-1 text-xs text-[#999]">
        {rows.length} affichés · {distinctTargets} compte(s) signalé(s) distinct(s) — les doublons ne comptent qu'une fois par compte. Tri déterministe (critiques → récidivistes → récents) · IA non configurée.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre statut" className={sel}>
          {["all", ...STATUSES].map((s) => <option key={s} value={s}>{s === "all" ? "Tous" : s}</option>)}
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filtre catégorie" className={sel}>
          {["all", ...cats].map((s) => <option key={s} value={s}>{s === "all" ? "Toutes catégories" : s}</option>)}
        </select>
        <select value={pri} onChange={(e) => setPri(e.target.value)} aria-label="Filtre priorité" className={sel}>
          {["all", ...PRIORITIES].map((s) => <option key={s} value={s}>{s === "all" ? "Toutes priorités" : s}</option>)}
        </select>
        <select value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filtre date" className={sel}>
          {[["all", "Toutes dates"], ["24h", "24 h"], ["7d", "7 j"], ["30d", "30 j"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={assign} onChange={(e) => setAssign(e.target.value)} aria-label="Filtre assignation" className={sel}>
          {[["all", "Tous"], ["me", "Assignés à moi"], ["none", "Non assignés"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-sm text-[#555]">
          <input type="checkbox" checked={repeatsOnly} onChange={(e) => setRepeatsOnly(e.target.checked)} />
          Récidivistes (×2+)
        </label>
      </div>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}
      <div className="mt-4 space-y-2">
        {shown.map((r) => {
          const d = detail[r.id];
          const open = openId === r.id;
          return (
            <article key={r.id} className="rounded-xl bg-white p-3 shadow-sm">
              <button type="button" onClick={() => openDetail(r)} aria-expanded={open} className="flex w-full flex-wrap items-center gap-2 text-left text-sm">
                <strong className="text-[#333]">{r.category}</strong>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.priority === "critical" ? "bg-red-100 text-red-800" : "bg-[#f2f2f2] text-[#555]"}`}>{r.priority}</span>
                <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{r.status}</span>
                {(repeats[r.reported_user_id ?? ""] ?? 0) > 1 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">×{repeats[r.reported_user_id ?? ""]} signalements</span>
                )}
                <span className="text-xs text-[#777]">{nm(r.reporter_id)} → {nm(r.reported_user_id)}</span>
                <span className="ml-auto text-xs text-[#999]" title={new Date(r.created_at).toLocaleString("fr-FR")}>{timeSince(r.created_at)} · assigné : {r.assigned_to ? nm(r.assigned_to) : "—"}</span>
              </button>
              {open && (
                <div className="mt-3 border-t border-border pt-3 text-sm">
                  <p className="font-mono text-[11px] text-[#bbb]">ID {r.id}</p>
                  {r.description && <p className="mt-1 text-[#555]">« {r.description} »</p>}
                  {r.evidence_url && <a href={r.evidence_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#e60050] underline">Voir la pièce jointe (contenu signalé uniquement)</a>}
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    {r.reported_user_id && <Link to="/admin/users/$userId" params={{ userId: r.reported_user_id }} className="text-[#e60050] underline">Fiche membre 360</Link>}
                    {r.reporter_id && <Link to="/admin/users/$userId" params={{ userId: r.reporter_id }} className="text-[#e60050] underline">Signaleur</Link>}
                  </div>
                  {d ? (
                    <div className="mt-2 grid gap-2 lg:grid-cols-2">
                      <div className="rounded-lg bg-[#f7f7f7] p-2">
                        <p className="text-xs font-medium text-[#555]">Signalements précédents ({d.prev.length})</p>
                        {d.prev.length ? d.prev.map((x: any) => <p key={x.id} className="text-xs text-[#777]">{x.category} · {x.priority} · {x.status} · {timeSince(x.created_at)}{x.resolution ? ` — ${x.resolution}` : ""}</p>) : <p className="text-xs text-[#999]">Aucun.</p>}
                      </div>
                      <div className="rounded-lg bg-[#f7f7f7] p-2">
                        <p className="text-xs font-medium text-[#555]">Cas + sanctions passées ({d.cases.length + d.audit.length})</p>
                        {d.cases.map((x: any) => <p key={x.id} className="text-xs text-[#777]">Cas {x.status}{x.action_taken ? ` → ${x.action_taken}` : ""} · {timeSince(x.created_at)}</p>)}
                        {d.audit.map((x: any, i: number) => <p key={i} className="text-xs text-[#777]">Admin {x.action} · {timeSince(x.created_at)}</p>)}
                        {!d.cases.length && !d.audit.length && <p className="text-xs text-[#999]">Aucun antécédent.</p>}
                      </div>
                      <div className="rounded-lg bg-[#f7f7f7] p-2">
                        <p className="text-xs font-medium text-[#555]">Tickets liés ({d.tickets.length})</p>
                        {d.tickets.length ? d.tickets.map((x: any) => <p key={x.id} className="text-xs text-[#777]">« {x.subject} » · {x.status}</p>) : <p className="text-xs text-[#999]">Aucun.</p>}
                      </div>
                      <div className="rounded-lg bg-[#f7f7f7] p-2">
                        <p className="text-xs font-medium text-[#555]">Notes internes ({d.notes.length})</p>
                        {d.notes.map((x: any, i: number) => <p key={i} className="text-xs text-[#777]">{x.body} · {timeSince(x.created_at)}</p>)}
                        {!d.notes.length && <p className="text-xs text-[#999]">Aucune.</p>}
                      </div>
                    </div>
                  ) : <p className="mt-2 text-xs text-[#999]">Chargement du dossier…</p>}
                  {r.status !== "resolved" && r.status !== "dismissed" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {r.status === "new" && <button type="button" onClick={async () => { const { data: { user } } = await supabase.auth.getUser(); update(r.id, { assigned_to: user?.id, status: "investigating" }, "admin.report.assign"); }} className="rounded border border-border px-2 py-1 text-xs">Prendre en charge</button>}
                      <select value="" onChange={(e) => { if (e.target.value) update(r.id, { assigned_to: e.target.value, status: r.status === "new" ? "investigating" : r.status }, "admin.report.assign"); }} aria-label="Réassigner" className="rounded border border-border px-2 py-1 text-xs">
                        <option value="">Réassigner…</option>
                        {staff.map((s) => <option key={s.id} value={s.id}>{nm(s.id)} ({s.role})</option>)}
                      </select>
                      <button type="button" onClick={() => requestInfo(r)} className="rounded border border-border px-2 py-1 text-xs">Demander un complément</button>
                      {r.priority !== "critical" && <button type="button" onClick={() => update(r.id, { priority: "critical" }, "admin.report.escalate")} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700">Escalader (critique)</button>}
                      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note interne…" maxLength={1000} aria-label="Note interne" className="min-w-40 flex-1 rounded border border-border px-2 py-1 text-xs" />
                      <button type="button" onClick={() => addNote(r)} className="rounded border border-border px-2 py-1 text-xs">Noter</button>
                    </div>
                  )}
                  {r.status !== "resolved" && r.status !== "dismissed" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Motif / résolution (obligatoire)…" maxLength={500} aria-label="Motif" className="min-w-52 flex-1 rounded border border-border px-2 py-1 text-xs" />
                      <button
                        type="button"
                        onClick={() => {
                          if (!resolution.trim()) {
                            setMsg("Un motif est obligatoire pour clore.");
                            return;
                          }
                          update(r.id, { status: "resolved", resolution: resolution.trim(), resolved_at: new Date().toISOString() }, "admin.report.resolve");
                        }}
                        className="rounded border border-border px-2 py-1 text-xs"
                      >
                        Résoudre
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!resolution.trim()) {
                            setMsg("Un motif est obligatoire pour rejeter.");
                            return;
                          }
                          update(r.id, { status: "dismissed", resolution: resolution.trim(), resolved_at: new Date().toISOString() }, "admin.report.dismiss");
                        }}
                        className="rounded border border-border px-2 py-1 text-xs"
                      >
                        Rejeter
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const { data: { user } } = await supabase.auth.getUser();
                          const { data, error } = await supabase.from("swivv_moderation_cases").insert({
                            subject_user_id: r.reported_user_id, report_id: r.id, priority: r.priority, assigned_to: user?.id, created_by: user?.id,
                          }).select("id").single();
                          if (error) {
                            setMsg(error.message);
                            return;
                          }
                          audit("admin.case.create", "case", (data as any).id, { from_report: r.id });
                          setMsg("Cas de modération créé.");
                        }}
                        className="rounded border border-border px-2 py-1 text-xs"
                      >
                        → Cas modération
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-[#777]">Aucun signalement avec ces filtres.</p>}
      </div>
    </div>
  );
}
