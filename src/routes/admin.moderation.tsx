import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { audit, logEvaluation, notifySuspended, useAdminRole } from "@/lib/admin";
import { screenText } from "@/lib/moderation-engine";
import { aiAvailable, flagReasons, flagText } from "@/lib/admin-moderation";

const STATUSES = ["open", "investigating", "waiting", "closed"];
const QUEUES = ["Cas", "Textes", "Photos", "Spam & liens", "Messages", "Évaluations", "Politiques"] as const;

export const Route = createFileRoute("/admin/moderation")({
  validateSearch: (s: Record<string, unknown>) => ({ status: typeof s.status === "string" ? s.status : undefined }),
  component: AdminModeration,
} as any);

const PAGE = 25;

// ponytail: queues over live scans (cases 100, profiles 300, reports 50) + local paging — server-side queues when volumes grow
// ponytail: no appeals queue: no appeal channel exists in the product — the Politiques tab says so instead of faking one
function AdminModeration() {
  const { level } = useAdminRole();
  const [queue, setQueue] = useState<(typeof QUEUES)[number]>("Cas");
  const [filter, setFilter] = useState((Route.useSearch() as any).status ?? "open");
  const [cases, setCases] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, any[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [msgReports, setMsgReports] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [evals, setEvals] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const canDecide = level >= 50;
  const canEnforce = level >= 80;

  async function load() {
    const q = supabase as any;
    let cq: any = supabase.from("swivv_moderation_cases").select("*").order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") cq = cq.eq("status", filter);
    const [cs, pr, mr, pol] = await Promise.all([
      cq,
      q.from("swivv_profiles").select("user_id,data,updated_at").order("updated_at", { ascending: false }).limit(300),
      supabase.from("swivv_reports").select("*").order("created_at", { ascending: false }).limit(50),
      q.from("swivv_mod_policies").select("*").order("name").then((r: any) => (r.error ? [] : (r.data ?? []))),
    ]);
    q.from("swivv_mod_evaluations").select("account_ref,content_ref,content_type,category,severity,method,recommended,action_taken,created_at").order("created_at", { ascending: false }).limit(100)
      .then((r: any) => { if (!r.error) setEvals(r.data ?? []); });
    if (cs.error) {
      setMsg(cs.error.message);
      return;
    }
    setCases(cs.data ?? []);
    setProfiles((pr.data ?? []) as any[]);
    setMsgReports(((mr.data ?? []) as any[]).filter((r) => ["vocal", "photo", "message"].includes(r.category) || /vocal|photo/i.test(r.description ?? "")));
    setPolicies(pol);
    const ids = new Set<string>();
    for (const c of (cs.data ?? []) as any[]) for (const k of ["subject_user_id", "assigned_to"]) if (typeof c[k] === "string" && /^[0-9a-f-]{36}$/i.test(c[k])) ids.add(c[k]);
    for (const p of (pr.data ?? []) as any[]) ids.add(p.user_id);
    for (const r of (mr.data ?? []) as any[]) for (const k of ["reporter_id", "reported_user_id"]) if (typeof r[k] === "string" && /^[0-9a-f-]{36}$/i.test(r[k])) ids.add(r[k]);
    if (ids.size) {
      const { data: profs } = await q.from("swivv_profiles").select("user_id,data").in("user_id", [...ids].slice(0, 300));
      const map: Record<string, string> = {};
      for (const p of (profs as any[]) ?? []) map[p.user_id] = (p.data as any)?.name ?? p.user_id.slice(0, 8);
      setNames(map);
    }
    const cids = ((cs.data ?? []) as any[]).map((c) => c.id);
    if (cids.length > 0) {
      const { data: n } = await supabase.from("swivv_internal_notes").select("*").eq("target_kind", "case").in("target_id", cids).order("created_at", { ascending: false });
      const by: Record<string, any[]> = {};
      for (const x of (n ?? []) as any[]) (by[x.target_id] ??= []).push(x);
      setNotes(by);
    }
    const dec = await q.from("swivv_mod_decisions").select("target_kind,target_ref,decision").order("created_at", { ascending: false }).limit(500).then((r: any) => (r.error ? [] : (r.data ?? [])));
    const dm: Record<string, string> = {};
    for (const x of dec as any[]) dm[`${x.target_kind}:${x.target_ref}`] = x.decision;
    setDecisions(dm);
  }

  useEffect(() => {
    load();
    audit("admin.cases.view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    setPage(0);
  }, [queue, filter]);

  const nm = (id: string | null) => {
    if (!id) return "—";
    return /^[0-9a-f-]{36}$/i.test(id) ? (names[id] ?? `${id.slice(0, 8)}…`) : `Démo #${id}`;
  };

  async function decide(kind: string, ref: string, decision: string, reason?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("swivv_mod_decisions").insert({ target_kind: kind, target_ref: ref, decision, reason: reason ?? null, reviewer: user?.id });
    if (error) {
      setMsg(error.message);
      return false;
    }
    audit(`admin.mod.${decision}`, kind, ref, reason ? { reason } : undefined);
    logEvaluation({
      account_ref: kind === "text" || kind === "photo" ? ref.split(":")[0] : null,
      content_ref: ref, content_type: kind === "text" ? "text" : kind === "photo" ? "photo" : kind === "message" ? "message" : "other",
      category: "review", method: "human", action_taken: decision, approval_required: ["restrict", "remove"].includes(decision),
    });
    await load();
    return true;
  }

  async function updateCase(id: string, patch: Database["public"]["Tables"]["swivv_moderation_cases"]["Update"], log: string) {
    const { error } = await supabase.from("swivv_moderation_cases").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit(log, "case", id, patch as Record<string, unknown>);
    load();
  }

  async function removePhoto(userId: string, src: string) {
    if (!window.confirm("Retirer cette photo de l'affichage ? (l'asset n'est pas détruit)")) return;
    const { data: row } = await (supabase as any).from("swivv_profiles").select("data").eq("user_id", userId).maybeSingle();
    const photos = (((row as any)?.data?.photos ?? []) as string[]).filter((x) => x !== src);
    const { error } = await (supabase as any).from("swivv_profiles").update({ data: { ...(row as any)?.data, photos } }).eq("user_id", userId);
    if (error) {
      setMsg(error.message);
      return;
    }
    await decide("photo", `${userId}:${src.slice(0, 64)}`, "remove", "Photo retirée de l'affichage");
    setMsg("Photo retirée + décision tracée.");
  }

  async function restrict(userId: string) {
    if (!window.confirm("Restreindre ce compte (suspension 7 jours) ? Enregistré dans l'audit.")) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("swivv_user_status").upsert(
      { user_id: userId, status: "suspended", reason: "Modération", until: new Date(Date.now() + 7 * 864e5).toISOString(), updated_by: user?.id },
      { onConflict: "user_id" },
    );
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.user.suspended", "user", userId, { days: 7, from: "moderation" });
    notifySuspended(userId, "modération");
    setMsg("Compte suspendu 7 jours.");
  }

  async function refer(userId: string | null, label: string) {
    if (!userId) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("swivv_moderation_cases").insert({
      subject_user_id: userId, priority: "high", assigned_to: null, created_by: user?.id,
    }).select("id").single();
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.case.create", "case", (data as any).id, { from: label });
    setMsg("Transmis : cas senior créé.");
  }

  const texts = useMemo(() => profiles.filter((p) => (p.data?.bio ?? "").trim() || (p.data?.tagline ?? "").trim()), [profiles]);
  const spam = useMemo(() => texts.filter((p) => flagReasons(flagText(`${p.data?.tagline ?? ""}\n${p.data?.bio ?? ""}`)).length > 0), [texts]);
  const photos = useMemo(() => profiles.filter((p) => (p.data?.photos ?? []).length > 0), [profiles]);

  const pager = (n: number) =>
    n > PAGE && (
      <div className="mt-3 flex items-center justify-center gap-2 text-sm">
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border bg-white px-3 py-1.5 disabled:opacity-40">←</button>
        <span className="text-[#777]">Page {page + 1} / {Math.ceil(n / PAGE)}</span>
        <button type="button" disabled={(page + 1) * PAGE >= n} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border bg-white px-3 py-1.5 disabled:opacity-40">→</button>
      </div>
    );
  const slice = <T,>(arr: T[]) => arr.slice(page * PAGE, (page + 1) * PAGE);
  const decBadge = (kind: string, ref: string) =>
    decisions[`${kind}:${ref}`] ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">décidé : {decisions[`${kind}:${ref}`]}</span> : null;
  const btn = "rounded border border-border px-2 py-1 text-xs";
  const sel = "rounded-md border border-border bg-white px-3 py-2 text-sm";

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Modération</h1>
      <p className="mt-1 text-xs text-[#999]">
        File proactive (textes/photos scannés) + cas signalés. Règles déterministes, jamais d'inférence sur l'apparence ou les attributs sensibles ·{" "}
        {aiAvailable() ? "IA branchée." : "IA indisponible — aucun fournisseur configuré."} · sanctions graves = humain.
      </p>
      <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Files">
        {QUEUES.map((t) => (
          <button key={t} type="button" onClick={() => setQueue(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${queue === t ? "bg-[#14112b] text-white" : "bg-white text-[#555]"}`}>{t}</button>
        ))}
      </nav>
      {queue === "Cas" && (
        <div className="mt-4 flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre statut" className={sel}>
            {["all", ...STATUSES].map((s) => <option key={s} value={s}>{s === "all" ? "Tous" : s}</option>)}
          </select>
        </div>
      )}
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}

      {queue === "Cas" && (
        <div className="mt-4 space-y-2">
          {cases.map((c) => (
            <article key={c.id} className="rounded-xl bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono text-xs text-[#999]">{c.id.slice(0, 8)}</span>
                <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{c.priority}</span>
                <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{c.status}</span>
                {c.action_taken && <span className="text-xs text-[#555]">→ {c.action_taken}</span>}
                <span className="ml-auto text-xs text-[#999]">{new Date(c.created_at).toLocaleString("fr-FR")}</span>
              </div>
              {c.reason && <p className="mt-1 text-sm text-[#555]">{c.reason}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {c.subject_user_id && <Link to="/admin/users/$userId" params={{ userId: c.subject_user_id }} className="text-[#e60050] underline">Profil concerné ({nm(c.subject_user_id)})</Link>}
                <select value={c.status} onChange={(e) => updateCase(c.id, { status: e.target.value }, "admin.case.status")} aria-label="Statut" className="rounded border border-border px-2 py-1">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                  defaultValue={c.action_taken ?? ""}
                  onBlur={(e) => { if (e.target.value !== (c.action_taken ?? "")) updateCase(c.id, { action_taken: e.target.value }, "admin.case.action"); }}
                  placeholder="Action (avertir, suspendre, bannir…)"
                  aria-label="Action prise"
                  className="min-w-40 flex-1 rounded border border-border px-2 py-1"
                />
                {c.status !== "closed" && (
                  <button type="button" onClick={() => { if (window.confirm("Clore ce cas ?")) updateCase(c.id, { status: "closed", closed_at: new Date().toISOString() }, "admin.case.close"); }} className={btn}>Clore</button>
                )}
              </div>
              <div className="mt-2 border-t border-border pt-2">
                {(notes[c.id] ?? []).map((n: any) => (
                  <p key={n.id} className="text-xs text-[#555]">· {n.body} <span className="text-[#999]">({new Date(n.created_at).toLocaleString("fr-FR")})</span></p>
                ))}
                <div className="mt-1 flex gap-2">
                  <input
                    value={drafts[c.id] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                    placeholder="Note interne…"
                    aria-label="Note interne"
                    className="flex-1 rounded border border-border px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const body = (drafts[c.id] ?? "").trim();
                      if (!body) return;
                      const { data: { user } } = await supabase.auth.getUser();
                      const { error } = await supabase.from("swivv_internal_notes").insert({ target_kind: "case", target_id: c.id, author_id: user?.id, body });
                      if (error) {
                        setMsg(error.message);
                        return;
                      }
                      setDrafts((d) => ({ ...d, [c.id]: "" }));
                      audit("admin.note.add", "case", c.id);
                      load();
                    }}
                    className="rounded bg-[#e60050] px-3 py-1 text-xs font-medium text-white"
                  >
                    Noter
                  </button>
                </div>
              </div>
            </article>
          ))}
          {cases.length === 0 && <p className="text-sm text-[#777]">Aucun cas. Crée-en un depuis un signalement.</p>}
        </div>
      )}

      {queue === "Textes" && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-[#999]">{texts.length} profils avec bio/accroche (300 plus récents scannés).</p>
          {slice(texts).map((p) => {
            const ref = `${p.user_id}:bio`;
            const flags = flagReasons(flagText(`${p.data?.tagline ?? ""}\n${p.data?.bio ?? ""}`));
            const screen = screenText(`${p.data?.tagline ?? ""}\n${p.data?.bio ?? ""}`);
            return (
              <article key={p.user_id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-[#333]">{p.data?.name ?? p.user_id.slice(0, 8)}</strong>
                  {flags.map((f) => <span key={f} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{f}</span>)}
                  {screen.map((h, i) => (
                    <span key={i} title={h.match} className={`rounded-full px-2 py-0.5 text-xs font-medium ${h.severity === "critical" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}`}>
                      moteur : {h.category}
                    </span>
                  ))}
                  {decBadge("text", ref)}
                  <Link to="/admin/users/$userId" params={{ userId: p.user_id }} className="ml-auto text-xs text-[#e60050] underline">Fiche membre</Link>
                </div>
                {p.data?.tagline && <p className="mt-1 italic text-[#777]">« {p.data.tagline} »</p>}
                {p.data?.bio && <p className="mt-1 text-[#555]">{p.data.bio}</p>}
                {canDecide && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <button type="button" onClick={() => decide("text", ref, "approve")} className={btn}>Approuver</button>
                    <button type="button" onClick={() => decide("text", ref, "reject", "Contenu à corriger — voir fiche membre")} className={btn}>Rejeter (corriger via fiche)</button>
                    <button type="button" onClick={() => decide("text", ref, "dismiss", "Faux positif")} className={btn}>Faux positif</button>
                    <button type="button" onClick={() => refer(p.user_id, `texte:${p.user_id}`)} className={btn}>→ Réviseur senior</button>
                    {canEnforce && <button type="button" onClick={() => restrict(p.user_id)} className={`${btn} text-red-700`}>Restreindre 7 j (80+)</button>}
                  </div>
                )}
              </article>
            );
          })}
          {texts.length === 0 && <p className="text-sm text-[#777]">Aucun texte à relire.</p>}
          {pager(texts.length)}
        </div>
      )}

      {queue === "Photos" && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-[#999]">{photos.length} profils avec photos — aperçu restreint, aucune analyse automatisée d'image.</p>
          {slice(photos).map((p) => {
            const src = p.data.photos[0];
            const ref = `${p.user_id}:${src.slice(0, 64)}`;
            return (
              <article key={p.user_id} className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm shadow-sm">
                <img src={src} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#333]">{p.data?.name ?? p.user_id.slice(0, 8)} <span className="text-xs font-normal text-[#999]">· {p.data.photos.length} photo(s)</span></p>
                  <div className="mt-1">{decBadge("photo", ref)}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <Link to="/admin/users/$userId" params={{ userId: p.user_id }} className="text-[#e60050] underline">Fiche membre</Link>
                    {canDecide && <button type="button" onClick={() => decide("photo", ref, "approve")} className={btn}>Approuver</button>}
                    {canEnforce && <button type="button" onClick={() => removePhoto(p.user_id, src)} className={`${btn} text-red-700`}>Retirer</button>}
                    {canDecide && <button type="button" onClick={() => decide("photo", ref, "dismiss", "Faux positif")} className={btn}>Faux positif</button>}
                  </div>
                </div>
              </article>
            );
          })}
          {photos.length === 0 && <p className="text-sm text-[#777]">Aucune photo à relire.</p>}
          {pager(photos.length)}
        </div>
      )}

      {queue === "Spam & liens" && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-[#999]">{spam.length} profil(s) avec lien/téléphone/handle/spam présumé — motifs contenus uniquement.</p>
          {slice(spam).map((p) => {
            const flags = flagReasons(flagText(`${p.data?.tagline ?? ""}\n${p.data?.bio ?? ""}`));
            return (
              <article key={p.user_id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-[#333]">{p.data?.name ?? p.user_id.slice(0, 8)}</strong>
                  {flags.map((f) => <span key={f} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">{f}</span>)}
                  {decBadge("text", `${p.user_id}:bio`)}
                  <Link to="/admin/users/$userId" params={{ userId: p.user_id }} className="ml-auto text-xs text-[#e60050] underline">Fiche membre</Link>
                </div>
                {p.data?.tagline && <p className="mt-1 italic text-[#777]">« {p.data.tagline} »</p>}
                {p.data?.bio && <p className="mt-1 text-[#555]">{p.data.bio}</p>}
                {canDecide && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <button type="button" onClick={() => decide("text", `${p.user_id}:bio`, "approve")} className={btn}>Approuver</button>
                    <button type="button" onClick={() => decide("text", `${p.user_id}:bio`, "remove", "Spam/lien — correction via fiche membre")} className={btn}>Retirer (via fiche)</button>
                    <button type="button" onClick={() => decide("text", `${p.user_id}:bio`, "dismiss", "Faux positif")} className={btn}>Faux positif</button>
                    <button type="button" onClick={() => refer(p.user_id, `spam:${p.user_id}`)} className={btn}>→ Réviseur senior</button>
                  </div>
                )}
              </article>
            );
          })}
          {spam.length === 0 && <p className="text-sm text-[#777]">Aucun signal de spam détecté par les règles.</p>}
          {pager(spam.length)}
        </div>
      )}

      {queue === "Messages" && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-[#999]">Signalements vocaux/photos/messages ({msgReports.length}) — les contenus non signalés restent privés et invisibles ici.</p>
          {msgReports.map((r) => (
            <article key={r.id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-[#333]">{r.category}</strong>
                <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{r.status}</span>
                <span className="text-xs text-[#777]">{nm(r.reporter_id)} → {nm(r.reported_user_id)}</span>
                <span className="ml-auto text-xs text-[#999]">{new Date(r.created_at).toLocaleString("fr-FR")}</span>
              </div>
              {r.description && <p className="mt-1 text-[#555]">« {r.description} »</p>}
              {r.evidence_url && <a href={r.evidence_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#e60050] underline">Voir le contenu signalé</a>}
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {r.reported_user_id && <Link to="/admin/users/$userId" params={{ userId: r.reported_user_id }} className="text-[#e60050] underline">Fiche membre</Link>}
                {canDecide && <button type="button" onClick={() => decide("message", r.id, "approve")} className={btn}>Approuver</button>}
                {canDecide && <button type="button" onClick={() => decide("message", r.id, "remove", "Contenu retiré — voir fiche membre")} className={btn}>Retirer</button>}
                {canDecide && <button type="button" onClick={() => decide("message", r.id, "dismiss", "Faux positif")} className={btn}>Faux positif</button>}
              </div>
            </article>
          ))}
          {msgReports.length === 0 && <p className="text-sm text-[#777]">Aucun message signalé. Les signalements vocaux/photos partent dans le fil de conversation (contexte privé) + file Signalements pour les comptes.</p>}
        </div>
      )}

      {queue === "Évaluations" && (
        <div className="mt-4 space-y-1">
          <p className="text-xs text-[#999]">{evals.length} évaluations (règles v1 — références uniquement, jamais de contenus). Écrites par les décisions et les ouvertures de cas.</p>
          {evals.map((e: any, i: number) => (
            <p key={i} className="rounded-lg bg-white px-3 py-2 text-xs text-[#555] shadow-sm">
              <span className={`mr-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${e.severity === "critical" ? "bg-red-100 text-red-800" : e.severity === "warning" ? "bg-amber-100 text-amber-800" : "bg-[#f2f2f2]"}`}>{e.severity}</span>
              {e.content_type}:{e.category} · {e.method} · {e.account_ref ? nm(e.account_ref) : "—"} · {e.content_ref ?? "—"} · {e.recommended ? `→ ${e.recommended}` : ""}{e.action_taken ? ` · fait : ${e.action_taken}` : ""} · {new Date(e.created_at).toLocaleString("fr-FR")}
            </p>
          ))}
          {!evals.length && <p className="text-sm text-[#777]">Aucune évaluation (table absente ou vide — migration 20261024000000).</p>}
        </div>
      )}

      {queue === "Politiques" && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-[#999]">Règles actives (v1, {policies.length}) · auto_apply reste à faux — aucune sanction automatique. Appels : aucun canal dédié n'existe ; les contestations passent par le support.</p>
          {policies.map((p) => (
            <article key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 text-sm shadow-sm">
              <strong className="text-[#333]">{p.name}</strong>
              <span className="text-xs text-[#777]">signaux : {(p.signals ?? []).join(", ")}</span>
              {level >= 80 ? (
                <>
                  <select value={p.severity} onChange={async (e) => {
                    const { error } = await (supabase as any).from("swivv_mod_policies").update({ severity: e.target.value, updated_at: new Date().toISOString() }).eq("id", p.id);
                    if (error) setMsg(error.message);
                    else {
                      audit("admin.policy.update", "policy", p.id, { severity: e.target.value });
                      load();
                    }
                  }} aria-label="Gravité" className="rounded border border-border px-2 py-1 text-xs">
                    {["review", "restrict", "ban"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={p.action} onChange={async (e) => {
                    const { error } = await (supabase as any).from("swivv_mod_policies").update({ action: e.target.value, updated_at: new Date().toISOString() }).eq("id", p.id);
                    if (error) setMsg(error.message);
                    else {
                      audit("admin.policy.update", "policy", p.id, { action: e.target.value });
                      load();
                    }
                  }} aria-label="Action" className="rounded border border-border px-2 py-1 text-xs">
                    {["review", "remove", "refer"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </>
              ) : (
                <span className="text-xs text-[#777]">{p.severity} → {p.action} (édition réservée admin 80+)</span>
              )}
            </article>
          ))}
          {policies.length === 0 && <p className="text-sm text-[#777]">Politiques non chargées — applique la migration <code>20261013000000_swivv_moderation.sql</code>.</p>}
        </div>
      )}
    </div>
  );
}
