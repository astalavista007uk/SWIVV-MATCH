import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit, useAdminRole } from "@/lib/admin";
import { profileCompleteness } from "@/lib/swivv-auth";
import { recommend } from "@/lib/admin-engage";
import { fmtDelta, median } from "@/lib/admin-metrics";

export const Route = createFileRoute("/admin/engage")({
  component: AdminEngage,
} as any);

const TABS = ["Activation", "Engagement", "Rétention", "Incomplets", "Interactions", "Recommandations", "Expériences"] as const;

// ponytail: aggregates only (no individual ranking, no message mining, no auto-messaging) —
// metrics mirror admin/analytics definitions; experiments are a manual journal (no feature flags wired)
function AdminEngage() {
  const { level } = useAdminRole();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Activation");
  const [d, setD] = useState<Record<string, any>>({});
  const [exps, setExps] = useState<any[]>([]);
  const [fTitle, setFTitle] = useState("");
  const [fHyp, setFHyp] = useState("");
  const [fAud, setFAud] = useState("all");
  const [fMetrics, setFMetrics] = useState("");
  const [fConcl, setFConcl] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const now = Date.now();
        const since = new Date(now - 30 * 864e5).toISOString();
        const prevStart = new Date(now - 60 * 864e5).toISOString();
        const q = supabase as any;
        const [legacyHead, legacy, profs, chats, likes, matches, views, reacts, ann, mailFail, runFail, ex] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).then((r) => (r.error ? null : r.count)),
          supabase.from("profiles").select("id,created_at").order("created_at", { ascending: false }).limit(5000).then((r) => (r.error ? null : (r.data ?? []))),
          supabase.from("swivv_profiles").select("user_id,data,updated_at").limit(2000),
          supabase.from("swivv_chats").select("msg_id,created_at").gte("created_at" as any, prevStart).order("created_at" as any, { ascending: false }).limit(20000),
          q.from("swivv_likes").select("liker_id,created_at").gte("created_at", prevStart).order("created_at", { ascending: false }).limit(5000),
          q.from("swivv_matches").select("user_a,user_b,created_at").gte("created_at", prevStart).order("created_at", { ascending: false }).limit(5000),
          q.from("swivv_profile_views").select("viewer_id,created_at").gte("created_at", prevStart).order("created_at", { ascending: false }).limit(5000),
          q.from("swivv_photo_reaction_events").select("created_at").gte("created_at", prevStart).limit(5000),
          q.from("swivv_notifications").select("read").eq("type", "announcement").order("created_at", { ascending: false }).limit(1000),
          q.from("swivv_email_log").select("id", { count: "exact", head: true }).eq("status", "failed"),
          q.from("swivv_ai_runs").select("id", { count: "exact", head: true }).eq("status", "failed"),
          q.from("swivv_experiments").select("*").order("created_at", { ascending: false }).limit(50).then((r: any) => (r.error ? [] : (r.data ?? []))),
        ]);
        if (profs.error) throw profs.error;
        const members = (profs.data ?? []) as { user_id: string; data: any; updated_at: string }[];
        const createdBy = new Map(((legacy ?? []) as any[]).map((x: any) => [x.id, new Date(x.created_at).getTime()]));
        const pct = (m: any) => profileCompleteness(m.data);
        const complete = members.filter((m) => pct(m) >= 80);
        const withPhoto = members.filter((m) => (m.data?.photos ?? []).length > 0);
        const withBio = members.filter((m) => ((m.data?.bio ?? "") as string).trim());
        const reg2c = members.flatMap((m) => {
          const c = createdBy.get(m.user_id);
          return c && pct(m) >= 80 ? [(new Date(m.updated_at).getTime() - c) / 36e5] : [];
        });
        const act = (cut: string) => members.filter((m) => m.updated_at >= cut).length;
        const dau = act(new Date(now - 864e5).toISOString());
        const wau = act(new Date(now - 7 * 864e5).toISOString());
        const mau = act(new Date(now - 30 * 864e5).toISOString());
        const returning = members.filter((m) => {
          const c = createdBy.get(m.user_id);
          return m.updated_at >= new Date(now - 7 * 864e5).toISOString() && c != null && now - c > 30 * 864e5;
        }).length;
        const inac = [0, 0, 0, 0];
        for (const m of members) {
          const age = now - new Date(m.updated_at).getTime();
          inac[age <= 7 * 864e5 ? 0 : age <= 30 * 864e5 ? 1 : age <= 90 * 864e5 ? 2 : 3]++;
        }
        const msgs = (chats.data ?? []) as { msg_id: string; created_at: string }[];
        const cur = new Set(msgs.filter((m) => m.created_at >= since).map((m) => m.msg_id));
        const prv = new Set(msgs.filter((m) => m.created_at < since).map((m) => m.msg_id));
        const split = (rows: any[]) => [rows.filter((r) => r.created_at >= since).length, rows.filter((r) => r.created_at < since).length];
        const [lkC, lkP] = split((likes.data ?? []) as any[]);
        const [maC, maP] = split((matches.data ?? []) as any[]);
        const [vwC, vwP] = split((views.data ?? []) as any[]);
        const [rxC, rxP] = split((reacts.data ?? []) as any[]);
        const anns = (ann.data ?? []) as { read: boolean }[];
        const incomplets = members.filter((m) => pct(m) < 80).sort((a, b) => pct(a) - pct(b)).slice(0, 20);
        const names: Record<string, string> = {};
        for (const m of members) names[m.user_id] = m.data?.name ?? m.user_id.slice(0, 8);
        setD({
          legacyNull: legacy == null,
          accounts: legacyHead, scanned: members.length,
          compRate: Math.round((100 * complete.length) / Math.max(1, members.length)),
          photoRate: Math.round((100 * withPhoto.length) / Math.max(1, members.length)),
          bioRate: Math.round((100 * withBio.length) / Math.max(1, members.length)),
          reg2c: median(reg2c.filter((h) => h >= 0)),
          dau, wau, mau, returning, inac,
          msgC: cur.size, msgP: prv.size,
          lkC, lkP, maC, maP, vwC, vwP, rxC, rxP,
          readRate: anns.length ? Math.round((100 * anns.filter((a) => a.read).length) / anns.length) : null,
          annN: anns.length,
          failMail: mailFail.count ?? 0, failRuns: runFail.count ?? 0,
          incomplets: incomplets.map((m) => ({ id: m.user_id, name: names[m.user_id], pct: pct(m) })),
        });
        setExps(ex);
        audit("admin.engage.view");
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Chargement impossible.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recos = useMemo(() => recommend({
    completionRate: d.compRate ?? null, photoRate: d.photoRate ?? null, bioRate: d.bioRate ?? null,
    regToCompleteH: d.reg2c ?? null, msgPerActive: d.wau ? Math.round((10 * (d.msgC ?? 0)) / d.wau) / 10 : null,
    announceReadRate: d.readRate ?? null, failMail: d.failMail ?? 0, failRuns: d.failRuns ?? 0, scanned: d.scanned ?? 0,
  }), [d]);

  const kpi = (label: string, value: string, def: string, delta?: string) => (
    <div className="rounded-xl bg-white p-4 shadow-sm" title={def}>
      <p className="text-3xl font-bold text-[#333]">{value}</p>
      <p className="mt-1 text-sm text-[#777]">
        {label}
        {delta && delta !== "—" && (
          <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${delta.startsWith("-") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{delta}</span>
        )}
      </p>
    </div>
  );
  const v = (x: any) => (x == null ? "…" : String(x));

  async function createExp(e: React.FormEvent) {
    e.preventDefault();
    if (!fTitle.trim() || !fHyp.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("swivv_experiments").insert({
      title: fTitle.trim(), hypothesis: fHyp.trim(), audience: fAud,
      metrics: fMetrics.split(",").map((s) => s.trim()).filter(Boolean), created_by: user?.id,
    });
    if (error) {
      setMsg(error.message.includes("does not exist") || error.message.includes("schema cache") ? "Table absente — applique la migration 20261020000000_swivv_experiments.sql." : error.message);
      return;
    }
    audit("admin.exp.create", "experiment", undefined, { title: fTitle.trim() });
    setFTitle("");
    setFHyp("");
    setFMetrics("");
    setMsg("Expérience enregistrée (brouillon — aucun flag câblé).");
  }

  async function advanceExp(x: any, status: string) {
    if (status === "done" && !(fConcl[x.id] ?? "").trim()) {
      setMsg("Une conclusion est obligatoire — jamais de succès déclaré sans données.");
      return;
    }
    const { error } = await (supabase as any).from("swivv_experiments").update({ status, conclusion: (fConcl[x.id] ?? "").trim() || null }).eq("id", x.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.exp.status", "experiment", x.id, { status });
    setMsg(`Expérience → ${status}.`);
  }

  if (msg && !d.scanned && !exps.length) return <p className="text-sm text-red-600">{msg}</p>;

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Engagement & rétention</h1>
      <p className="mt-1 text-xs text-[#999]">Agrégats uniquement — aucun classement individuel, aucun reciblage auto, plus de messages ≠ meilleur résultat.</p>
      <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Engagement">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === t ? "bg-[#14112b] text-white" : "bg-white text-[#555]"}`}>{t}</button>
        ))}
      </nav>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}

      {tab === "Activation" && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpi("Comptes → profils", d.accounts == null ? "…" : `${d.scanned} / ${d.accounts}`, d.legacyNull ? "Comptes illisibles pour ce rôle." : "Profils dating scannés / comptes auth (toutes époques).")}
          {kpi("Taux de complétion", d.compRate == null ? "…" : `${d.compRate} %`, "Profils ≥ 80 % (base 2000).")}
          {kpi("Avec photo", d.photoRate == null ? "…" : `${d.photoRate} %`, "Au moins une photo (base 2000).")}
          {kpi("Inscription → profil (médiane)", d.reg2c == null ? "—" : `${Math.round(d.reg2c)} h`, "legacy.created_at → updated_at, complétés (approx).")}
        </div>
      )}

      {tab === "Engagement" && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpi("Actifs 24 h / 7 j / 30 j", d.dau == null ? "…" : `${d.dau} / ${d.wau} / ${d.mau}`, "updated_at récent (proxy, pas de sessions).")}
          {kpi("Messages 30 j", v(d.msgC), "msg_id distincts.", d.msgC != null ? fmtDelta(d.msgC, d.msgP) : undefined)}
          {kpi("Lecture annonces", d.readRate == null ? "—" : `${d.readRate} %`, `Flag lu sur ${v(d.annN)} notifications d'annonce (agrégat, consentement implicite service).`)}
          {kpi("Sessions", "—", "Non suivies.")}
        </div>
      )}

      {tab === "Rétention" && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpi("De retour (7 j, inscrits 30 j+)", v(d.returning), "Actifs 7 j parmi les comptes de plus de 30 j.")}
          {kpi("Inactifs 30 j+", d.inac ? d.inac[2] + d.inac[3] : "…", "Proxy updated_at ; churn = 90 j+.", undefined)}
          {kpi("Cohortes J+1/J+7/J+30", "→ Analytics", "Table détaillée dans Analytics › Rétention.")}
          {kpi("Relance auto", "désactivée", "Aucun message auto aux inactifs — aucun workflow consenti ne le permet.")}
        </div>
      )}

      {tab === "Incomplets" && (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-[#999]">20 profils les moins complétés — aide à l'onboarding, jamais un score public.</p>
          {(d.incomplets ?? []).map((x: any) => (
            <div key={x.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              <Link to="/admin/users/$userId" params={{ userId: x.id }} className="font-medium text-[#e60050] hover:underline">{x.name}</Link>
              <span className="ml-auto text-xs text-[#777]">{x.pct} %</span>
            </div>
          ))}
          {!(d.incomplets ?? []).length && <p className="text-sm text-[#777]">Aucun.</p>}
        </div>
      )}

      {tab === "Interactions" && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpi("Matchs 30 j", v(d.maC), "Entité réelle.", d.maC != null ? fmtDelta(d.maC, d.maP) : undefined)}
          {kpi("Likes 30 j", v(d.lkC), "swivv_likes.", d.lkC != null ? fmtDelta(d.lkC, d.lkP) : undefined)}
          {kpi("Vues 30 j", v(d.vwC), "Toutes vues.", d.vwC != null ? fmtDelta(d.vwC, d.vwP) : undefined)}
          {kpi("Réactions 30 j", v(d.rxC), "Événements.", d.rxC != null ? fmtDelta(d.rxC, d.rxP) : undefined)}
        </div>
      )}

      {tab === "Recommandations" && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-[#999]">Règles sur agrégats, données d'appui affichées — sans modèle, sans reciblage.</p>
          {recos.map((r) => (
            <div key={r.title} className="rounded-xl bg-white p-3 text-sm shadow-sm">
              <p className="font-medium text-[#333]">{r.title}</p>
              <p className="text-xs text-[#777]">Pourquoi : {r.why}</p>
              <p className="mt-1"><Link to={r.to as any} className="text-xs text-[#e60050] underline">{r.action}</Link></p>
            </div>
          ))}
        </div>
      )}

      {tab === "Expériences" && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-[#999]">Journal manuel — aucun feature flag câblé, aucun succès sans données ni conclusion écrite.</p>
          {level >= 80 && (
            <form onSubmit={createExp} className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
              <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Titre" maxLength={120} aria-label="Titre" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              <textarea value={fHyp} onChange={(e) => setFHyp(e.target.value)} placeholder="Hypothèse…" rows={2} maxLength={1000} aria-label="Hypothèse" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              <div className="flex flex-wrap gap-2">
                <select value={fAud} onChange={(e) => setFAud(e.target.value)} aria-label="Audience" className="rounded-md border border-border bg-white px-3 py-2 text-sm">
                  <option value="all">Tous</option>
                  <option value="new">Nouveaux</option>
                  <option value="inactive">Inactifs</option>
                </select>
                <input value={fMetrics} onChange={(e) => setFMetrics(e.target.value)} placeholder="Métriques (virgules)" aria-label="Métriques" className="min-w-0 flex-1 rounded-md border border-border px-3 py-2 text-sm" />
                <button type="submit" className="rounded-md bg-[#e60050] px-4 py-2 text-sm font-medium text-white">Enregistrer</button>
              </div>
            </form>
          )}
          {exps.map((x: any) => (
            <article key={x.id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-[#333]">{x.title}</strong>
                <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{x.status}</span>
                <span className="text-xs text-[#999]">{x.audience} · {(x.metrics ?? []).join(", ")}</span>
              </div>
              <p className="mt-1 text-xs text-[#555]">Hypothèse : {x.hypothesis}</p>
              {x.conclusion && <p className="mt-1 text-xs text-[#555]">Conclusion : {x.conclusion}</p>}
              {level >= 80 && x.status !== "done" && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <input value={fConcl[x.id] ?? ""} onChange={(e) => setFConcl((m) => ({ ...m, [x.id]: e.target.value }))} placeholder="Conclusion (obligatoire pour clore)…" maxLength={1000} aria-label="Conclusion" className="min-w-52 flex-1 rounded border border-border px-2 py-1 text-xs" />
                  {x.status === "draft" && <button type="button" onClick={() => advanceExp(x, "running")} className="rounded border border-border px-2 py-1 text-xs">Démarrer</button>}
                  <button type="button" onClick={() => advanceExp(x, "done")} className="rounded border border-border px-2 py-1 text-xs">Clore</button>
                </div>
              )}
            </article>
          ))}
          {!exps.length && <p className="text-sm text-[#777]">Aucune expérience (table absente ou vide — migration 20261020000000).</p>}
        </div>
      )}
    </div>
  );
}
