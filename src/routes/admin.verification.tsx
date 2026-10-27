import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";
import { displayStatus, needsReason } from "@/lib/admin-verify";

const STATUSES = ["pending", "approved", "rejected", "expired"];
const KINDS = ["email", "phone", "profile", "identity"];

export const Route = createFileRoute("/admin/verification")({
  validateSearch: (s: Record<string, unknown>) => ({ status: typeof s.status === "string" ? s.status : undefined }),
  component: AdminVerification,
} as any);

// ponytail: no IDV provider, no document storage (minimum-data: kinds + decisions only) —
// email stays Supabase Auth, face check stays local liveness (never an identity proof); reviewer + reason per decision
function AdminVerification() {
  const [rows, setRows] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [staff, setStaff] = useState<{ id: string; role: string }[]>([]);
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [filter, setFilter] = useState((Route.useSearch() as any).status ?? "pending");
  const [kind, setKind] = useState("all");
  const [date, setDate] = useState("all");
  const [assign, setAssign] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);

  async function load() {
    let query: any = supabase.from("swivv_verification_requests").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") query = query.eq("status", filter);
    const { data, error } = await query;
    if (error) {
      setMsg(error.message);
      return;
    }
    const list = (data ?? []) as any[];
    setRows(list);
    const { data: { user } } = await supabase.auth.getUser();
    setMyId(user?.id ?? null);
    const ids = new Set<string>();
    for (const r of list) for (const k of ["user_id", "reviewed_by", "assigned_to"]) if (typeof r[k] === "string" && /^[0-9a-f-]{36}$/i.test(r[k])) ids.add(r[k]);
    const st = await (supabase as any).from("user_roles").select("user_id,role");
    for (const x of ((st.data ?? []) as any[])) if (typeof x.user_id === "string") ids.add(x.user_id);
    if (ids.size) {
      const { data: profs } = await (supabase as any).from("swivv_profiles").select("user_id,data").in("user_id", [...ids].slice(0, 200));
      const map: Record<string, string> = {};
      for (const p of (profs as any[]) ?? []) map[p.user_id] = (p.data as any)?.name ?? p.user_id.slice(0, 8);
      setNames(map);
    }
    setStaff(((st.data ?? []) as any[]).map((x) => ({ id: x.user_id as string, role: x.role as string })));
  }

  useEffect(() => {
    load();
    audit("admin.verify.view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const nm = (id: string | null) => {
    if (!id) return "—";
    return /^[0-9a-f-]{36}$/i.test(id) ? (names[id] ?? `${id.slice(0, 8)}…`) : `Démo #${id}`;
  };

  const shown = useMemo(() => {
    const now = Date.now();
    const cut = date === "24h" ? now - 864e5 : date === "7d" ? now - 7 * 864e5 : date === "30d" ? now - 30 * 864e5 : 0;
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (kind !== "all" && r.kind !== kind) return false;
      if (cut && new Date(r.created_at).getTime() < cut) return false;
      if (assign === "me" && r.assigned_to !== myId) return false;
      if (assign === "none" && r.assigned_to) return false;
      if (needle && ![nm(r.user_id), r.user_id].some((v) => String(v ?? "").toLowerCase().includes(needle))) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, kind, date, assign, q, myId, names]);

  async function openDetail(r: any) {
    if (openId === r.id) {
      setOpenId(null);
      return;
    }
    setOpenId(r.id);
    setReason(r.review_note ?? "");
    if (history[r.user_id] !== undefined || !r.user_id) return;
    const { data } = await supabase.from("swivv_verification_requests").select("kind,status,created_at,reviewed_at").eq("user_id", r.user_id).order("created_at", { ascending: false }).limit(20);
    setHistory((h) => ({ ...h, [r.user_id]: (data ?? []) as any[] }));
  }

  async function decide(r: any, status: "approved" | "rejected") {
    if (!needsReason(status, reason)) {
      setMsg("Un motif est obligatoire pour approuver ou rejeter.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("swivv_verification_requests").update({
      status,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      review_note: reason.trim(),
    } as any).eq("id", r.id);
    if (error) {
      setMsg(error.message.includes("column") ? "Colonne review_note absente — applique la migration 20261014000000_swivv_verification.sql." : error.message);
      return;
    }
    audit(`admin.verify.${status}`, "verification", r.id, { reason: reason.trim() });
    setReason("");
    load();
  }

  async function reopen(r: any) {
    const { error } = await supabase.from("swivv_verification_requests").update({ status: "pending", reviewed_by: null, reviewed_at: null } as any).eq("id", r.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.verify.reopen", "verification", r.id);
    setMsg("Demande rouverte (réexamen).");
    load();
  }

  async function requestEvidence(r: any) {
    if (!r.user_id) return;
    const { error } = await (supabase as any).from("swivv_notifications").insert({ user_id: r.user_id, type: "admin", title: "Complément de vérification", message: `Pour ta demande (${r.kind}), l'équipe a besoin d'un justificatif complémentaire. Réponds via le support.` });
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.verify.evidence", "verification", r.id);
    setMsg("Complément demandé au membre.");
  }

  const sel = "rounded-md border border-border bg-white px-3 py-2 text-sm";

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Vérification ({shown.length})</h1>
      <p className="mt-1 text-xs text-[#999]">Aucun fournisseur d'identité branché — une photo ou un score IA ne prouve jamais une identité. E-mail via Supabase Auth · visage = contrôle local uniquement.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Compte, nom, ID…" aria-label="Rechercher" className="min-w-0 flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre statut" className={sel}>
          {["all", ...STATUSES].map((s) => <option key={s} value={s}>{s === "all" ? "Tous" : s}</option>)}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filtre type" className={sel}>
          {["all", ...KINDS].map((s) => <option key={s} value={s}>{s === "all" ? "Tous types" : s}</option>)}
        </select>
        <select value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filtre date" className={sel}>
          {[["all", "Toutes dates"], ["24h", "24 h"], ["7d", "7 j"], ["30d", "30 j"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={assign} onChange={(e) => setAssign(e.target.value)} aria-label="Filtre assignation" className={sel}>
          {[["all", "Tous"], ["me", "Assignées à moi"], ["none", "Non assignées"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}
      <div className="mt-4 space-y-2">
        {shown.map((r) => {
          const open = openId === r.id;
          return (
            <article key={r.id} className="rounded-xl bg-white p-3 shadow-sm">
              <button type="button" onClick={() => openDetail(r)} aria-expanded={open} className="flex w-full flex-wrap items-center gap-2 text-left text-sm">
                <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{r.kind}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "approved" ? "bg-green-100 text-green-800" : r.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{displayStatus(r)}</span>
                <span className="text-[#333]">{nm(r.user_id)}</span>
                <span className="ml-auto text-xs text-[#999]" title={new Date(r.created_at).toLocaleString("fr-FR")}>
                  {new Date(r.created_at).toLocaleDateString("fr-FR")} · réexaminé par : {r.reviewed_by ? nm(r.reviewed_by) : "—"} · assigné : {r.assigned_to ? nm(r.assigned_to) : "—"}
                </span>
              </button>
              {open && (
                <div className="mt-3 border-t border-border pt-3 text-sm">
                  <p className="font-mono text-[11px] text-[#bbb]">ID {r.id}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {r.user_id && <Link to="/admin/users/$userId" params={{ userId: r.user_id }} className="text-[#e60050] underline">Fiche membre 360</Link>}
                  </div>
                  {(history[r.user_id] ?? []).length > 0 && (
                    <div className="mt-2 rounded-lg bg-[#f7f7f7] p-2">
                      <p className="text-xs font-medium text-[#555]">Historique du compte ({history[r.user_id].length})</p>
                      {history[r.user_id].map((x: any, i: number) => <p key={i} className="text-xs text-[#777]">{x.kind} · {x.status} · {new Date(x.created_at).toLocaleDateString("fr-FR")}</p>)}
                    </div>
                  )}
                  {r.review_note && <p className="mt-2 text-xs text-[#555]">Motif archivé : « {r.review_note} »</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select value={r.assigned_to ?? ""} onChange={async (e) => {
                      const { error } = await supabase.from("swivv_verification_requests").update({ assigned_to: e.target.value || null } as any).eq("id", r.id);
                      if (error) {
                        setMsg(error.message.includes("column") ? "Colonne assigned_to absente — applique la migration 20261014000000_swivv_verification.sql." : error.message);
                        return;
                      }
                      audit("admin.verify.assign", "verification", r.id);
                      load();
                    }} aria-label="Assigner" className="rounded border border-border px-2 py-1 text-xs">
                      <option value="">Assigner…</option>
                      {staff.map((s) => <option key={s.id} value={s.id}>{nm(s.id)} ({s.role})</option>)}
                    </select>
                    {r.status === "pending" && <button type="button" onClick={() => requestEvidence(r)} className="rounded border border-border px-2 py-1 text-xs">Demander un justificatif</button>}
                  </div>
                  {(r.status === "pending" || open) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif de la décision (obligatoire)…" maxLength={500} aria-label="Motif" className="min-w-52 flex-1 rounded border border-border px-2 py-1 text-xs" />
                      {r.status === "pending" && (
                        <>
                          <button type="button" onClick={() => decide(r, "approved")} className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white">Approuver</button>
                          <button type="button" onClick={() => decide(r, "rejected")} className="rounded border border-border px-3 py-1 text-xs">Rejeter</button>
                        </>
                      )}
                      {r.status === "rejected" && <button type="button" onClick={() => reopen(r)} className="rounded border border-border px-3 py-1 text-xs">Réexaminer (appel)</button>}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-[#777]">Aucune demande avec ces filtres. L'e-mail reste vérifié via Supabase Auth ; les demandes identité arriveront ici.</p>}
      </div>
    </div>
  );
}
