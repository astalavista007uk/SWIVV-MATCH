import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";
import { actorType, rowSeverity, targetLink, type AuditRow } from "@/lib/admin-audit";
import { toCsv } from "@/lib/admin-metrics";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAudit,
} as any);

const PAGE = 50;

// ponytail: read-only UI over an append-only table (no UPDATE/DELETE policies, GRANT SELECT+INSERT only) —
// retention purges, if ever needed, run via service_role outside this UI
function AdminAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("all");
  const [kind, setKind] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [sev, setSev] = useState("all");
  const [date, setDate] = useState("all");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("swivv_audit_log").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) setMsg(error.message);
      else setRows((data ?? []) as AuditRow[]);
      audit("admin.audit.view");
    })();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [q, actor, action, kind, outcome, sev, date]);

  const actions = useMemo(() => [...new Set(rows.map((r) => r.action))].sort(), [rows]);
  const kinds = useMemo(() => [...new Set(rows.map((r) => r.target_kind).filter(Boolean))].sort() as string[], [rows]);

  const list = useMemo(() => {
    const now = Date.now();
    const cut = date === "24h" ? now - 864e5 : date === "7d" ? now - 7 * 864e5 : date === "30d" ? now - 30 * 864e5 : 0;
    const needle = q.trim().toLowerCase();
    const aneedle = actor.trim().toLowerCase();
    return rows.filter((r) => {
      if (action !== "all" && r.action !== action) return false;
      if (kind !== "all" && r.target_kind !== kind) return false;
      if (outcome !== "all" && (r.outcome ?? "success") !== outcome) return false;
      if (sev !== "all" && rowSeverity(r) !== sev) return false;
      if (cut && new Date(r.created_at).getTime() < cut) return false;
      if (aneedle && !String(r.actor_id ?? "").toLowerCase().includes(aneedle)) return false;
      if (needle && ![r.action, r.target_kind, r.target_id, r.actor_id, r.reason, r.correlation, JSON.stringify(r.metadata)].some((v) => String(v ?? "").toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, actor, action, kind, outcome, sev, date]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice(page * PAGE, (page + 1) * PAGE);
  const sel = "rounded-md border border-border bg-white px-3 py-2 text-sm";
  const sevCls = (s: string) => (s === "critical" ? "bg-red-100 text-red-800" : s === "warning" ? "bg-amber-100 text-amber-800" : "bg-[#f2f2f2] text-[#555]");

  function exportCsv() {
    const csv = toCsv(
      ["id", "date", "acteur", "type_acteur", "action", "cible", "resultat", "gravite", "motif"],
      list.slice(0, 500).map((r) => [
        r.id, new Date(r.created_at).toLocaleString("fr-FR"), r.actor_id ?? "système", actorType(r),
        r.action, r.target_kind ? `${r.target_kind}:${r.target_id ?? ""}` : "", r.outcome ?? "success",
        rowSeverity(r), r.reason ?? "",
      ]),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit.csv";
    a.click();
    URL.revokeObjectURL(url);
    audit("admin.audit.export", "audit", undefined, { rows: Math.min(500, list.length) });
  }

  if (msg) return <p className="text-sm text-red-600">{msg}</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-medium text-[#333]">Audit ({list.length})</h1>
        <button type="button" onClick={exportCsv} className="ml-auto rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-[#555]">Export CSV</button>
      </div>
      <p className="mt-1 text-xs text-[#999]">Append-only : lecture + ajout (≥30) uniquement, aucune modification/suppression possible ici. Contenus sensibles exclus des charges utiles.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Action, cible, motif…" aria-label="Recherche plein texte" className="min-w-0 flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm" />
        <input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Acteur (ID)…" aria-label="Filtre acteur" className="w-40 rounded-md border border-border bg-white px-3 py-2 text-sm" />
        <select value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filtre action" className={sel}>
          {["all", ...actions].map((s) => <option key={s} value={s}>{s === "all" ? "Toutes actions" : s}</option>)}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filtre cible" className={sel}>
          {["all", ...kinds].map((s) => <option key={s} value={s}>{s === "all" ? "Toutes cibles" : s}</option>)}
        </select>
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)} aria-label="Filtre résultat" className={sel}>
          {[["all", "Tous résultats"], ["success", "Succès"], ["failure", "Échec"], ["rejected", "Rejeté"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={sev} onChange={(e) => setSev(e.target.value)} aria-label="Filtre gravité" className={sel}>
          {[["all", "Toutes gravités"], ["info", "Info"], ["warning", "Avertissement"], ["critical", "Critique"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filtre date" className={sel}>
          {[["all", "Toutes dates"], ["24h", "24 h"], ["7d", "7 j"], ["30d", "30 j"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="mt-4 space-y-1">
        {shown.map((r) => {
          const open = openId === r.id;
          const link = targetLink(r.target_kind, r.target_id);
          return (
            <div key={r.id} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              <button type="button" onClick={() => setOpenId(open ? null : r.id)} aria-expanded={open} className="flex w-full flex-wrap items-center gap-2 text-left">
                <span className="font-medium text-[#333]">{r.action}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${sevCls(rowSeverity(r))}`}>{rowSeverity(r)}</span>
                {(r.outcome ?? "success") !== "success" && <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-800">{r.outcome}</span>}
                {r.target_kind && <span className="text-[#555]">· {r.target_kind}:{String(r.target_id ?? "").slice(0, 8)}</span>}
                <span className="ml-auto font-mono text-xs text-[#999]">
                  {String(r.actor_id ?? "sys").slice(0, 8)} · {new Date(r.created_at).toLocaleString("fr-FR")}
                </span>
              </button>
              {open && (
                <div className="mt-2 border-t border-border pt-2 text-xs text-[#555]">
                  <p>ID <span className="font-mono">{r.id}</span> · acteur : {actorType(r)}{r.actor_id ? ` (${r.actor_id})` : ""}</p>
                  {r.reason && <p className="mt-1">Motif : {r.reason}</p>}
                  {r.correlation && <p className="mt-1">Corrélation : <span className="font-mono">{r.correlation}</span></p>}
                  {Object.keys(r.metadata ?? {}).length > 0 && <pre className="mt-1 overflow-x-auto rounded bg-[#f7f7f7] p-2 font-mono text-[11px]">{JSON.stringify(r.metadata, null, 1)}</pre>}
                  {link && (
                    <p className="mt-1">
                      {r.target_kind === "user" ? (
                        <a href={`/admin/users/${r.target_id}`} className="text-[#e91e63] underline">Ouvrir la fiche membre</a>
                      ) : (
                        <Link to={link.to as any} search={link.search as any} className="text-[#e91e63] underline">Ouvrir {r.target_kind}</Link>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-[#777]">Aucune entrée avec ces filtres.</p>}
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
