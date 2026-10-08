import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";

type Row = { user_id: string; data: any; status: string };

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
} as any);

// ponytail: client-side search over 500 freshest profiles — server-side ilike on data->>name when this outgrows memory
function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // ponytail: $userId is a child route of /admin/users and this layout owns the outlet — without this the detail page never renders
  const child = (Route as any).useParams({ strict: false }) as { userId?: string };

  useEffect(() => {
    if (child?.userId) return;
    setErr(null);
    (async () => {
      try {
        const [p, st] = await Promise.all([
        supabase.from("swivv_profiles").select("user_id,data").order("updated_at", { ascending: false }).limit(500),
        supabase.from("swivv_user_status").select("user_id,status"),
      ]);
      if (p.error) {
        setErr(p.error.message);
        return;
      }
      const sm = new Map((st.data ?? []).map((x: any) => [x.user_id, x.status]));
      setRows((p.data ?? []).map((r: any) => ({ ...r, status: sm.get(r.user_id) ?? "active" })));
      audit("admin.users.view");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Chargement impossible.");
      }
    })();
  }, [child?.userId, tick]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter !== "all" && r.status !== filter) return false;
        if (!needle) return true;
        const d = r.data ?? {};
        return [d.name, d.city, d.email, r.user_id].some((v) => String(v ?? "").toLowerCase().includes(needle));
      })
      .slice(0, 50);
  }, [rows, q, filter]);

  if (err) return (
    <p className="text-sm text-red-600">
      {err}{" "}
      <button type="button" onClick={() => setTick((t) => t + 1)} className="font-medium underline">Réessayer</button>
    </p>
  );
  if (child?.userId) return <Outlet />;

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Utilisateurs ({rows.length})</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, ville, e-mail, ID…"
          aria-label="Rechercher un utilisateur"
          className="min-w-0 flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre statut" className="rounded-md border border-border bg-white px-3 py-2 text-sm">
          {["all", "active", "suspended", "banned", "deleted"].map((f) => (
            <option key={f} value={f}>{f === "all" ? "Tous" : f}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 space-y-2">
        {list.map((r) => (
          <Link
            key={r.user_id}
            to="/admin/users/$userId"
            params={{ userId: r.user_id }}
            className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
          >
            {r.data?.photos?.[0] ? (
              <img src={r.data.photos[0]} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="h-10 w-10 rounded-full bg-[#f2f2f2]" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-medium text-[#333]">
                {r.data?.name ?? "Sans nom"}{r.data?.age ? `, ${r.data.age}` : ""}
              </span>
              <span className="block truncate text-xs text-[#999]">
                {[r.data?.city, r.data?.country].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "active" ? "bg-green-100 text-green-800" : r.status === "suspended" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
              {r.status}
            </span>
          </Link>
        ))}
        {list.length === 0 && <p className="text-sm text-[#777]">Aucun résultat.</p>}
      </div>
    </div>
  );
}
