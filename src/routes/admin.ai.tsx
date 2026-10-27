import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit, useAdminRole } from "@/lib/admin";
import { providerStatus } from "@/lib/ai-provider";
import {
  classifyReports, failedNotify, incompleteProfiles, onboardingHelp,
  repeatMessages, spamBios, summarizeCase, urgentSafety, type Suggestion,
} from "@/lib/ai-rules";
import { repeatCounts } from "@/lib/admin-reports";

export const Route = createFileRoute("/admin/ai")({
  component: AdminAi,
} as any);

const TABS = ["Vue d'ensemble", "Modération IA", "Comportements", "Automatisations", "File d'attente", "Historique", "Coûts"] as const;

const FALLBACK_RULES = [
  { key: "classify-reports", name: "Classer les nouveaux signalements", description: "Règles (mots-clés, récidive).", trigger_kind: "manual", enabled: true, dry_run: true, priority: 10, approval: "human" },
  { key: "spam-bios", name: "Spam dans les bios", description: "URLs, téléphones, handles.", trigger_kind: "manual", enabled: true, dry_run: true, priority: 20, approval: "human" },
  { key: "repeat-messages", name: "Messages répétés / liens", description: "Contenus identiques en masse (24 h).", trigger_kind: "manual", enabled: true, dry_run: true, priority: 30, approval: "human" },
  { key: "urgent-safety", name: "Urgences sécurité", description: "Critiques + récidivistes.", trigger_kind: "manual", enabled: true, dry_run: true, priority: 5, approval: "human" },
  { key: "summarize-case", name: "Résumés de cas", description: "Gabarit, pas de modèle.", trigger_kind: "manual", enabled: true, dry_run: true, priority: 60, approval: "human" },
  { key: "incomplete-profiles", name: "Profils incomplets", description: "Complétude < 80 %.", trigger_kind: "manual", enabled: true, dry_run: true, priority: 70, approval: "auto-low-risk" },
  { key: "onboarding-help", name: "Aide à l'onboarding", description: "Comptes < 7 j à < 50 %.", trigger_kind: "manual", enabled: true, dry_run: true, priority: 80, approval: "auto-low-risk" },
  { key: "failed-notify", name: "Notifications en échec", description: "E-mails failed à traiter.", trigger_kind: "manual", enabled: true, dry_run: true, priority: 40, approval: "human" },
];

// ponytail: no provider, no worker — rules are read-only recommenders executed manually here;
// runs log synchronously; sanctions stay human-only; dry_run is kept for when auto actions land
function AdminAi() {
  const { level } = useAdminRole();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Vue d'ensemble");
  const [rules, setRules] = useState<any[]>(FALLBACK_RULES);
  const [rulesLive, setRulesLive] = useState(true);
  const [runs, setRuns] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [caseNotes, setCaseNotes] = useState<Record<string, any[]>>({});
  const [mailFail, setMailFail] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const prov = providerStatus();

  async function load() {
    const q = supabase as any;
    const [rl, rn, rp, pf, ch, cs, ml] = await Promise.all([
      q.from("swivv_ai_rules").select("*").order("priority").then((r: any) => (r.error ? null : (r.data ?? []))),
      q.from("swivv_ai_runs").select("*").order("created_at", { ascending: false }).limit(50).then((r: any) => (r.error ? [] : (r.data ?? []))),
      supabase.from("swivv_reports").select("id,category,description,reported_user_id,priority,status,created_at").in("status", ["new", "investigating", "waiting"]).order("created_at", { ascending: false }).limit(200),
      q.from("swivv_profiles").select("user_id,data").order("updated_at", { ascending: false }).limit(300),
      q.from("swivv_chats").select("body,sender,created_at").gte("created_at", new Date(Date.now() - 864e5).toISOString()).order("created_at", { ascending: false }).limit(2000),
      supabase.from("swivv_moderation_cases").select("id,subject_user_id,status,priority,action_taken,created_at").in("status", ["open", "investigating", "waiting"]).order("created_at", { ascending: false }).limit(100),
      q.from("swivv_email_log").select("status,to,created_at").eq("status", "failed").order("created_at", { ascending: false }).limit(100).then((r: any) => (r.error ? [] : (r.data ?? []))),
    ]);
    if (rl) {
      setRules(rl);
      setRulesLive(true);
    } else {
      setRulesLive(false);
    }
    setRuns(rn);
    setReports((rp.data ?? []) as any[]);
    setProfiles((pf.data ?? []) as any[]);
    setChats(((ch.data ?? []) as any[]).filter((m) => (m.body ?? "").trim()));
    setCases((cs.data ?? []) as any[]);
    setMailFail(ml);
    const cids = ((cs.data ?? []) as any[]).map((c) => c.id);
    if (cids.length) {
      const { data: nt } = await supabase.from("swivv_internal_notes").select("target_id,body").eq("target_kind", "case").in("target_id", cids);
      const by: Record<string, any[]> = {};
      for (const n of (nt ?? []) as any[]) (by[n.target_id] ??= []).push(n);
      setCaseNotes(by);
    }
    const ids = new Set<string>();
    for (const r of ((rp.data ?? []) as any[])) if (r.reported_user_id) ids.add(r.reported_user_id);
    for (const p of ((pf.data ?? []) as any[])) ids.add(p.user_id);
    if (ids.size) {
      const { data: profs } = await q.from("swivv_profiles").select("user_id,data").in("user_id", [...ids].slice(0, 300));
      const map: Record<string, string> = {};
      for (const p of (profs as any[]) ?? []) map[p.user_id] = (p.data as any)?.name ?? p.user_id.slice(0, 8);
      setNames(map);
    }
  }

  useEffect(() => {
    load();
    audit("admin.ai.view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const repeats = useMemo(() => repeatCounts(reports), [reports]);
  const out = useMemo(() => {
    const rep = reports as any[];
    return {
      classify: classifyReports(rep, repeats),
      spam: spamBios(profiles as any[]),
      repeatMsg: repeatMessages(chats as any[]),
      urgent: urgentSafety(rep, repeats),
      incomplete: incompleteProfiles(profiles as any[]),
      onboarding: onboardingHelp(profiles as any[]),
      failed: failedNotify(mailFail as any[]),
      summaries: cases.map((c: any) => ({
        id: c.id,
        text: summarizeCase(c, caseNotes[c.id] ?? [], 0),
      })),
    };
  }, [reports, profiles, chats, cases, caseNotes, mailFail, repeats]);

  const pendingReview: Suggestion[] = useMemo(() => [...out.urgent, ...out.classify], [out]);
  const doneRuns = runs.filter((r) => r.status === "done").length;
  const failedRuns = runs.filter((r) => r.status === "failed").length;

  async function execute(key: string) {
    const rule = rules.find((r) => r.key === key);
    if (!rule?.enabled) return;
    setBusy(key);
    const t0 = performance.now();
    try {
      const counts: Record<string, Suggestion[]> = {
        "classify-reports": out.classify, "spam-bios": out.spam, "repeat-messages": out.repeatMsg,
        "urgent-safety": out.urgent, "incomplete-profiles": out.incomplete,
        "onboarding-help": out.onboarding, "failed-notify": out.failed,
        "summarize-case": out.summaries.map((s) => ({ ref: s.id, label: "Résumé", detail: s.text, severity: "info" as const })),
      };
      const found = counts[key] ?? [];
      const { error } = await (supabase as any).from("swivv_ai_runs").insert({
        rule_key: key, status: "done", result: { suggestions: found.length },
        duration_ms: Math.round(performance.now() - t0),
      });
      if (error) throw new Error(error.message.includes("does not exist") || error.message.includes("schema cache") ? "Table des runs absente — applique la migration 20261018000000_swivv_ai_centre.sql." : error.message);
      audit("admin.ai.run", "rule", key, { suggestions: found.length });
      setMsg(`« ${rule.name} » : ${found.length} suggestion(s) — lecture seule, aucune action appliquée.`);
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Échec d'exécution.");
      await (supabase as any).from("swivv_ai_runs").insert({ rule_key: key, status: "failed", result: {}, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  }

  async function toggle(key: string, field: "enabled" | "dry_run", value: boolean) {
    if (!rulesLive) {
      setMsg("Table des règles absente — applique la migration 20261018000000.");
      return;
    }
    const { error } = await (supabase as any).from("swivv_ai_rules").update({ [field]: value, updated_at: new Date().toISOString() }).eq("key", key);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.ai.rule", "rule", key, { [field]: value });
    load();
  }

  const sug = (s: Suggestion, link?: { to: string; label: string }) => (
    <p key={s.ref + s.label} className="mt-1 text-xs text-[#555]">
      <span className={`mr-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${s.severity === "critical" ? "bg-red-100 text-red-800" : s.severity === "warning" ? "bg-amber-100 text-amber-800" : "bg-[#f2f2f2] text-[#555]"}`}>{s.severity}</span>
      <strong>{s.label}</strong> — {s.detail}
    </p>
  );
  const card = "rounded-xl bg-white p-4 text-sm shadow-sm";

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Centre IA</h1>
      <p className="mt-1 text-xs text-[#999]">Règles déterministes auditables, revue humaine obligatoire pour toute sanction. {rulesLive ? "" : "Table des règles absente — valeurs locales affichées (migration 20261018000000)."}</p>
      <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Centre IA">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === t ? "bg-[#14112b] text-white" : "bg-white text-[#555]"}`}>{t}</button>
        ))}
      </nav>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}

      {tab === "Vue d'ensemble" && (
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <div className={card}><p className="text-3xl font-bold text-[#333]">{prov.configured ? "branché" : "non configuré"}</p><p className="mt-1 text-[#777]">Fournisseur IA ({prov.provider})</p></div>
          <div className={card}><p className="text-3xl font-bold text-[#333]">{rules.filter((r) => r.enabled).length}/{rules.length}</p><p className="mt-1 text-[#777]">Règles actives</p></div>
          <div className={card}><p className="text-3xl font-bold text-[#333]">{doneRuns}</p><p className="mt-1 text-[#777]">Exécutions OK · {failedRuns} en échec</p></div>
          <div className={card}><p className="text-3xl font-bold text-[#e60050]">{pendingReview.length}</p><p className="mt-1 text-[#777]">À relire (urgences + classements)</p></div>
        </div>
      )}

      {tab === "Modération IA" && (
        <div className={`${card} mt-3`}>
          <p className="font-medium text-[#333]">En attente de classification ({out.classify.length + out.spam.length}) — moteur : règles v1 (confiance : —, pas de modèle)</p>
          {out.classify.map((s) => sug(s))}
          {out.spam.slice(0, 20).map((s) => sug(s))}
          {!out.classify.length && !out.spam.length && <p className="mt-1 text-xs text-[#999]">Rien à classer.</p>}
          <p className="mt-2 text-xs text-[#999]">Action recommandée : ouvrir la fiche membre / le signalement — jamais de sanction auto.</p>
        </div>
      )}

      {tab === "Comportements" && (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className={card}>
            <p className="font-medium text-[#333]">Spam & répétitions ({out.repeatMsg.length})</p>
            {out.repeatMsg.map((s) => sug(s))}
            {!out.repeatMsg.length && <p className="mt-1 text-xs text-[#999]">Aucun contenu répété ×3+ sur 24 h.</p>}
          </div>
          <div className={card}>
            <p className="font-medium text-[#333]">Urgences sécurité ({out.urgent.length})</p>
            {out.urgent.map((s) => sug(s))}
            {!out.urgent.length && <p className="mt-1 text-xs text-[#999]">Aucune urgence.</p>}
          </div>
          <div className={card}>
            <p className="font-medium text-[#333]">Onboarding ({out.onboarding.length}) · incomplets ({out.incomplete.length})</p>
            {out.onboarding.slice(0, 10).map((s) => sug(s))}
            {!out.onboarding.length && !out.incomplete.length && <p className="mt-1 text-xs text-[#999]">Rien à signaler.</p>}
          </div>
          <div className={card}>
            <p className="font-medium text-[#333]">Notifications en échec ({out.failed.length})</p>
            {out.failed.slice(0, 10).map((s) => sug(s))}
            {!out.failed.length && <p className="mt-1 text-xs text-[#999]">Aucun échec.</p>}
          </div>
        </div>
      )}

      {tab === "Automatisations" && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-[#999]">Toutes les règles sont en lecture seule (recommandations) — dry_run réservé aux futures actions auto, bascules 80+.</p>
          {rules.map((r) => (
            <article key={r.key} className="rounded-xl bg-white p-3 text-sm shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-[#333]">{r.name}</strong>
                <span className="text-xs text-[#999]">déclencheur : {r.trigger_kind} · priorité {r.priority} · approbation : {r.approval}</span>
                <span className="ml-auto flex items-center gap-2 text-xs">
                  {level >= 80 ? (
                    <>
                      <label className="flex items-center gap-1 text-[#555]"><input type="checkbox" checked={!!r.enabled} onChange={(e) => toggle(r.key, "enabled", e.target.checked)} /> active</label>
                      <label className="flex items-center gap-1 text-[#555]"><input type="checkbox" checked={!!r.dry_run} onChange={(e) => toggle(r.key, "dry_run", e.target.checked)} /> dry-run</label>
                    </>
                  ) : (
                    <span className="text-[#999]">{r.enabled ? "active" : "coupée"} · dry-run {r.dry_run ? "oui" : "non"}</span>
                  )}
                  <button type="button" onClick={() => execute(r.key)} disabled={busy === r.key || !r.enabled} className="rounded bg-[#e60050] px-3 py-1 font-medium text-white disabled:opacity-50">
                    {busy === r.key ? "…" : "Exécuter"}
                  </button>
                </span>
              </div>
              <p className="mt-1 text-xs text-[#777]">{r.description}</p>
            </article>
          ))}
        </div>
      )}

      {tab === "File d'attente" && (
        <div className={`${card} mt-3`}>
          <p className="font-medium text-[#333]">Aucune tâche en attente — exécutions synchrones manuelles (worker à venir).</p>
          <p className="mt-2 font-medium text-[#333]">Revue humaine requise ({pendingReview.length})</p>
          {pendingReview.slice(0, 20).map((s) => sug(s))}
          {!pendingReview.length && <p className="mt-1 text-xs text-[#999]">File vide.</p>}
        </div>
      )}

      {tab === "Historique" && (
        <div className={`${card} mt-3`}>
          <p className="font-medium text-[#333]">Exécutions ({runs.length})</p>
          {runs.map((r: any) => (
            <p key={r.id} className="mt-1 text-xs text-[#555]">
              {r.rule_key} · {r.status}{r.result?.suggestions != null ? ` · ${r.result.suggestions} suggestion(s)` : ""}{r.duration_ms != null ? ` · ${r.duration_ms} ms` : ""}{r.error ? ` · erreur : ${r.error}` : ""} · {new Date(r.created_at).toLocaleString("fr-FR")}
            </p>
          ))}
          {!runs.length && <p className="mt-1 text-xs text-[#999]">Aucune exécution (table absente ou vide — migration 20261018000000).</p>}
        </div>
      )}

      {tab === "Coûts" && (
        <div className={`${card} mt-3`}>
          <p className="font-medium text-[#333]">Usage réel : 0 requête, 0 token, 0 € — aucun appel modèle (règles locales).</p>
          <p className="mt-2 text-[#555]">Pour activer :</p>
          <ol className="mt-1 list-decimal pl-5 text-[#555]">
            {prov.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <p className="mt-2 text-xs text-[#999]">Données minimisées : redactForModel() retire e-mails, lieux, corps de messages et photos avant tout envoi futur.</p>
        </div>
      )}
    </div>
  );
}
