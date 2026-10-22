import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LEVEL, audit, type StaffRole } from "@/lib/admin";

const ROLES: StaffRole[] = ["super_admin", "admin", "moderator", "support", "analyst"];
const TABS = ["Général", "Rôles", "Permissions", "Sécurité", "Modération", "Automatisations", "Notifications", "Intégrations", "Confidentialité", "Journalisation"] as const;

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
} as any);

// ponytail: super-admin only (min 100) — every tab shows backed controls or labelled deployment status, never fake toggles;
// anything without a backend row says so instead of pretending
function AdminSettings() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Rôles");
  const [rows, setRows] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [ping, setPing] = useState<number | null>(null);
  const [uid, setUid] = useState("");
  const [role, setRole] = useState<StaffRole>("moderator");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const [r, p] = await Promise.all([
      supabase.from("user_roles").select("*").limit(200),
      (supabase as any).from("swivv_mod_policies").select("name,severity,action,auto_apply").order("name").then((x: any) => (x.error ? [] : (x.data ?? []))),
    ]);
    if (r.error) setMsg(r.error.message);
    else setRows(r.data ?? []);
    setPolicies(p);
  }

  useEffect(() => {
    load();
    audit("admin.roles.view");
  }, []);

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    if (!uid.trim()) return;
    if (!window.confirm(`Attribuer le rôle ${role} à ${uid.trim()} ?`)) return;
    // RLS on user_roles allows only admin reads; writes go through service_role normally.
    // ponytail: direct insert works only if a policy permits it — grant_roles() RPC below when locked down
    const { error } = await supabase.from("user_roles").insert({ user_id: uid.trim(), role } as any);
    if (error) {
      setMsg(`Attribution impossible (${error.message}). Ajoute le rôle via Studio SQL : INSERT INTO user_roles …`);
      return;
    }
    audit("admin.role.grant", "user", uid.trim(), { role }, { severity: "warning" });
    setUid("");
    load();
  }

  async function revoke(user_id: string, r: string) {
    if (!window.confirm(`Retirer le rôle ${r} ? L'accès est révoqué immédiatement.`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", r as any);
    if (error) {
      setMsg(error.message);
      return;
    }
    audit("admin.role.revoke", "user", user_id, { role: r }, { severity: "warning" });
    load();
  }

  async function checkPing() {
    const t0 = performance.now();
    const { error } = await supabase.from("swivv_profiles").select("user_id", { count: "exact", head: true });
    setPing(error ? -1 : Math.round(performance.now() - t0));
  }

  const card = "rounded-xl bg-white p-4 text-sm shadow-sm";
  const li = (k: string, v: string) => (
    <p className="mt-1 text-[#555]"><span className="text-[#999]">{k} : </span>{v}</p>
  );

  return (
    <div>
      <h1 className="text-2xl font-medium text-[#333]">Réglages</h1>
      <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Réglages">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${tab === t ? "bg-[#14112b] text-white" : "bg-white text-[#555]"}`}>{t}</button>
        ))}
      </nav>
      {msg && <p className="mt-2 text-sm text-[#555]">{msg}</p>}

      {tab === "Général" && (
        <div className={`${card} mt-4`}>
          <p className="font-medium text-[#333]">Aucun paramètre général stocké en base — la configuration est au déploiement.</p>
          {li("Produit", "SWIVV MATCH")}
          {li("Langue / fuseau", "fr-FR · Europe/Paris (code)")}
          {li("Monnaie / paiements", "aucun produit payant — pas de configuration")}
        </div>
      )}

      {tab === "Rôles" && (
        <>
          <form onSubmit={grant} className="mt-4 flex flex-wrap gap-2 rounded-xl bg-white p-4 shadow-sm">
            <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="UUID Auth de l'utilisateur" aria-label="UUID utilisateur" className="min-w-0 flex-1 rounded-md border border-border px-3 py-2 font-mono text-sm" />
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} aria-label="Rôle" className="rounded-md border border-border bg-white px-3 py-2 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="submit" className="rounded-md bg-[#e91e63] px-4 py-2 text-sm font-medium text-white">Attribuer</button>
          </form>
          <div className="mt-4 space-y-1">
            {rows.map((r: any, i: number) => (
              <div key={`${r.user_id}-${r.role}-${i}`} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                <span className="font-mono text-xs">{r.user_id}</span>
                <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-xs">{r.role} (niveau {ROLE_LEVEL[r.role as StaffRole] ?? "?"})</span>
                <button type="button" onClick={() => revoke(r.user_id, r.role)} className="ml-auto text-xs text-red-600 hover:underline">Retirer</button>
              </div>
            ))}
            {rows.length === 0 && <p className="text-sm text-[#777]">Aucun rôle. Premier super admin via Studio SQL.</p>}
          </div>
        </>
      )}

      {tab === "Permissions" && (
        <div className={`${card} mt-4`}>
          <p className="font-medium text-[#333]">Niveaux appliqués côté serveur (fonction staff_level + RLS) — lecture seule ici.</p>
          {ROLES.map((r) => <p key={r} className="mt-1 text-[#555]">{r} <span className="text-[#999]">→ niveau {ROLE_LEVEL[r]}</span></p>)}
          {li("Lecture staff (10+)", "toutes les tables métier")}
          {li("Support (30+)", "notes, tickets, annonces, audit-append")}
          {li("Modération (50+)", "signalements, cas, vérification, décisions")}
          {li("Sanctions comptes (80+)", "swivv_user_status (suspend/ban)")}
          {li("Rôles & politiques (100)", "user_roles, swivv_mod_policies")}
        </div>
      )}

      {tab === "Sécurité" && (
        <div className={`${card} mt-4`}>
          <p className="font-medium text-[#333]">Posture (configurations Supabase dashboard, non modifiables ici).</p>
          {li("Clés", "clé publique côté client uniquement ; service_role jamais exposée")}
          {li("Sessions", "gérées par Supabase Auth (politiques côté dashboard)")}
          {li("MFA admin", "non imposée — à activer côté dashboard si exigée")}
          {li("Rate limits", "limites Supabase par défaut ; pas de limites métier configurées")}
        </div>
      )}

      {tab === "Modération" && (
        <div className={`${card} mt-4`}>
          <p className="font-medium text-[#333]">Politiques actives ({policies.length}) — édition dans l'onglet Modération.</p>
          {policies.map((p: any) => <p key={p.name} className="mt-1 text-[#555]">{p.name} <span className="text-[#999]">→ {p.severity} / {p.action}{p.auto_apply ? " (AUTO)" : ""}</span></p>)}
          {!policies.length && <p className="mt-1 text-[#777]">Table non chargée (migration 20261013000000).</p>}
          {li("Approbations", "ban/suppression : humain 80+, double confirmation ; IA ne décide jamais")}
          <p className="mt-2"><Link to="/admin/moderation" className="text-xs text-[#e91e63] underline">Ouvrir la modération</Link></p>
        </div>
      )}

      {tab === "Automatisations" && (
        <div className={`${card} mt-4`}>
          <p className="font-medium text-[#333]">Règles en vigueur (constantes code — ajustables par déploiement, interrupteurs à venir avec une table de config).</p>
          {li("Audit sanctions/vérifications", "triggers DB, toujours actifs")}
          {li("Suppression annonces", "7 jours par utilisateur")}
          {li("SLA support", "1re réponse staff sous 48 h")}
          {li("Seuils d'alerte", "critique > 0 · files ≥ 20 · ticket > 48 h")}
          {li("Sanctions auto", "aucune (auto_apply = faux partout)")}
        </div>
      )}

      {tab === "Notifications" && (
        <div className={`${card} mt-4`}>
          <p className="font-medium text-[#333]">Canaux (état réel, sans interrupteurs factices).</p>
          {li("In-app", "opérationnel (swivv_notifications)")}
          {li("E-mail", "transactionnel serveur uniquement (Resend) — campagnes non branchées")}
          {li("Push", "aucun fournisseur configuré")}
          {li("Préférences", "toggles appareil-local (paramètres) — pas de magasin serveur opposable")}
        </div>
      )}

      {tab === "Intégrations" && (
        <div className={`${card} mt-4`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-[#333]">Supabase : {ping == null ? "non testé" : ping < 0 ? "injoignable" : `${ping} ms`}</p>
            <button type="button" onClick={checkPing} className="rounded border border-border px-2 py-1 text-xs">Tester</button>
          </div>
          {li("Resend (e-mail)", "configuration déploiement (RESEND_API_KEY, SUPPORT_EMAIL_FROM) — non vérifiable depuis le navigateur")}
          {li("IA", "aucun fournisseur — résumé/classification indisponibles")}
          {li("Clés API", "jamais affichées ici ; ajout côté serveur/hébergeur uniquement")}
        </div>
      )}

      {tab === "Confidentialité" && (
        <div className={`${card} mt-4`}>
          <p className="font-medium text-[#333]">Données et durées (aucune purge automatique configurée).</p>
          {li("Profils/messages", "conservés tant que le compte existe")}
          {li("Audit", "append-only, purge service_role uniquement si exigée")}
          {li("Demandes d'accès/suppression", "via fiche membre (export JSON, marquage deleted)")}
          <p className="mt-2"><Link to="/admin/users" className="text-xs text-[#e91e63] underline">Ouvrir les utilisateurs</Link></p>
        </div>
      )}

      {tab === "Journalisation" && (
        <div className={`${card} mt-4`}>
          <p className="font-medium text-[#333]">Audit append-only (lecture + ajout, aucune édition).</p>
          {li("Rétention", "illimitée en base — purge manuelle service_role si politique l'exige")}
          {li("Charges utiles", "jamais de mots de passe, tokens ni corps de messages privés")}
          <p className="mt-2"><Link to="/admin/audit" className="text-xs text-[#e91e63] underline">Ouvrir l'audit (+ export CSV)</Link></p>
        </div>
      )}
    </div>
  );
}
