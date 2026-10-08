import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";

function Card({ label, value, to }: { label: string; value: string; to?: string }) {
  const body = (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-3xl font-bold text-[#333]">{value}</p>
      <p className="mt-1 text-sm text-[#777]">{label}</p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
} as any);

// ponytail: single-pass profile scan (no created_at on swivv_profiles yet — signup-trend charts need that column first)
function AdminDashboard() {
  const [s, setS] = useState<Record<string, number>>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const day = new Date(Date.now() - 864e5).toISOString();
        const week = new Date(Date.now() - 7 * 864e5).toISOString();
        const [prof, chats, rep, tick, cas, stat, msgDay] = await Promise.all([
          supabase.from("swivv_profiles").select("data, updated_at").limit(2000),
          supabase.from("swivv_chats").select("msg_id", { count: "exact", head: true }),
          supabase.from("swivv_reports").select("id,status"),
          supabase.from("swivv_support_tickets").select("id,status,created_at"),
          supabase.from("swivv_moderation_cases").select("id,status"),
          supabase.from("swivv_user_status").select("user_id,status"),
          supabase.from("swivv_chats").select("msg_id", { count: "exact", head: true }).gte("created_at" as any, day),
        ]);
        if (prof.error) throw prof.error;
        const rows = (prof.data ?? []) as { data: any; updated_at: string }[];
        let men = 0;
        let women = 0;
        let active = 0;
        for (const r of rows) {
          if (r.data?.gender === "man") men++;
          else if (r.data?.gender === "woman") women++;
          if (r.updated_at >= week) active++;
        }
        const open = (list: any[] | null, ...st: string[]) =>
          (list ?? []).filter((x) => st.includes(x.status)).length;
        setS({
          users: rows.length,
          men,
          women,
          activeWeek: active,
          messages: chats.count ?? 0,
          msgDay: (msgDay as any).count ?? 0,
          reports: open(rep.data, "new", "investigating", "waiting"),
          tickets: open(tick.data, "open", "assigned", "waiting_user", "waiting_internal"),
          ticketsToday: (tick.data ?? []).filter((t: any) => t.created_at >= day).length,
          cases: open(cas.data, "open", "investigating", "waiting"),
          suspended: (stat.data ?? []).filter((x: any) => x.status === "suspended").length,
          banned: (stat.data ?? []).filter((x: any) => x.status === "banned").length,
        });
        audit("admin.dashboard.view");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Chargement impossible.");
      }
    })();
  }, []);

  if (err) return <p className="text-sm text-red-600">{err}</p>;

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Dashboard</h1>
      <h2 className="mt-6 font-medium text-[#555]">Utilisateurs</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Profils" value={String(s.users ?? "…")} to="/admin/users" />
        <Card label="Hommes" value={String(s.men ?? "…")} />
        <Card label="Femmes" value={String(s.women ?? "…")} />
        <Card label="Actifs (7 j)" value={String(s.activeWeek ?? "…")} />
      </div>
      <h2 className="mt-6 font-medium text-[#555]">Engagement</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Messages (copies)" value={String(s.messages ?? "…")} />
        <Card label="Messages (24 h)" value={String(s.msgDay ?? "…")} />
        <Card label="Suspendus" value={String(s.suspended ?? "…")} to="/admin/users" />
        <Card label="Bannis" value={String(s.banned ?? "…")} to="/admin/users" />
      </div>
      <h2 className="mt-6 font-medium text-[#555]">Modération & support</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Signalements ouverts" value={String(s.reports ?? "…")} to="/admin/reports" />
        <Card label="Cas ouverts" value={String(s.cases ?? "…")} to="/admin/moderation" />
        <Card label="Tickets ouverts" value={String(s.tickets ?? "…")} to="/admin/support" />
        <Card label="Tickets du jour" value={String(s.ticketsToday ?? "…")} to="/admin/support" />
      </div>
    </div>
  );
}
