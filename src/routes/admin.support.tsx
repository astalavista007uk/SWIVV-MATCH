import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { audit } from "@/lib/admin";
import { deadlineLabel, ticketFlags } from "@/lib/admin-support";

const STATUSES = ["open", "assigned", "waiting_user", "waiting_internal", "resolved", "closed"];
const PRIORITIES = ["low", "normal", "high", "critical"];
const OPEN = ["open", "assigned", "waiting_user", "waiting_internal"];
const FILES_MARKER = "Fichiers annoncés (à réclamer par e-mail) : ";
// ponytail: file names ride inside the body text (no column) — parse at render; a attachments column if uploads ever land in storage
function splitFiles(body: string): { text: string; files: string[] } {
  const i = body.indexOf(FILES_MARKER);
  if (i < 0) return { text: body, files: [] };
  return {
    text: body.slice(0, i).trimEnd(),
    files: body.slice(i + FILES_MARKER.length).split(",").map((s) => s.trim()).filter(Boolean),
  };
}

export const Route = createFileRoute("/admin/support")({
  validateSearch: (s: Record<string, unknown>) => ({ status: typeof s.status === "string" ? s.status : undefined }),
  component: AdminSupport,
} as any);

// ponytail: no AI provider — replies are human-written, never drafted by a model; e-mail dispatch follows when a provider is wired (in-app copy only for now)
// ponytail: duplicates linked via internal note + audit (no link column) — a linked_ticket_id column if duplicate-chasing becomes routine
function AdminSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [staff, setStaff] = useState<{ id: string; role: string }[]>([]);
  const [lastMsg, setLastMsg] = useState<Record<string, { at: string; staff: boolean }>>({});
  const [filter, setFilter] = useState((Route.useSearch() as any).status ?? "open");
  const [pri, setPri] = useState("all");
  const [cat, setCat] = useState("all");
  const [assign, setAssign] = useState("all");
  const [date, setDate] = useState("all");
  const [onlyAwaiting, setOnlyAwaiting] = useState(false);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [active, setActive] = useState<any>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [related, setRelated] = useState<{ tickets: any[]; reports: number; cases: number }>({ tickets: [], reports: 0, cases: 0 });
  const [reply, setReply] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [dupeOf, setDupeOf] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function loadTickets() {
    let q: any = supabase.from("swivv_support_tickets").select("*").order("updated_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) {
      setMsg(error.message);
      return;
    }
    const list = (data ?? []) as any[];
    setTickets(list);
    const { data: { user } } = await supabase.auth.getUser();
    setMyId(user?.id ?? null);
    const openIds = list.filter((t) => OPEN.includes(t.status)).slice(0, 50).map((t) => t.id);
    if (openIds.length) {
      const { data: mm } = await (supabase as any).from("swivv_support_messages").select("ticket_id,created_at,is_staff").in("ticket_id", openIds).order("created_at", { ascending: false }).limit(1000);
      const lm: Record<string, { at: string; staff: boolean }> = {};
      for (const m of ((mm ?? []) as any[])) if (!lm[m.ticket_id]) lm[m.ticket_id] = { at: m.created_at, staff: !!m.is_staff };
      setLastMsg(lm);
    } else setLastMsg({});
    const uids = [...new Set(list.map((t) => t.user_id).filter((x) => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)))].slice(0, 100);
    if (uids.length) {
      const { data: profs } = await (supabase as any).from("swivv_profiles").select("user_id,data").in("user_id", uids);
      const map: Record<string, string> = {};
      for (const p of (profs as any[]) ?? []) map[p.user_id] = (p.data as any)?.name ?? p.user_id.slice(0, 8);
      setNames(map);
    }
    const st = await (supabase as any).from("user_roles").select("user_id,role");
    setStaff(((st.data ?? []) as any[]).map((x) => ({ id: x.user_id as string, role: x.role as string })));
  }

  async function open(t: any) {
    setActive(t);
    setReply("");
    setNoteDraft("");
    setDupeOf("");
    const q = supabase as any;
    const [th, nt, rel] = await Promise.all([
      supabase.from("swivv_support_messages").select("*").eq("ticket_id", t.id).order("created_at"),
      q.from("swivv_internal_notes").select("body,created_at").eq("target_kind", "ticket").eq("target_id", t.id).order("created_at", { ascending: false }).limit(20),
      (async () => {
        if (!t.user_id) return { tickets: [], reports: 0, cases: 0 };
        const [ot, rp, cs] = await Promise.all([
          q.from("swivv_support_tickets").select("id,subject,status").eq("user_id", t.user_id).neq("id", t.id).order("created_at", { ascending: false }).limit(10),
          q.from("swivv_reports").select("id", { count: "exact", head: true }).eq("reported_user_id", t.user_id),
          q.from("swivv_moderation_cases").select("id", { count: "exact", head: true }).eq("subject_user_id", t.user_id),
        ]);
        return { tickets: (ot.data ?? []) as any[], reports: rp.count ?? 0, cases: cs.count ?? 0 };
      })(),
    ]);
    setThread((th.data ?? []) as any[]);
    setNotes((nt.data ?? []) as any[]);
    setRelated(rel);
    audit("admin.ticket.view", "ticket", t.id);
  }

  useEffect(() => {
    loadTickets();
    audit("admin.tickets.view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const nm = (id: string | null) => {
    if (!id) return "—";
    return /^[0-9a-f-]{36}$/i.test(id) ? (names[id] ?? `${id.slice(0, 8)}…`) : `Démo #${id}`;
  };
  const cats = useMemo(() => [...new Set(tickets.map((t) => t.category).filter(Boolean))], [tickets]);
  const shown = useMemo(() => {
    const now = Date.now();
    const cut = date === "24h" ? now - 864e5 : date === "7d" ? now - 7 * 864e5 : date === "30d" ? now - 30 * 864e5 : 0;
    return tickets.filter((t) => {
      if (pri !== "all" && t.priority !== pri) return false;
      if (cat !== "all" && t.category !== cat) return false;
      if (cut && new Date(t.created_at).getTime() < cut) return false;
      if (assign === "me" && t.assigned_to !== myId) return false;
      if (assign === "none" && t.assigned_to) return false;
      const f = ticketFlags(lastMsg[t.id] ?? null, t.created_at, now);
      if (onlyAwaiting && !f.awaiting) return false;
      if (onlyOverdue && !f.overdue) return false;
      return true;
    }).sort((a, b) => {
      const fa = ticketFlags(lastMsg[a.id] ?? null, a.created_at, now);
      const fb = ticketFlags(lastMsg[b.id] ?? null, b.created_at, now);
      return Number(fb.overdue) - Number(fa.overdue) || +new Date(b.updated_at) - +new Date(a.updated_at);
    });
  }, [tickets, pri, cat, date, assign, onlyAwaiting, onlyOverdue, lastMsg, myId]);

  async function update(id: string, patch: Database["public"]["Tables"]["swivv_support_tickets"]["Update"], log: string) {
    const { error } = await supabase.from("swivv_support_tickets").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      setMsg(error.message);
      return false;
    }
    audit(log, "ticket", id, patch as Record<string, unknown>);
    if (active?.id === id) setActive({ ...active, ...patch });
    loadTickets();
    return true;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !active) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("swivv_support_messages").insert({
      ticket_id: active.id,
      author_id: user?.id,
      is_staff: true,
      body: reply.trim(),
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    // ponytail: in-app copy for the user (e-mail dispatch when a provider is wired)
    await supabase.from("swivv_notifications").insert({
      user_id: active.user_id,
      type: "support",
      title: "Réponse du support",
      message: reply.trim().slice(0, 200),
      link: "/parametres",
    });
    setReply("");
    audit("admin.ticket.reply", "ticket", active.id);
    setMsg("Réponse envoyée (copie in-app ; e-mail selon fournisseur).");
    open({ ...active });
    loadTickets();
  }

  async function addNote() {
    if (!noteDraft.trim() || !active) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("swivv_internal_notes").insert({ target_kind: "ticket", target_id: active.id, author_id: user?.id, body: noteDraft.trim() });
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.ticket.note", "ticket", active.id);
    setNoteDraft("");
    open({ ...active });
  }

  async function linkDupe() {
    if (!dupeOf.trim() || !active) return;
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from("swivv_internal_notes").insert({ target_kind: "ticket", target_id: active.id, author_id: user?.id, body: `Doublon de ${dupeOf.trim()} — clôturé.` });
    await update(active.id, { status: "closed" }, "admin.ticket.dupe");
    setDupeOf("");
    setMsg(`Lié à ${dupeOf.trim()} et clôturé.`);
  }

  const sel = "rounded-md border border-border bg-white px-3 py-2 text-sm";
  const frDate = (v: any) => (v ? new Date(v).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

  return (
    <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-4">
      <div>
        <h1 className="text-2xl font-medium text-[#333]">Support ({shown.length})</h1>
        <p className="mt-1 text-xs text-[#999]">Échéance : 1re réponse staff sous 48 h (politique SLA).</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre statut" className={sel}>
            {["all", ...STATUSES].map((s) => <option key={s} value={s}>{s === "all" ? "Tous" : s}</option>)}
          </select>
          <select value={pri} onChange={(e) => setPri(e.target.value)} aria-label="Filtre priorité" className={sel}>
            {["all", ...PRIORITIES].map((s) => <option key={s} value={s}>{s === "all" ? "Toutes priorités" : s}</option>)}
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filtre catégorie" className={sel}>
            {["all", ...cats].map((s) => <option key={s} value={s}>{s === "all" ? "Toutes catégories" : s}</option>)}
          </select>
          <select value={assign} onChange={(e) => setAssign(e.target.value)} aria-label="Filtre assignation" className={sel}>
            {[["all", "Tous"], ["me", "Assignés à moi"], ["none", "Non assignés"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filtre date" className={sel}>
            {[["all", "Toutes dates"], ["24h", "24 h"], ["7d", "7 j"], ["30d", "30 j"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-sm text-[#555]">
            <input type="checkbox" checked={onlyAwaiting} onChange={(e) => setOnlyAwaiting(e.target.checked)} /> En attente
          </label>
          <label className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-sm text-[#555]">
            <input type="checkbox" checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} /> En retard
          </label>
        </div>
        {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}
        <div className="mt-2 space-y-2">
          {shown.map((t) => {
            const f = ticketFlags(lastMsg[t.id] ?? null, t.created_at);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => open(t)}
                className={`block w-full rounded-xl bg-white p-3 text-left shadow-sm ${active?.id === t.id ? "ring-2 ring-[#e91e63]" : ""}`}
              >
                <span className="block truncate text-sm font-medium text-[#333]">{t.subject}</span>
                <span className="mt-0.5 block text-xs text-[#999]">
                  {nm(t.user_id)} · {t.category} · {t.status} · {t.priority} · {frDate(t.created_at)}
                  {f.overdue ? <span className="font-medium text-red-700"> · EN RETARD (échéance {deadlineLabel(t.created_at)})</span> : f.awaiting && OPEN.includes(t.status) ? " · en attente" : ""}
                </span>
              </button>
            );
          })}
          {shown.length === 0 && <p className="text-sm text-[#777]">Aucun ticket avec ces filtres.</p>}
        </div>
      </div>
      <div className="mt-6 lg:mt-0">
        {!active ? (
          <p className="text-sm text-[#777]">Sélectionne un ticket.</p>
        ) : (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="font-mono text-[11px] text-[#bbb]">ID {active.id}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium text-[#333]">{active.subject}</h2>
              <span className="text-xs text-[#999]">{active.category} · {nm(active.user_id)} · créé le {frDate(active.created_at)} · MAJ {frDate(active.updated_at)} · échéance {deadlineLabel(active.created_at)}</span>
              {active.user_id && <Link to="/admin/users/$userId" params={{ userId: active.user_id }} className="text-xs text-[#e91e63] underline">Fiche membre</Link>}
            </div>
            {(related.tickets.length > 0 || related.reports > 0 || related.cases > 0) && (
              <p className="mt-1 text-xs text-[#777]">
                Contexte : {related.tickets.length} autre(s) ticket(s){related.reports > 0 ? ` · ${related.reports} signalement(s) reçu(s)` : ""}{related.cases > 0 ? ` · ${related.cases} cas modération` : ""}
                {related.tickets.slice(0, 3).map((x: any) => ` · « ${x.subject} » (${x.status})`).join("")}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <select value={active.status} onChange={async (e) => {
                if (await update(active.id, { status: e.target.value }, "admin.ticket.status")) setActive((a: any) => ({ ...a, status: e.target.value }));
              }} aria-label="Statut" className="rounded border border-border px-2 py-1">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={active.priority} onChange={async (e) => {
                if (await update(active.id, { priority: e.target.value }, "admin.ticket.priority")) setActive((a: any) => ({ ...a, priority: e.target.value }));
              }} aria-label="Priorité" className="rounded border border-border px-2 py-1">
                {PRIORITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={active.assigned_to ?? ""} onChange={async (e) => {
                const patch = { assigned_to: e.target.value || null, status: active.status === "open" && e.target.value ? "assigned" : active.status } as any;
                if (await update(active.id, patch, "admin.ticket.assign")) setActive((a: any) => ({ ...a, ...patch }));
              }} aria-label="Assigner" className="rounded border border-border px-2 py-1">
                <option value="">Assigner…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{nm(s.id)} ({s.role})</option>)}
              </select>
              {active.priority !== "critical" && <button type="button" onClick={() => update(active.id, { priority: "critical" }, "admin.ticket.escalate")} className="rounded border border-red-300 px-2 py-1 text-red-700">Escalader</button>}
              {(active.status === "resolved" || active.status === "closed") && <button type="button" onClick={() => update(active.id, { status: "open" }, "admin.ticket.reopen")} className="rounded border border-border px-2 py-1">Rouvrir</button>}
              {active.status !== "resolved" && active.status !== "closed" && <button type="button" onClick={() => update(active.id, { status: "resolved" }, "admin.ticket.resolve")} className="rounded border border-border px-2 py-1">Résoudre</button>}
            </div>
            <div className="mt-3 max-h-96 space-y-2 overflow-y-auto" aria-live="polite">
              {thread.map((m) => {
                const { text, files } = splitFiles(String(m.body ?? ""));
                return (
                <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.is_staff ? "ml-auto bg-[#e91e63] text-white" : "bg-[#f2f2f2] text-[#333]"}`}>
                  <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>
                  {files.length > 0 && (
                    <span className={`mt-1.5 flex flex-wrap gap-1.5 border-t pt-1.5 ${m.is_staff ? "border-white/30" : "border-[#ddd]"}`}>
                      {files.map((f) => (
                        <span key={f} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${m.is_staff ? "bg-white/20 text-white" : "bg-white text-[#555]"}`}>
                          📎 {f}
                        </span>
                      ))}
                    </span>
                  )}
                  <span className={`block text-[11px] ${m.is_staff ? "text-white/70" : "text-[#999]"}`}>{frDate(m.created_at)}</span>
                </div>
                );
              })}
              {thread.length === 0 && <p className="text-sm text-[#999]">Aucun message.</p>}
            </div>
            <form onSubmit={send} className="mt-3 flex gap-2">
              <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Répondre… (rédigé par un humain, jamais par l'IA)" maxLength={2000} aria-label="Réponse" className="flex-1 rounded-md border border-border px-3 py-2 text-sm" />
              <button type="submit" className="rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white">Envoyer</button>
            </form>
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-xs font-medium text-[#555]">Notes internes ({notes.length}) · IA indisponible (pas de résumé ni brouillon auto)</p>
              {notes.map((n: any, i: number) => <p key={i} className="mt-1 text-xs text-[#777]">{n.body} · {frDate(n.created_at)}</p>)}
              <div className="mt-1 flex gap-2">
                <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Note interne…" maxLength={1000} aria-label="Note interne" className="flex-1 rounded border border-border px-2 py-1 text-xs" />
                <button
                  type="button"
                  onClick={async () => {
                    if (!noteDraft.trim()) return;
                    const { data: { user } } = await supabase.auth.getUser();
                    const { error } = await (supabase as any).from("swivv_internal_notes").insert({ target_kind: "ticket", target_id: active.id, author_id: user?.id, body: noteDraft.trim() });
                    if (error) {
                      setMsg(error.message);
                      return;
                    }
                    audit("admin.ticket.note", "ticket", active.id);
                    setNoteDraft("");
                    open({ ...active });
                  }}
                  className="rounded border border-border px-2 py-1 text-xs"
                >
                  Noter
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <input value={dupeOf} onChange={(e) => setDupeOf(e.target.value)} placeholder="Doublon du ticket (ID)…" aria-label="Doublon de" className="flex-1 rounded border border-border px-2 py-1 text-xs" />
                <button type="button" onClick={linkDupe} className="rounded border border-border px-2 py-1 text-xs">Lier + clore</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
