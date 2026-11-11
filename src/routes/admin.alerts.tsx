import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit, useAdminRole } from "@/lib/admin";
import { alertLink, collectAlerts, type AlertSpec } from "@/lib/admin-alerts";

export const Route = createFileRoute("/admin/alerts")({
  component: AdminAlerts,
} as any);

const STATUSES = ["open", "acknowledged", "in_progress", "escalated", "resolved", "dismissed"];
const STATUS_FR: Record<string, string> = { open: "Nouvelle", acknowledged: "Prise en compte", in_progress: "En cours", escalated: "Escaladée", resolved: "Résolue", dismissed: "Rejetée" };
const LIVE = ["open", "acknowledged", "in_progress", "escalated"];
const SEV: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-700",
};
const frDate = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// ponytail: manual "Tout évaluer" over 7 live sources (no cron/worker) — stable dedupe_key +
// partial unique index stop live dupes; re-fire allowed after resolve/dismiss; criticals notify admins
function AdminAlerts() {
  const { level } = useAdminRole();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [staff, setStaff] = useState<{ id: string; role: string }[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [fStatus, setFStatus] = useState("live");
  const [fSource, setFSource] = useState("all");
  const [fSev, setFSev] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { data, error } = await (supabase as any)
      .from("swivv_admin_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      setErr(error.message);
      return;
    }
    setAlerts((data ?? []) as any[]);
    const ids = new Set<string>();
    for (const a of (data ?? []) as any[]) for (const k of ["assignee", "ack_by", "ref_id"] as const) {
      const v = a[k];
      if (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v)) ids.add(v);
    }
    const st = await (supabase as any).from("user_roles").select("user_id,role");
    for (const x of ((st.data ?? []) as any[])) if (typeof x.user_id === "string") ids.add(x.user_id);
    setStaff(((st.data ?? []) as any[]).map((x) => ({ id: x.user_id as string, role: x.role as string })));
    if (ids.size) {
      const { data: profs } = await (supabase as any).from("swivv_profiles").select("user_id,data").in("user_id", [...ids].slice(0, 200));
      const map: Record<string, string> = {};
      for (const p of (profs as any[]) ?? []) map[p.user_id] = (p.data as any)?.name ?? p.user_id.slice(0, 8);
      setNames(map);
    }
  }
  useEffect(() => {
    load();
    audit("admin.alerts.view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nm = (id: string | null) => {
    if (!id) return "—";
    return /^[0-9a-f-]{36}$/i.test(id) ? (names[id] ?? `${id.slice(0, 8)}…`) : id;
  };
  const sources = useMemo(() => [...new Set(alerts.map((a) => a.source).filter(Boolean))].sort(), [alerts]);
  const shown = useMemo(() => {
    const sevRank = (s: string) => (s === "critical" ? 0 : s === "warning" ? 1 : 2);
    return alerts
      .filter((a) => {
        if (fStatus === "live" ? !LIVE.includes(a.status) : fStatus !== "all" && a.status !== fStatus) return false;
        if (fSource !== "all" && a.source !== fSource) return false;
        if (fSev !== "all" && a.severity !== fSev) return false;
        return true;
      })
      .sort((a, b) => sevRank(a.severity) - sevRank(b.severity) || +new Date(b.created_at) - +new Date(a.created_at));
  }, [alerts, fStatus, fSource, fSev]);

  async function transition(a: any, status: string, extra: Record<string, any> = {}) {
    if (status === "dismissed" && !reason.trim()) {
      setMsg("Un motif est obligatoire pour rejeter.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const patch: Record<string, any> = { status, ...extra };
    if (status === "dismissed") patch.reason = reason.trim();
    if (["acknowledged", "in_progress", "escalated"].includes(status)) {
      patch.ack_by = user?.id ?? null;
      patch.ack_at = new Date().toISOString();
    }
    if (status === "escalated") patch.severity = "critical";
    const { error } = await (supabase as any).from("swivv_admin_alerts").update(patch).eq("id", a.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit(`admin.alert.${status}`, "alert", a.id, { reason: reason.trim() || undefined });
    setReason("");
    load();
  }

  async function assign(a: any, assignee: string) {
    const { error } = await (supabase as any).from("swivv_admin_alerts").update({ assignee: assignee || null }).eq("id", a.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.alert.assign", "alert", a.id, { assignee });
    load();
  }

  async function bulkAck() {
    const ids = shown.filter((a) => a.status === "open" && sel.has(a.id)).map((a) => a.id);
    if (!ids.length) return;
    if (!window.confirm(`Prendre en compte ${ids.length} alerte(s) ? (sans danger : pas de clôture)`)) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("swivv_admin_alerts").update({ status: "acknowledged", ack_by: user?.id ?? null, ack_at: new Date().toISOString() }).in("id", ids);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.alert.bulk_ack", "alerts", undefined, { count: ids.length });
    setSel(new Set());
    load();
  }

  async function evaluate() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const q = supabase as any;
      const [rp, cs, fc, tk, vf, ar, ml] = await Promise.all([
        supabase.from("swivv_reports").select("id,category,priority,status,reported_user_id,created_at").in("status", ["new", "investigating", "waiting"]).order("created_at", { ascending: false }).limit(200),
        supabase.from("swivv_moderation_cases").select("id,priority,status,subject_user_id").in("status", ["open", "investigating", "waiting"]).limit(100),
        q.from("swivv_fraud_cases").select("id,kind,status,subject_ref").in("status", ["open", "investigating"]).limit(100),
        supabase.from("swivv_support_tickets").select("id,subject,created_at").in("status", ["open", "assigned", "waiting_user", "waiting_internal"]).order("created_at", { ascending: true }).limit(100),
        supabase.from("swivv_verification_requests").select("id,kind,status,created_at").eq("status", "pending").limit(100),
        q.from("swivv_ai_runs").select("rule_key,error,created_at").eq("status", "failed").order("created_at", { ascending: false }).limit(50),
        q.from("swivv_email_log").select("key,template,created_at").eq("status", "failed").order("created_at", { ascending: false }).limit(50),
      ]);
      for (const r of [rp, cs, fc, tk, vf, ar, ml]) if (r.error) throw r.error;
      const openIds = ((tk.data ?? []) as any[]).map((t) => t.id);
      let staffMap: Record<string, boolean> = {};
      if (openIds.length) {
        const { data: mm } = await q.from("swivv_support_messages").select("ticket_id,is_staff").in("ticket_id", openIds.slice(0, 50)).limit(2000);
        for (const m of ((mm ?? []) as any[])) if (m.is_staff) staffMap[m.ticket_id] = true;
      }
      const specs: AlertSpec[] = collectAlerts({
        reports: (rp.data ?? []) as any[],
        cases: (cs.data ?? []) as any[],
        fraudCases: (fc.data ?? []) as any[],
        tickets: ((tk.data ?? []) as any[]).map((t) => ({ ...t, staffReplied: !!staffMap[t.id] })),
        verifs: (vf.data ?? []) as any[],
        aiFailed: (ar.data ?? []) as any[],
        mailFailed: (ml.data ?? []) as any[],
      });
      let created = 0;
      let skipped = 0;
      for (const s of specs) {
        const { error } = await (supabase as any).from("swivv_admin_alerts").insert({
          dedupe_key: s.dedupe, source: s.source, category: s.category,
          kind: `${s.source}:${s.category}`, severity: s.severity, title: s.title,
          detail: s.detail, ref_kind: s.refKind ?? null, ref_id: s.refId ?? null,
        });
        if (error) {
          if (String(error.message).match(/duplicate|unique/i)) skipped++;
          else throw error;
        } else {
          created++;
        }
      }
      audit("admin.alerts.evaluate", "alerts", undefined, { created, skipped });
      setMsg(created ? `${created} alerte(s) créée(s)${skipped ? `, ${skipped} déjà ouverte(s)` : ""}.` : "Rien de nouveau — files saines.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Évaluation impossible.");
    } finally {
      setBusy(false);
    }
  }

  const selCls = "rounded-md border border-border bg-white px-3 py-2 text-sm";
  if (err) return <p className="text-sm text-red-600">{err}</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-medium text-[#333]">Centre d'alertes ({shown.length})</h1>
        {level >= 50 ? (
          <button type="button" onClick={evaluate} disabled={busy} className="ml-auto rounded-md bg-[#6747c7] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {busy ? "Évaluation…" : "Tout évaluer"}
          </button>
        ) : (
          <p className="ml-auto text-xs text-[#5c5c66]">Évaluation réservée aux modérateurs et plus.</p>
        )}
      </div>
      {msg && <p className="mt-2 text-sm text-green-700">{msg}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filtre statut" className={selCls}>
          {[["live", "Actives"], ["all", "Toutes"], ...STATUSES.map((s) => [s, STATUS_FR[s]] as const)].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={fSource} onChange={(e) => setFSource(e.target.value)} aria-label="Filtre source" className={selCls}>
          {["all", ...sources].map((s) => <option key={s} value={s}>{s === "all" ? "Toutes sources" : s}</option>)}
        </select>
        <select value={fSev} onChange={(e) => setFSev(e.target.value)} aria-label="Filtre gravité" className={selCls}>
          {[["all", "Toutes gravités"], ["critical", "Critique"], ["warning", "Avertissement"], ["info", "Info"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {shown.some((a) => a.status === "open") && (
          <button type="button" onClick={bulkAck} className="rounded-md border border-border bg-white px-3 py-2 text-sm">Tout prendre en compte ({shown.filter((a) => a.status === "open" && sel.has(a.id)).length || "sélection"})</button>
        )}
      </div>
      <div className="mt-4 space-y-2">
        {shown.map((a) => {
          const open = openId === a.id;
          const link = alertLink(a);
          const live = LIVE.includes(a.status);
          return (
            <article key={a.id} className="rounded-xl bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {live && <input type="checkbox" checked={sel.has(a.id)} onChange={(e) => setSel((s) => { const n = new Set(s); if (e.target.checked) n.add(a.id); else n.delete(a.id); return n; })} aria-label="Sélectionner" />}
                <button type="button" onClick={() => setOpenId(open ? null : a.id)} aria-expanded={open} className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-left">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEV[a.severity] ?? SEV.info}`}>{a.severity}</span>
                  <strong className="text-[#333]">{a.title}</strong>
                  <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{STATUS_FR[a.status] ?? a.status}</span>
                  <span className="text-xs text-[#5c5c66]">{a.source ?? a.kind} · {frDate.format(new Date(a.created_at))} · assignée : {a.assignee ? nm(a.assignee) : "—"}</span>
                </button>
              </div>
              {open && (
                <div className="mt-2 border-t border-border pt-2 text-xs text-[#555]">
                  <p className="font-mono text-[11px] text-[#bbb]">ID {a.id} · dédupe {a.dedupe_key ?? "—"} · catégorie {a.category ?? a.kind}</p>
                  {a.reason && <p className="mt-1">Motif : {a.reason}</p>}
                  {a.ack_by && <p className="mt-1">Prise en compte par {nm(a.ack_by)}{a.ack_at ? ` le ${frDate.format(new Date(a.ack_at))}` : ""}</p>}
                  <div className="mt-1 flex flex-wrap gap-2">
                    {link && (a.refKind === "user" && a.refId ? (
                      <a href={`/admin/users/${a.refId}`} className="text-[#e60050] underline">{link.label}</a>
                    ) : (
                      <Link to={link.to as any} className="text-[#e60050] underline">{link.label}</Link>
                    ))}
                  </div>
                  {live && (
                    <>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <select value={a.assignee ?? ""} onChange={(e) => {
                          const v = e.target.value;
                          (supabase as any).from("swivv_admin_alerts").update({ assignee: v || null }).eq("id", a.id).then(({ error }: any) => {
                            if (error) setMsg(error.message);
                            else {
                              audit("admin.alert.assign", "alert", a.id, { assignee: v });
                              load();
                            }
                          });
                        }} aria-label="Assigner" className="rounded border border-border px-2 py-1">
                          <option value="">Assigner…</option>
                          {staff.map((s) => <option key={s.id} value={s.id}>{nm(s.id)} ({s.role})</option>)}
                        </select>
                        {a.status === "open" && <button type="button" onClick={() => transition(a, "acknowledged")} className="rounded border border-border px-2 py-1">Prendre en compte</button>}
                        {["open", "acknowledged"].includes(a.status) && <button type="button" onClick={() => transition(a, "in_progress")} className="rounded border border-border px-2 py-1">Démarrer</button>}
                        <button type="button" onClick={() => transition(a, "escalated")} className="rounded border border-red-300 px-2 py-1 text-red-700">Escalader</button>
                        <button type="button" onClick={() => transition(a, "resolved")} className="rounded border border-border px-2 py-1">Résoudre</button>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input value={openId === a.id ? reason : ""} onChange={(e) => setReason(e.target.value)} placeholder="Motif du rejet (obligatoire)…" maxLength={500} aria-label="Motif" className="flex-1 rounded border border-border px-2 py-1" />
                        <button type="button" onClick={() => transition(a, "dismissed")} className="rounded border border-border px-2 py-1">Rejeter</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-[#5c5c66]">Aucune alerte avec ces filtres. Lance « Tout évaluer » pour balayer les 7 sources.</p>}
      </div>
    </div>
  );
}
