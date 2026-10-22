import { Outlet, createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";
import { profileCompleteness } from "@/lib/swivv-auth";
import { DIR_PAGE_SIZE, filterDir, sortDir, type DirFilter, type DirRow, type DirSort } from "@/lib/admin-users";

export const Route = createFileRoute("/admin/users")({
  validateSearch: (s: Record<string, unknown>) => ({ status: typeof s.status === "string" ? s.status : undefined }),
  component: AdminUsers,
} as any);

// ponytail: 500 freshest + small maps (status/verif/reports/cases) — server-side ilike + count when this outgrows memory
function AdminUsers() {
  const [rows, setRows] = useState<DirRow[]>([]);
  const [f, setF] = useState<DirFilter>({ q: "", status: (Route.useSearch() as any).status ?? "all", verified: "all", completion: "all", activity: "all", registered: "all" });
  const [sort, setSort] = useState<DirSort>("recent");
  const [page, setPage] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // ponytail: global useParams (not route-bound — a route only sees its own params, so the child $userId was always invisible here and the Outlet never rendered)
  const { userId: childUserId } = useParams({ strict: false }) as { userId?: string };

  useEffect(() => {
    if (childUserId) return;
    setErr(null);
    (async () => {
      try {
        const [p, st, vf, rp, cs] = await Promise.all([
          supabase.from("swivv_profiles").select("user_id,data,updated_at").order("updated_at", { ascending: false }).limit(500),
          supabase.from("swivv_user_status").select("user_id,status"),
          supabase.from("swivv_verification_requests").select("user_id,status"),
          supabase.from("swivv_reports").select("reported_user_id,status"),
          supabase.from("swivv_moderation_cases").select("subject_user_id,status"),
        ]);
        if (p.error) {
          setErr(p.error.message);
          return;
        }
        const sm = new Map((st.data ?? []).map((x: any) => [x.user_id, x.status]));
        const vm = new Map<string, string[]>();
        for (const x of (vf.data ?? []) as any[]) vm.set(x.user_id, [...(vm.get(x.user_id) ?? []), x.status]);
        const rc = new Map<string, number>();
        for (const x of (rp.data ?? []) as any[]) rc.set(x.reported_user_id, (rc.get(x.reported_user_id) ?? 0) + 1);
        const cm = new Set(((cs.data ?? []) as any[]).filter((x) => ["open", "investigating", "waiting"].includes(x.status)).map((x) => x.subject_user_id));
        setRows(((p.data ?? []) as any[]).map((r) => {
          const v = vm.get(r.user_id) ?? [];
          return {
            user_id: r.user_id,
            data: r.data,
            updatedAt: r.updated_at ?? null,
            status: sm.get(r.user_id) ?? "active",
            completion: profileCompleteness(r.data),
            verified: v.includes("approved") ? "yes" : v.includes("pending") ? "pending" : "no",
            reports: rc.get(r.user_id) ?? 0,
            hasCase: cm.has(r.user_id),
          } as DirRow;
        }));
        audit("admin.users.view");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Chargement impossible.");
      }
    })();
  }, [childUserId, tick]);

  useEffect(() => {
    setPage(0);
  }, [f, sort]);

  const list = useMemo(() => sortDir(filterDir(rows, f), sort), [rows, f, sort]);
  const pages = Math.max(1, Math.ceil(list.length / DIR_PAGE_SIZE));
  const shown = list.slice(page * DIR_PAGE_SIZE, (page + 1) * DIR_PAGE_SIZE);
  const set = (k: keyof DirFilter, v: string) => setF((p) => ({ ...p, [k]: v }));
  const sel = "rounded-md border border-border bg-white px-3 py-2 text-sm";

  if (err) return (
    <p className="text-sm text-red-600">
      {err}{" "}
      <button type="button" onClick={() => setTick((t) => t + 1)} className="font-medium underline">Réessayer</button>
    </p>
  );
  if (childUserId) return <Outlet />;

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Utilisateurs ({list.length})</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={f.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Nom, ville, e-mail, ID…"
          aria-label="Rechercher un utilisateur"
          className="min-w-0 flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm"
        />
        <select value={f.status} onChange={(e) => set("status", e.target.value)} aria-label="Filtre statut" className={sel}>
          {["all", "active", "suspended", "banned", "deleted"].map((s) => (
            <option key={s} value={s}>{s === "all" ? "Tous statuts" : s}</option>
          ))}
        </select>
        <select value={f.verified} onChange={(e) => set("verified", e.target.value)} aria-label="Filtre vérification" className={sel}>
          {[["all", "Vérif : tous"], ["yes", "Vérifiés"], ["pending", "En attente"], ["no", "Non vérifiés"]].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={f.completion} onChange={(e) => set("completion", e.target.value)} aria-label="Filtre complétion" className={sel}>
          {[["all", "Profils : tous"], ["complete", "Complets (≥ 80 %)"], ["incomplete", "Incomplets"]].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={f.activity} onChange={(e) => set("activity", e.target.value)} aria-label="Filtre activité" className={sel}>
          {[["all", "Activité : tous"], ["active7", "Actifs (7 j)"], ["idle30", "Inactifs (30 j+)"]].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={f.registered} onChange={(e) => set("registered", e.target.value)} aria-label="Filtre inscription" className={sel}>
          {[["all", "Inscrits : tous"], ["new7", "Nouveaux (7 j)"], ["new30", "Nouveaux (30 j)"]].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as DirSort)} aria-label="Tri" className={sel}>
          {[["recent", "Tri : récents"], ["newest", "Tri : inscrits"], ["name", "Tri : nom"], ["completion", "Tri : complétion"]].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 space-y-2">
        {shown.map((r) => (
          // ponytail: native anchor, not router Link — client-side param navigation silently dies in some mobile browsers; full load always lands (and exposes the real error if the detail itself is broken)
          <a
            key={r.user_id}
            href={`/admin/users/${r.user_id}`}
            className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
          >
            {r.data?.photos?.[0] ? (
              <img src={r.data.photos[0]} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="h-10 w-10 shrink-0 rounded-full bg-[#f2f2f2]" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-medium text-[#333]">
                {r.data?.name ?? "Sans nom"}{r.data?.age ? `, ${r.data.age}` : ""}
              </span>
              <span className="block truncate font-mono text-[11px] text-[#bbb]">{r.user_id}</span>
              <span className="block truncate text-xs text-[#999]">
                {[r.data?.city, r.data?.joinedAt ? `inscrit le ${new Date(r.data.joinedAt).toLocaleDateString("fr-FR")}` : null, r.updatedAt ? `actif le ${new Date(r.updatedAt).toLocaleDateString("fr-FR")}` : "jamais actif"].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1 text-[11px]">
              <span className={`rounded-full px-2 py-0.5 font-medium ${r.status === "active" ? "bg-green-100 text-green-800" : r.status === "suspended" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                {r.status}
              </span>
              <span className="text-[#777]">
                {r.completion} % · {r.verified === "yes" ? "✓ vérifié" : r.verified === "pending" ? "vérif en cours" : "non vérifié"}
                {r.reports > 0 && <span className="text-red-700"> · {r.reports} signalement(s)</span>}
                {r.hasCase && <span className="text-amber-700"> · cas ouvert</span>}
              </span>
            </span>
          </a>
        ))}
        {shown.length === 0 && <p className="text-sm text-[#777]">Aucun résultat.</p>}
      </div>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border bg-white px-3 py-1.5 disabled:opacity-40">←</button>
          <span className="text-[#777]">Page {page + 1} / {pages}</span>
          <button type="button" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border bg-white px-3 py-1.5 disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  );
}
