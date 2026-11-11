import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit, notifySuspended, useAdminRole } from "@/lib/admin";
import { flagReasons, flagText } from "@/lib/admin-moderation";
import { repeatMessages } from "@/lib/ai-rules";
import { burstRegs, pairVolume, repeatTargets, type Signal } from "@/lib/admin-fraud";
import { dupBios, postBlockContact } from "@/lib/moderation-engine";
import { logEvaluation } from "@/lib/admin";

export const Route = createFileRoute("/admin/fraud")({
  component: AdminFraud,
} as any);

const TABS = ["Vue d'ensemble", "Comptes suspects", "Spam & liens", "Coordonnés", "Sécurité comptes", "Incidents", "Règles", "Décisions"] as const;

const FALLBACK_RULES = [
  { key: "burst-regs", name: "Rafale d'inscriptions", description: "Source partagée possible, jamais une preuve.", threshold: 5, enabled: true },
  { key: "repeat-targets", name: "Comptes multi-signalés", description: "N rapporteurs indépendants.", threshold: 3, enabled: true },
  { key: "spam-links", name: "Spam et liens suspects", description: "URLs, téléphones, handles.", threshold: 1, enabled: true },
  { key: "repeat-content", name: "Contenu répété", description: "Messages/URLs en masse (24 h).", threshold: 3, enabled: true },
  { key: "pair-volume", name: "Volume par conversation", description: "Paires à fort volume.", threshold: 50, enabled: true },
  { key: "admin-watch", name: "Accès admin sensibles", description: "Transparence, pas accusation.", threshold: 1, enabled: true },
];

// ponytail: signals available only (reports, repetition, bursts) — no IPs/devices/auth logs, so takeover
// and auth-abuse tabs stay honestly unavailable; protected attributes never signals; sanctions = human 80+
function AdminFraud() {
  const { level } = useAdminRole();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Vue d'ensemble");
  const [rules, setRules] = useState<any[]>(FALLBACK_RULES);
  const [rulesLive, setRulesLive] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [regs, setRegs] = useState<string[]>([]);
  const [adminActs, setAdminActs] = useState<any[]>([]);
  const [failRuns, setFailRuns] = useState<any[]>([]);
  const [failMail, setFailMail] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const canDecide = level >= 50;
  const canRestrict = level >= 80;

  async function load() {
    const q = supabase as any;
    const day = new Date(Date.now() - 864e5).toISOString();
    const [rl, cs, rp, pf, ch, bl, rg, aa, fr, fm] = await Promise.all([
      q.from("swivv_fraud_rules").select("*").order("key").then((r: any) => (r.error ? null : (r.data ?? []))),
      q.from("swivv_fraud_cases").select("*").order("created_at", { ascending: false }).limit(100).then((r: any) => (r.error ? [] : (r.data ?? []))),
      supabase.from("swivv_reports").select("reported_user_id,reporter_id,category,priority,status").then((r: any) => (r.error ? [] : (r.data ?? []))),
      q.from("swivv_profiles").select("user_id,data").order("updated_at", { ascending: false }).limit(300),
      q.from("swivv_chats").select("user_id,peer_id,sender,msg_id,body,created_at").gte("created_at", day).order("created_at", { ascending: false }).limit(2000),
      q.from("swivv_blocks").select("blocker_id,blocked_id,created_at").order("created_at", { ascending: false }).limit(500).then((r: any) => (r.error ? [] : (r.data ?? []))),
      supabase.from("profiles").select("created_at").order("created_at", { ascending: false }).limit(1000).then((r: any) => (r.error ? [] : (r.data ?? []).map((x: any) => x.created_at))),
      q.from("swivv_audit_log").select("action,actor_id,created_at").in("action", ["admin.user.suspended", "admin.user.banned", "admin.role.grant", "admin.role.revoke"]).order("created_at", { ascending: false }).limit(50).then((r: any) => (r.error ? [] : (r.data ?? []))),
      q.from("swivv_ai_runs").select("rule_key,error,created_at").eq("status", "failed").order("created_at", { ascending: false }).limit(20).then((r: any) => (r.error ? [] : (r.data ?? []))),
      q.from("swivv_email_log").select("key,template,created_at").eq("status", "failed").order("created_at", { ascending: false }).limit(20).then((r: any) => (r.error ? [] : (r.data ?? []))),
    ]);
    if (rl) {
      setRules(rl);
      setRulesLive(true);
    } else setRulesLive(false);
    setCases(cs);
    setReports(rp);
    setProfiles(pf.data ?? []);
    setChats(((ch.data ?? []) as any[]).filter((m) => (m.body ?? "").trim()));
    setBlocks(bl);
    setRegs(rg);
    setAdminActs(aa);
    setFailRuns(fr);
    setFailMail(fm);
    const ids = new Set<string>();
    for (const r of rp as any[]) for (const k of ["reported_user_id", "reporter_id"] as const) if (typeof r[k] === "string" && /^[0-9a-f-]{36}$/i.test(r[k])) ids.add(r[k]);
    for (const p of ((pf.data ?? []) as any[])) ids.add(p.user_id);
    for (const a of aa as any[]) if (typeof a.actor_id === "string") ids.add(a.actor_id);
    if (ids.size) {
      const { data: profs } = await q.from("swivv_profiles").select("user_id,data").in("user_id", [...ids].slice(0, 300));
      const map: Record<string, string> = {};
      for (const p of (profs as any[]) ?? []) map[p.user_id] = (p.data as any)?.name ?? p.user_id.slice(0, 8);
      setNames(map);
    }
  }

  useEffect(() => {
    load();
    audit("admin.fraud.view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const th = (key: string, fb: number) => rules.find((r) => r.key === key)?.threshold ?? fb;
  const on = (key: string) => rules.find((r) => r.key === key)?.enabled ?? true;
  const nm = (id: string | null | undefined) => {
    if (!id) return "—";
    return /^[0-9a-f-]{36}$/i.test(id) ? (names[id] ?? `${id.slice(0, 8)}…`) : id;
  };

  const sig = useMemo(() => {
    const rep = reports as any[];
    // ponytail: sender is copy-relative ('me' = copy owner) — ids normalized (u: stripped) for pairing
    const bare = (v: any) => (typeof v === "string" && v.startsWith("u:") ? v.slice(2) : v);
    const directed = (chats as any[]).map((m) => {
      const owner = bare(m.user_id);
      const peer = bare(m.peer_id);
      const from = m.sender === "me" ? owner : peer;
      return { ...m, senderId: from, peerId: from === owner ? peer : owner };
    });
    const dupBio = dupBios(profiles.map((p) => ({ user_id: p.user_id, bio: `${p.data?.tagline ?? ""}\n${p.data?.bio ?? ""}` })));
    return {
      targets: on("repeat-targets") ? repeatTargets(rep, th("repeat-targets", 3)) : [],
      bursts: on("burst-regs") ? burstRegs(regs, th("burst-regs", 5), 1) : [],
      spam: on("spam-links") ? profiles.flatMap((p) => {
        const rs = flagReasons(flagText(`${p.data?.tagline ?? ""}\n${p.data?.bio ?? ""}`));
        return rs.length ? [{ rule: "spam-links", label: `${p.data?.name ?? p.user_id.slice(0, 8)} : ${rs.join(", ")}`, detail: "contenu uniquement", ref: p.user_id } as Signal] : [];
      }) : [],
      repeats: on("repeat-content") ? repeatMessages(directed.map((m) => ({ ...m, sender: m.senderId })), th("repeat-content", 3)) : [],
      pairs: on("pair-volume") ? pairVolume(directed.map((m) => ({ user_id: m.senderId, peer_id: m.peerId, msg_id: m.msg_id })), th("pair-volume", 50)) : [],
      dupBio: dupBio.map((g) => ({ rule: "dup-bio", label: `Bio identique sur ${g.users.length} comptes`, detail: `« ${g.text.slice(0, 80)}… » — signal d'enquête, pas preuve de faux compte`, ref: g.users[0] } as Signal)),
      postBlock: postBlockContact(
        directed.map((m) => ({ senderId: m.senderId, peerId: m.peerId, created_at: m.created_at })),
        (blocks as any[]).map((b) => ({ blocker: bare(b.blocker_id), blocked: bare(b.blocked_id), created_at: b.created_at })),
      ).map((x) => ({ rule: "post-block", label: `Contact après blocage`, detail: `${nm(x.sender)} → ${nm(x.recipient)} le ${new Date(x.at).toLocaleDateString("fr-FR")}`, ref: x.sender } as Signal)),
    };
  }, [reports, regs, profiles, chats, blocks, rules]);

  const openCases = cases.filter((c) => ["open", "investigating"].includes(c.status));
  const decided = cases.filter((c) => ["dismissed", "escalated", "restricted", "closed"].includes(c.status));
  const fp = cases.filter((c) => c.status === "dismissed").length;

  async function openCase(kind: string, ref: string, signals: { ref: string; label: string; detail?: string }[]) {
    const exists = cases.some((c) => c.kind === kind && c.subject_ref === ref && ["open", "investigating"].includes(c.status));
    if (exists) {
      setMsg("Cas déjà ouvert pour cette cible.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("swivv_fraud_cases").insert({
      kind, subject_ref: ref, signals: signals as any, reviewer: user?.id,
    });
    if (error) {
      setMsg(error.message.includes("does not exist") || error.message.includes("schema cache") ? "Tables absentes — applique la migration 20261019000000_swivv_fraud.sql." : error.message);
      return;
    }
    audit("admin.fraud.open", "fraud", ref, { kind });
    logEvaluation({ account_ref: /^[0-9a-f-]{36}$/i.test(ref) ? ref : null, content_type: "account", category: kind, severity: "warning", method: "rule", recommended: "investigate", approval_required: true });
    setMsg("Cas ouvert.");
    load();
  }

  async function setCase(c: any, status: string) {
    if ((status === "dismissed" || status === "restricted") && !reason.trim()) {
      setMsg("Un motif est obligatoire (raison + preuves).");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (status === "restricted") {
      if (!canRestrict) {
        setMsg("Restriction réservée 80+ (RLS).");
        return;
      }
      if (!window.confirm("Suspendre ce compte 7 jours ? Enregistré dans l'audit.")) return;
      const { error } = await (supabase as any).from("swivv_user_status").upsert(
        { user_id: c.subject_ref, status: "suspended", reason: `Fraude (${c.kind})`, until: new Date(Date.now() + 7 * 864e5).toISOString(), updated_by: user?.id },
        { onConflict: "user_id" },
      );
      if (error) {
        setMsg(error.message);
        return;
      }
      notifySuspended(c.subject_ref, `fraude (${c.kind})`);
    }
    if (status === "escalated" && c.subject_ref && /^[0-9a-f-]{36}$/i.test(c.subject_ref)) {
      await supabase.from("swivv_moderation_cases").insert({ subject_user_id: c.subject_ref, priority: "high", assigned_to: null, created_by: user?.id });
    }
    const { error } = await (supabase as any).from("swivv_fraud_cases").update({
      status, reason: reason.trim() || null, reviewer: user?.id, decided_at: new Date().toISOString(),
    }).eq("id", c.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit(`admin.fraud.${status}`, "fraud", c.subject_ref ?? c.id, { kind: c.kind, reason: reason.trim() || undefined });
    setReason("");
    setMsg(`Cas → ${status}.`);
    load();
  }

  async function setThreshold(key: string, value: number) {
    if (!rulesLive) {
      setMsg("Table des règles absente — migration 20261019000000.");
      return;
    }
    const { error } = await (supabase as any).from("swivv_fraud_rules").update({ threshold: value, updated_at: new Date().toISOString() }).eq("key", key);
    if (error) setMsg(error.message);
    else {
      audit("admin.fraud.rule", "rule", key, { threshold: value });
      load();
    }
  }

  const isUuid = (v: string | null | undefined) => !!v && /^[0-9a-f-]{36}$/i.test(v);
  const memberLink = (ref: string | null | undefined) =>
    isUuid(ref) ? <Link to="/admin/users/$userId" params={{ userId: ref as string }} className="text-[#e60050] underline">{nm(ref)}</Link> : <span>{ref}</span>;
  const sigRow = (s: { ref: string; label: string; detail?: string; rule?: string }, kind: string) => (
    <div key={s.ref + s.label} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 text-sm shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[#333]">{s.label}</p>
        <p className="text-xs text-[#5c5c66]">{s.detail} · cible : {memberLink(/^(burst|pair|url|txt):/.test(s.ref) ? null : s.ref)}</p>
      </div>
      {canDecide && <button type="button" onClick={() => openCase(kind, s.ref, [s])} className="rounded border border-border px-2 py-1 text-xs">Ouvrir un cas</button>}
    </div>
  );
  const card = "rounded-xl bg-white p-4 text-sm shadow-sm";

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Fraude & sécurité</h1>
      <p className="mt-1 text-xs text-[#6b6b73]">Règles explicables sur signaux disponibles (pas d'IP/appareils/logs d'auth) · jamais d'attributs protégés · sanctions = humain 80+. {!rulesLive && "Règles locales (migration 20261019000000 en attente)."}</p>
      <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Fraude">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === t ? "bg-[#14112b] text-white" : "bg-white text-[#555]"}`}>{t}</button>
        ))}
      </nav>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}

      {tab === "Vue d'ensemble" && (
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <div className={card}><p className="text-3xl font-bold text-[#333]">{openCases.length}</p><p className="mt-1 text-[#5c5c66]">Cas ouverts</p></div>
          <div className={card}><p className="text-3xl font-bold text-[#333]">{sig.targets.length + sig.bursts.length + sig.spam.length + sig.repeats.length + sig.pairs.length + sig.dupBio.length + sig.postBlock.length}</p><p className="mt-1 text-[#5c5c66]">Signaux actifs</p></div>
          <div className={card}><p className="text-3xl font-bold text-[#333]">{decided.length ? `${Math.round((100 * fp) / decided.length)} %` : "—"}</p><p className="mt-1 text-[#5c5c66]">Faux positifs (rejetés / décidés)</p></div>
          <div className={card}><p className="text-3xl font-bold text-[#333]">{rules.filter((r) => r.enabled).length}/{rules.length}</p><p className="mt-1 text-[#5c5c66]">Règles actives</p></div>
        </div>
      )}

      {tab === "Comptes suspects" && (
        <div className="mt-3 space-y-2">
          {sig.targets.map((s) => sigRow(s, "repeat-targets"))}
          {!sig.targets.length && <p className="text-sm text-[#5c5c66]">Aucun compte multi-signalé au seuil ({th("repeat-targets", 3)} rapporteurs).</p>}
        </div>
      )}

      {tab === "Spam & liens" && (
        <div className="mt-3 space-y-2">
          {sig.spam.slice(0, 30).map((s) => sigRow(s, "spam-links"))}
          {!sig.spam.length && <p className="text-sm text-[#5c5c66]">Aucun signal de spam dans les bios scannées.</p>}
        </div>
      )}

      {tab === "Coordonnés" && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-[#6b6b73]">Rafales d'inscriptions, contenus répétés multi-comptes, paires à fort volume. Une source partagée n'identifie jamais une personne.</p>
          {sig.bursts.map((s) => sigRow(s, "burst-regs"))}
          {sig.repeats.filter((s) => s.severity === "critical").map((s) => sigRow(s, "repeat-content"))}
          {sig.pairs.map((s) => sigRow(s, "pair-volume"))}
          {sig.dupBio.map((s) => sigRow(s, "dup-bio"))}
          {sig.postBlock.map((s) => sigRow(s, "post-block"))}
          {!sig.bursts.length && !sig.repeats.length && !sig.pairs.length && !sig.dupBio.length && !sig.postBlock.length && <p className="text-sm text-[#5c5c66]">Aucun comportement coordonné détecté.</p>}
        </div>
      )}

      {tab === "Sécurité comptes" && (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className={card}>
            <p className="font-medium text-[#333]">Prise de contrôle / abus d'authentification</p>
            <p className="mt-1 text-[#5c5c66]">Non surveillables : ni logs de connexion, ni échecs d'auth, ni appareils collectés. Tableau Supabase Auth côté dashboard.</p>
          </div>
          <div className={card}>
            <p className="font-medium text-[#333]">Accès admin sensibles ({adminActs.length})</p>
            {(adminActs as any[]).slice(0, 15).map((a: any, i: number) => (
              <p key={i} className="mt-1 text-xs text-[#555]">{a.action} · par {nm(a.actor_id)} · {new Date(a.created_at).toLocaleString("fr-FR")}</p>
            ))}
            {!adminActs.length && <p className="mt-1 text-xs text-[#6b6b73]">Aucun accès sensible récent.</p>}
          </div>
        </div>
      )}

      {tab === "Incidents" && (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className={card}>
            <p className="font-medium text-[#333]">Échecs d'intégrations ({failRuns.length + failMail.length})</p>
            {failRuns.map((r: any, i: number) => <p key={i} className="mt-1 text-xs text-[#555]">Automation {r.rule_key} : {r.error ?? "échec"} · {new Date(r.created_at).toLocaleString("fr-FR")}</p>)}
            {failMail.map((m: any, i: number) => <p key={i} className="mt-1 text-xs text-[#555]">E-mail en échec{m.template ? ` (${m.template})` : ""} · {new Date(m.created_at).toLocaleString("fr-FR")}</p>)}
            {!failRuns.length && !failMail.length && <p className="mt-1 text-xs text-[#6b6b73]">Aucun incident.</p>}
          </div>
          <div className={card}>
            <p className="font-medium text-[#333]">Compromission suspectée</p>
            <p className="mt-1 text-[#5c5c66]">Aucun signal disponible (pas de logs d'auth) — tout soupçon passe par un cas manuel ci-dessous, avec preuves.</p>
          </div>
        </div>
      )}

      {tab === "Règles" && (
        <div className="mt-3 space-y-2">
          {rules.map((r: any) => (
            <article key={r.key} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 text-sm shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#333]">{r.name}</p>
                <p className="text-xs text-[#5c5c66]">{r.description}</p>
              </div>
              <label className="flex items-center gap-1 text-xs text-[#555]">Seuil
                <input type="number" min={1} max={1000} defaultValue={r.threshold} aria-label={`Seuil ${r.name}`}
                  onBlur={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v >= 1 && v !== r.threshold) setThreshold(r.key, v); }}
                  disabled={level < 80} className="w-16 rounded border border-border px-2 py-1" />
              </label>
              <span className="text-xs text-[#6b6b73]">{r.enabled ? "active" : "coupée"}{level < 80 ? " (édition 80+)" : ""}</span>
            </article>
          ))}
        </div>
      )}

      {tab === "Décisions" && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif / preuves (obligatoire pour rejeter/restreindre)…" maxLength={500} aria-label="Motif" className="min-w-52 flex-1 rounded-md border border-border px-3 py-2 text-sm" />
          </div>
          {cases.map((c: any) => (
            <article key={c.id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-[#6b6b73]">{c.id.slice(0, 8)}</span>
                <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{c.kind}</span>
                <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{c.status}</span>
                <span className="text-xs text-[#5c5c66]">cible : {memberLink(c.subject_ref)}</span>
                <span className="ml-auto text-xs text-[#6b6b73]">{new Date(c.created_at).toLocaleString("fr-FR")}{c.decided_at ? ` · décidé le ${new Date(c.decided_at).toLocaleString("fr-FR")}` : ""}</span>
              </div>
              {(c.signals ?? []).length > 0 && <p className="mt-1 text-xs text-[#555]">Signaux : {(c.signals as Signal[]).map((s) => s.label).join(" · ")}</p>}
              {c.reason && <p className="mt-1 text-xs text-[#555]">Motif : {c.reason}</p>}
              {canDecide && ["open", "investigating"].includes(c.status) && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <button type="button" onClick={() => setCase(c, "investigating")} className="rounded border border-border px-2 py-1">Enquêter</button>
                  <button type="button" onClick={() => setCase(c, "dismissed")} className="rounded border border-border px-2 py-1">Faux positif</button>
                  <button type="button" onClick={() => setCase(c, "escalated")} className="rounded border border-border px-2 py-1">Escalader (cas modération)</button>
                  {canRestrict && <button type="button" onClick={() => setCase(c, "restricted")} className="rounded border border-red-300 px-2 py-1 text-red-700">Restreindre 7 j</button>}
                  <button type="button" onClick={() => setCase(c, "closed")} className="rounded border border-border px-2 py-1">Clore</button>
                </div>
              )}
              {canDecide && c.status === "dismissed" && (
                <div className="mt-2"><button type="button" onClick={() => setCase(c, "open")} className="rounded border border-border px-2 py-1 text-xs">Rouvrir (appel)</button></div>
              )}
            </article>
          ))}
          {!cases.length && <p className="text-sm text-[#5c5c66]">Aucun cas. Ouvres-en un depuis les signaux ci-dessus.</p>}
        </div>
      )}
    </div>
  );
}
