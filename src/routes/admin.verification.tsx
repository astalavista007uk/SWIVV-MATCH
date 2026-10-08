import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";

const STATUSES = ["pending", "approved", "rejected", "expired"];

export const Route = createFileRoute("/admin/verification")({
  component: AdminVerification,
} as any);

function AdminVerification() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    let q = supabase.from("swivv_verification_requests").select("*").order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) setMsg(error.message);
    else setRows(data ?? []);
  }

  useEffect(() => {
    load();
    audit("admin.verify.view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function decide(id: string, status: "approved" | "rejected") {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("swivv_verification_requests").update({
      status,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit(`admin.verify.${status}`, "verification", id);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Vérification</h1>
      <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre statut" className="mt-4 rounded-md border border-border bg-white px-3 py-2 text-sm">
        {["all", ...STATUSES].map((s) => <option key={s} value={s}>{s === "all" ? "Tous" : s}</option>)}
      </select>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <article key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 text-sm shadow-sm">
            <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{r.kind}</span>
            <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{r.status}</span>
            {r.user_id && <Link to="/admin/users/$userId" params={{ userId: r.user_id }} className="text-[#e91e63] underline">Profil</Link>}
            <span className="ml-auto flex gap-2">
              {r.status === "pending" && (
                <>
                  <button type="button" onClick={() => decide(r.id, "approved")} className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white">Approuver</button>
                  <button type="button" onClick={() => decide(r.id, "rejected")} className="rounded border border-border px-3 py-1 text-xs">Rejeter</button>
                </>
              )}
            </span>
          </article>
        ))}
        {rows.length === 0 && <p className="text-sm text-[#777]">Aucune demande. L'e-mail reste vérifié via Supabase Auth ; les demandes identité arriveront ici.</p>}
      </div>
    </div>
  );
}
