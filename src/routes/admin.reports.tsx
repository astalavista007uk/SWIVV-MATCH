import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { audit } from "@/lib/admin";

const STATUSES = ["new", "investigating", "waiting", "resolved", "dismissed"];

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
} as any);

function AdminReports() {
  const [rows, setRows] = useState<any[]>([]);
  const [repeat, setRepeat] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("new");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    let q = supabase.from("swivv_reports").select("*").order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) setMsg(error.message);
    else {
      setRows(data ?? []);
      // ponytail: repeat counts over the visible window only — server-side count query when the queue outgrows 100 rows
      const counts: Record<string, number> = {};
      for (const r of (data ?? []) as any[]) {
        if (r.reported_user_id) counts[r.reported_user_id] = (counts[r.reported_user_id] ?? 0) + 1;
      }
      setRepeat(counts);
    }
  }

  useEffect(() => {
    load();
    audit("admin.reports.view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function update(id: string, patch: Database["public"]["Tables"]["swivv_reports"]["Update"], log: string) {
    const { error } = await supabase.from("swivv_reports").update(patch).eq("id", id);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit(log, "report", id, patch as Record<string, unknown>);
    load();
  }

  async function assignMe(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    update(id, { assigned_to: user?.id, status: "investigating" }, "admin.report.assign");
  }

  async function toCase(r: any) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("swivv_moderation_cases").insert({
      subject_user_id: r.reported_user_id,
      report_id: r.id,
      priority: r.priority,
      assigned_to: user?.id,
      created_by: user?.id,
    }).select("id").single();
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.case.create", "case", (data as any).id, { from_report: r.id });
    setMsg("Cas de modération créé.");
  }

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Signalements</h1>
      <div className="mt-4 flex gap-2">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre statut" className="rounded-md border border-border bg-white px-3 py-2 text-sm">
          {["all", ...STATUSES].map((s) => <option key={s} value={s}>{s === "all" ? "Tous" : s}</option>)}
        </select>
      </div>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <article key={r.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <strong className="text-[#333]">{r.category}</strong>
              <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{r.priority}</span>
              <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{r.status}</span>
              {r.reported_user_id && (repeat[r.reported_user_id] ?? 0) > 1 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">×{repeat[r.reported_user_id]} signalements</span>
              )}
              <span className="ml-auto text-xs text-[#999]">{new Date(r.created_at).toLocaleString("fr-FR")}</span>
            </div>
            {r.description && <p className="mt-1 text-sm text-[#555]">{r.description}</p>}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {r.reported_user_id && <Link to="/admin/users/$userId" params={{ userId: r.reported_user_id }} className="text-[#e91e63] underline">Voir le profil signalé</Link>}
              {r.status === "new" && <button type="button" onClick={() => assignMe(r.id)} className="rounded border border-border px-2 py-1">Prendre en charge</button>}
              {r.status !== "resolved" && r.status !== "dismissed" && (
                <>
                  <button type="button" onClick={() => update(r.id, { status: "resolved", resolution: "Traité", resolved_at: new Date().toISOString() }, "admin.report.resolve")} className="rounded border border-border px-2 py-1">Résoudre</button>
                  <button type="button" onClick={() => update(r.id, { status: "dismissed", resolved_at: new Date().toISOString() }, "admin.report.dismiss")} className="rounded border border-border px-2 py-1">Rejeter</button>
                  <button type="button" onClick={() => toCase(r)} className="rounded border border-border px-2 py-1">→ Cas modération</button>
                </>
              )}
            </div>
          </article>
        ))}
        {rows.length === 0 && <p className="text-sm text-[#777]">Aucun signalement. Le centre public (bouton « Signaler ») écrira ici.</p>}
      </div>
    </div>
  );
}
