import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAudit,
} as any);

function AdminAudit() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("swivv_audit_log").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) setMsg(error.message);
      else setRows(data ?? []);
      audit("admin.audit.view");
    })();
  }, []);

  const needle = q.trim().toLowerCase();
  const list = needle
    ? rows.filter((r) => [r.action, r.target_kind, r.target_id, r.actor_id].some((v) => String(v ?? "").toLowerCase().includes(needle)))
    : rows;

  if (msg) return <p className="text-sm text-red-600">{msg}</p>;

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Audit ({rows.length})</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Action, cible, admin…" aria-label="Rechercher dans l'audit" className="mt-4 w-full rounded-md border border-border bg-white px-3 py-2 text-sm" />
      <div className="mt-4 space-y-1">
        {list.map((r) => (
          <div key={r.id} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
            <span className="font-medium text-[#333]">{r.action}</span>
            {r.target_kind && <span className="text-[#555]"> · {r.target_kind}:{String(r.target_id ?? "").slice(0, 8)}</span>}
            <span className="block font-mono text-xs text-[#999]">
              {String(r.actor_id ?? "?").slice(0, 8)} · {new Date(r.created_at).toLocaleString("fr-FR")}
            </span>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-[#777]">Aucune entrée. Les actions staff ci-dessus écrivent ici (table append-only).</p>}
      </div>
    </div>
  );
}
