import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit, type StaffRole } from "@/lib/admin";

const ROLES: StaffRole[] = ["super_admin", "admin", "moderator", "support", "analyst"];

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
} as any);

// ponytail: user_id paste-only (auth.users isn't client-readable) — e-mail→uuid lookup edge fn when onboarding grows
function AdminSettings() {
  const [rows, setRows] = useState<any[]>([]);
  const [uid, setUid] = useState("");
  const [role, setRole] = useState<StaffRole>("moderator");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase.from("user_roles").select("*").limit(200);
    if (error) setMsg(error.message);
    else setRows(data ?? []);
  }

  useEffect(() => {
    load();
    audit("admin.roles.view");
  }, []);

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    if (!uid.trim()) return;
    // RLS on user_roles allows only admin reads; writes go through service_role normally.
    // ponytail: direct insert works only if a policy permits it — grant_roles() RPC below when locked down
    const { error } = await supabase.from("user_roles").insert({ user_id: uid.trim(), role } as any);
    if (error) {
      setMsg(`Attribution impossible (${error.message}). Ajoute le rôle via Studio SQL : INSERT INTO user_roles …`);
      return;
    }
    audit("admin.role.grant", "user", uid.trim(), { role });
    setUid("");
    load();
  }

  async function revoke(user_id: string, r: string) {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", r as any);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.role.revoke", "user", user_id, { role: r });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Réglages — rôles staff</h1>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}
      <form onSubmit={grant} className="mt-4 flex flex-wrap gap-2 rounded-xl bg-white p-4 shadow-sm">
        <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="UUID Auth de l'utilisateur" aria-label="UUID utilisateur" className="min-w-0 flex-1 rounded-md border border-border px-3 py-2 font-mono text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} aria-label="Rôle" className="rounded-md border border-border bg-white px-3 py-2 text-sm">
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" className="rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white">Attribuer</button>
      </form>
      <div className="mt-4 space-y-1">
        {rows.map((r: any, i: number) => (
          <div key={`${r.user_id}-${r.role}-${i}`} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
            <span className="font-mono text-xs">{r.user_id}</span>
            <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{r.role}</span>
            <button type="button" onClick={() => revoke(r.user_id, r.role)} className="ml-auto text-xs text-red-600 hover:underline">Retirer</button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-[#777]">Aucun rôle. Premier super admin via Studio SQL (voir résumé).</p>}
      </div>
    </div>
  );
}
