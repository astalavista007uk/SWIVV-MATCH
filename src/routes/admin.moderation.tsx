import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { audit } from "@/lib/admin";

const STATUSES = ["open", "investigating", "waiting", "closed"];

export const Route = createFileRoute("/admin/moderation")({
  component: AdminModeration,
} as any);

function AdminModeration() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("open");
  const [notes, setNotes] = useState<Record<string, any[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    let q = supabase.from("swivv_moderation_cases").select("*").order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) {
      setMsg(error.message);
      return;
    }
    setRows(data ?? []);
    const ids = (data ?? []).map((c: any) => c.id);
    if (ids.length > 0) {
      const { data: n } = await supabase.from("swivv_internal_notes").select("*").eq("target_kind", "case").in("target_id", ids).order("created_at", { ascending: false });
      const by: Record<string, any[]> = {};
      for (const x of (n ?? []) as any[]) (by[x.target_id] ??= []).push(x);
      setNotes(by);
    }
  }

  useEffect(() => {
    load();
    audit("admin.cases.view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function update(id: string, patch: Database["public"]["Tables"]["swivv_moderation_cases"]["Update"], log: string) {
    const { error } = await supabase.from("swivv_moderation_cases").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit(log, "case", id, patch as Record<string, unknown>);
    load();
  }

  async function addNote(caseId: string) {
    const body = (drafts[caseId] ?? "").trim();
    if (!body) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("swivv_internal_notes").insert({ target_kind: "case", target_id: caseId, author_id: user?.id, body });
    if (error) {
      setMsg(error.message);
      return;
    }
    setDrafts((d) => ({ ...d, [caseId]: "" }));
    audit("admin.note.add", "case", caseId);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Modération</h1>
      <div className="mt-4 flex gap-2">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre statut" className="rounded-md border border-border bg-white px-3 py-2 text-sm">
          {["all", ...STATUSES].map((s) => <option key={s} value={s}>{s === "all" ? "Tous" : s}</option>)}
        </select>
      </div>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}
      <div className="mt-4 space-y-2">
        {rows.map((c) => (
          <article key={c.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono text-xs text-[#999]">{c.id.slice(0, 8)}</span>
              <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{c.priority}</span>
              <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{c.status}</span>
              {c.action_taken && <span className="text-xs text-[#555]">→ {c.action_taken}</span>}
              <span className="ml-auto text-xs text-[#999]">{new Date(c.created_at).toLocaleString("fr-FR")}</span>
            </div>
            {c.reason && <p className="mt-1 text-sm text-[#555]">{c.reason}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {c.subject_user_id && <Link to="/admin/users/$userId" params={{ userId: c.subject_user_id }} className="text-[#e91e63] underline">Profil concerné</Link>}
              <select value={c.status} onChange={(e) => update(c.id, { status: e.target.value }, "admin.case.status")} aria-label="Statut" className="rounded border border-border px-2 py-1">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                value={c.action_taken ?? ""}
                onChange={(e) => update(c.id, { action_taken: e.target.value }, "admin.case.action")}
                placeholder="Action (avertir, suspendre, bannir…)"
                aria-label="Action prise"
                className="min-w-40 flex-1 rounded border border-border px-2 py-1"
              />
              {c.status !== "closed" && (
                <button type="button" onClick={() => update(c.id, { status: "closed", closed_at: new Date().toISOString() }, "admin.case.close")} className="rounded border border-border px-2 py-1">Clore</button>
              )}
            </div>
            <div className="mt-2 border-t border-border pt-2">
              {(notes[c.id] ?? []).map((n: any) => (
                <p key={n.id} className="text-xs text-[#555]">· {n.body} <span className="text-[#999]">({new Date(n.created_at).toLocaleString("fr-FR")})</span></p>
              ))}
              <div className="mt-1 flex gap-2">
                <input
                  value={drafts[c.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                  placeholder="Note interne…"
                  aria-label="Note interne"
                  className="flex-1 rounded border border-border px-2 py-1 text-xs"
                />
                <button type="button" onClick={() => addNote(c.id)} className="rounded bg-[#e91e63] px-3 py-1 text-xs font-medium text-white">Noter</button>
              </div>
            </div>
          </article>
        ))}
        {rows.length === 0 && <p className="text-sm text-[#777]">Aucun cas. Crée-en un depuis un signalement.</p>}
      </div>
    </div>
  );
}
