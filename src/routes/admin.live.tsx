import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";
import { mergeFeed, severityFor, type FeedRow } from "@/lib/admin-live";

export const Route = createFileRoute("/admin/live")({
  component: AdminLive,
} as any);

// ponytail: 20s poll over per-table "latest 8" + one realtime channel (reports INSERT) —
// metadata only (no bodies/locations/tokens); buffer capped at 100; paused when the tab hides.
// ponytail: logins/auth failures are Supabase-Auth-side only — honestly listed as unsupported, not polled.
function AdminLive() {
  const [feed, setFeed] = useState<FeedRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [conn, setConn] = useState<"live" | "erreur" | "pause">("live");
  const [type, setType] = useState("all");
  const [sev, setSev] = useState("all");
  const [acct, setAcct] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [emptyMsg, setEmptyMsg] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function poll() {
    if (document.visibilityState === "hidden") {
      setConn("pause");
      return;
    }
    try {
      const q = supabase as any;
      const since = new Date(Date.now() - 30 * 6e4).toISOString();
      const [rp, tk, vf, st, cs, lk, ma, bl, rx, ev, runs, prof, regs] = await Promise.all([
        supabase.from("swivv_reports").select("id,category,priority,reporter_id,reported_user_id,created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("swivv_support_tickets").select("id,subject,user_id,created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("swivv_verification_requests").select("id,kind,user_id,status,created_at").order("created_at", { ascending: false }).limit(8),
        q.from("swivv_user_status").select("user_id,status,updated_at").order("updated_at", { ascending: false }).limit(8),
        supabase.from("swivv_moderation_cases").select("id,subject_user_id,status,created_at").order("created_at", { ascending: false }).limit(8),
        q.from("swivv_likes").select("liker_id,liked_id,created_at").order("created_at", { ascending: false }).limit(8),
        q.from("swivv_matches").select("user_a,user_b,created_at").order("created_at", { ascending: false }).limit(8),
        q.from("swivv_blocks").select("blocker_id,blocked_id,created_at").order("created_at", { ascending: false }).limit(8),
        q.from("swivv_photo_reactions").select("reactor_id,owner_id,reaction,created_at").order("created_at", { ascending: false }).limit(8),
        q.from("swivv_events").select("type,user_id,created_at").order("created_at", { ascending: false }).limit(8),
        q.from("swivv_ai_runs").select("rule_key,status,error,created_at").eq("status", "failed").order("created_at", { ascending: false }).limit(8),
        q.from("swivv_profiles").select("user_id,updated_at").gte("updated_at", since).order("updated_at", { ascending: false }).limit(8),
        supabase.from("profiles").select("id,created_at").order("created_at", { ascending: false }).limit(5).then((r: any) => (r.error ? [] : (r.data ?? []))),
      ]);
      const rows: FeedRow[] = [];
      const push = (r: FeedRow) => rows.push(r);
      for (const r of ((rp.data ?? []) as any[])) push({ key: `report:${r.id}`, type: "report", label: `Signalement ${r.category} (${r.priority})`, at: r.created_at, actorId: r.reporter_id, targetId: r.reported_user_id, targetKind: "user", severity: severityFor("report", r.priority) });
      for (const t of ((tk.data ?? []) as any[])) push({ key: `ticket:${t.id}`, type: "ticket", label: `Ticket « ${t.subject} »`, at: t.created_at, actorId: t.user_id, targetId: t.id, targetKind: "ticket", severity: "warning" });
      for (const x of ((vf.data ?? []) as any[])) push({ key: `verify:${x.id}`, type: "verify", label: `Vérification ${x.kind} (${x.status})`, at: x.created_at, actorId: x.user_id, targetId: x.user_id, targetKind: "user", severity: "warning" });
      for (const s of ((st.data ?? []) as any[])) if (s.status !== "active") push({ key: `restrict:${s.user_id}:${s.status}`, type: "restrict", label: `Compte ${s.status}`, at: s.updated_at, targetId: s.user_id, targetKind: "user", severity: "critical" });
      for (const c of ((cs.data ?? []) as any[])) push({ key: `case:${c.id}`, type: "case", label: `Cas modération (${c.status})`, at: c.created_at, targetId: c.subject_user_id, targetKind: "user", severity: "warning" });
      for (const l of ((lk.data ?? []) as any[])) push({ key: `like:${l.liker_id}:${l.liked_id}:${l.created_at}`, type: "like", label: "Like", at: l.created_at, actorId: l.liker_id, targetId: l.liked_id, targetKind: "user", severity: "info" });
      for (const m of ((ma.data ?? []) as any[])) push({ key: `match:${m.user_a}:${m.user_b}:${m.created_at}`, type: "match", label: "Match", at: m.created_at, actorId: m.user_a, targetId: m.user_b, targetKind: "user", severity: "warning" });
      for (const b of ((bl.data ?? []) as any[])) push({ key: `block:${b.blocker_id}:${b.blocked_id}:${b.created_at}`, type: "block", label: "Blocage", at: b.created_at, actorId: b.blocker_id, targetId: b.blocked_id, targetKind: "user", severity: "warning" });
      for (const x of ((rx.data ?? []) as any[])) push({ key: `rx:${x.reactor_id}:${x.owner_id}:${x.created_at}`, type: "reaction", label: `Réaction ${x.reaction ?? ""}`, at: x.created_at, actorId: x.reactor_id, targetId: x.owner_id, targetKind: "user", severity: "info" });
      for (const e of ((ev.data ?? []) as any[])) push({ key: `ev:${e.type}:${e.user_id}:${e.created_at}`, type: e.type === "signup_completed" ? "signup" : "event", label: e.type === "signup_completed" ? "Inscription finalisée" : `Événement ${e.type}`, at: e.created_at, actorId: e.user_id, targetId: e.user_id, targetKind: "user", severity: "info" });
      for (const r of ((runs.data ?? []) as any[])) push({ key: `ai-fail:${r.rule_key}:${r.created_at}`, type: "ai-fail", label: `Échec automation ${r.rule_key}`, at: r.created_at, severity: "critical" });
      for (const p of ((prof.data ?? []) as any[])) push({ key: `prof:${p.user_id}:${p.updated_at}`, type: "profile", label: "Profil mis à jour", at: p.updated_at, actorId: p.user_id, targetId: p.user_id, targetKind: "user", severity: "info" });
      for (const g of regs as any[]) push({ key: `signup:${g.id}`, type: "signup", label: "Compte créé", at: g.created_at, actorId: g.id, targetId: g.id, targetKind: "user", severity: "info" });
      setFeed((f) => {
        const next = mergeFeed(f, rows);
        setEmptyMsg(next.length === 0);
        return next;
      });
      const ids = new Set<string>();
      for (const r of rows) for (const k of ["actorId", "targetId"] as const) {
        const v = r[k];
        if (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v)) ids.add(v);
      }
      if (ids.size) {
        const { data: profs } = await q.from("swivv_profiles").select("user_id,data").in("user_id", [...ids].slice(0, 100));
        setNames((m) => {
          const n = { ...m };
          for (const p of (profs as any[]) ?? []) n[p.user_id] = (p.data as any)?.name ?? p.user_id.slice(0, 8);
          return n;
        });
      }
      setConn("live");
    } catch {
      setConn("erreur");
    }
  }

  useEffect(() => {
    poll();
    audit("admin.live.view");
    timer.current = setInterval(poll, 20000);
    const onVis = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVis);
    // ponytail: single realtime channel (new reports only — the highest-value live event);
    // the poller covers the rest and dedupes, so a dropped socket degrades to 20s delay, never blindness
    const ch = supabase.channel("admin-live-reports").on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "swivv_reports" },
      (payload: any) => {
        const r = payload.new ?? {};
        setFeed((f) => mergeFeed(f, [{
          key: `report:${r.id}`, type: "report", label: `Signalement ${r.category} (${r.priority})`,
          at: r.created_at ?? new Date().toISOString(), actorId: r.reporter_id,
          targetId: r.reported_user_id, targetKind: "user", severity: severityFor("report", r.priority),
        }]));
      },
    ).subscribe();
    return () => {
      if (timer.current) clearInterval(timer.current);
      document.removeEventListener("visibilitychange", onVis);
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nm = (id?: string | null) => {
    if (!id) return "—";
    return /^[0-9a-f-]{36}$/i.test(id) ? (names[id] ?? `${id.slice(0, 8)}…`) : `Démo #${id}`;
  };
  const types = [...new Set(feed.map((r) => r.type))].sort();
  const needle = acct.trim().toLowerCase();
  const shown = feed.filter((r) => {
    if (type !== "all" && r.type !== type) return false;
    if (sev !== "all" && r.severity !== sev) return false;
    if (needle && ![nm(r.actorId), nm(r.targetId), r.actorId, r.targetId].some((x) => String(x ?? "").toLowerCase().includes(needle))) return false;
    return true;
  });
  const sel = "rounded-md border border-border bg-white px-3 py-2 text-sm";
  const sevCls = (s: string) => (s === "critical" ? "bg-red-100 text-red-800" : s === "warning" ? "bg-amber-100 text-amber-800" : "bg-[#f2f2f2] text-[#555]");

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-medium text-[#333]">Activité en temps réel</h1>
        <span className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${conn === "live" ? "bg-green-100 text-green-800" : conn === "pause" ? "bg-[#f2f2f2] text-[#555]" : "bg-red-100 text-red-800"}`}>
          <span className={`h-2 w-2 rounded-full ${conn === "live" ? "bg-green-600" : conn === "pause" ? "bg-[#999]" : "bg-red-600"}`} />
          {conn === "live" ? "En direct (20 s)" : conn === "pause" ? "En pause (onglet masqué)" : "Déconnecté — réessai auto"}
        </span>
      </div>
      <p className="mt-1 text-xs text-[#999]">Métadonnées uniquement (ni contenus, ni positions, ni tokens). Connexions/échecs d'auth : tableau Supabase Auth uniquement. Surveillance limitée à l'exploitation et à la sécurité.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input value={acct} onChange={(e) => setAcct(e.target.value)} placeholder="Compte (nom ou ID)…" aria-label="Filtre compte" className="min-w-0 flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm" />
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filtre type" className={sel}>
          {["all", ...types].map((s) => <option key={s} value={s}>{s === "all" ? "Tous types" : s}</option>)}
        </select>
        <select value={sev} onChange={(e) => setSev(e.target.value)} aria-label="Filtre gravité" className={sel}>
          {[["all", "Toutes"], ["info", "Info"], ["warning", "Avertissement"], ["critical", "Critique"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="mt-4 space-y-1">
        {shown.map((r) => {
          const open = openKey === r.key;
          return (
            <div key={r.key} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              <button type="button" onClick={() => setOpenKey(open ? null : r.key)} aria-expanded={open} className="flex w-full flex-wrap items-center gap-2 text-left">
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${sevCls(r.severity)}`}>{r.type}</span>
                <span className="text-[#333]">{r.label}</span>
                <span className="text-xs text-[#777]">{nm(r.actorId)}{r.targetId && r.targetId !== r.actorId ? ` → ${nm(r.targetId)}` : ""}</span>
                <span className="ml-auto font-mono text-xs text-[#999]">{new Date(r.at).toLocaleTimeString("fr-FR")}</span>
              </button>
              {open && (
                <div className="mt-1 border-t border-border pt-1 text-xs text-[#555]">
                  <p>{new Date(r.at).toLocaleString("fr-FR")} · source : temps réel / sondage · résultat : enregistré</p>
                  {r.targetKind === "user" && r.targetId && /^[0-9a-f-]{36}$/i.test(r.targetId) && (
                    <p className="mt-1"><a href={`/admin/users/${r.targetId}`} className="text-[#e60050] underline">Fiche membre</a></p>
                  )}
                  {r.targetKind === "ticket" && (
                    <p className="mt-1"><Link to="/admin/support" search={{ status: "all" } as any} className="text-[#e60050] underline">Ouvrir le support</Link></p>
                  )}
                  {r.type === "report" && (
                    <p className="mt-1"><Link to="/admin/reports" search={{ status: "new" } as any} className="text-[#e60050] underline">File signalements</Link></p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-[#777]">{conn === "erreur" ? "Flux déconnecté — réessai automatique en cours." : emptyMsg || feed.length === 0 ? "Chargement du flux…" : "Aucune activité récente."}</p>}
      </div>
    </div>
  );
}
