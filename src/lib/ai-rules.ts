// Deterministic automation evaluators (no model calls — see ai-provider.ts).
// ponytail: rules v1, thresholds inline (spam-bios reuses admin-moderation flags) —
// a model plugs in behind providerStatus(); flags stay as the auditable fallback
import { flagReasons, flagText } from "./admin-moderation";
import { profileCompleteness } from "./swivv-auth";

export type Suggestion = { ref: string; label: string; detail: string; severity: "info" | "warning" | "critical" };

const URGENT_CAT = /(violence|menace|arme|suicide|mineur|harcèlement|harcelement|agression|chantage)/i;

export function classifyReports(reports: { id: string; category: string; description?: string | null; reported_user_id?: string | null; priority: string }[], repeats: Record<string, number>): Suggestion[] {
  return reports
    .filter((r) => r.priority === "normal" || r.priority === "low")
    .filter((r) => URGENT_CAT.test(`${r.category} ${r.description ?? ""}`) || (repeats[r.reported_user_id ?? ""] ?? 0) >= 2)
    .map((r) => ({
      ref: r.id,
      label: `Escalader en critique : ${r.category}`,
      detail: URGENT_CAT.test(`${r.category} ${r.description ?? ""}`) ? "mot-clé sécurité" : `${repeats[r.reported_user_id ?? ""] ?? 0} signalements sur le compte`,
      severity: "critical" as const,
    }));
}

export function spamBios(profiles: { user_id: string; data: any }[]): Suggestion[] {
  return profiles.flatMap((p) => {
    const reasons = flagReasons(flagText(`${p.data?.tagline ?? ""}\n${p.data?.bio ?? ""}`));
    return reasons.length ? [{ ref: p.user_id, label: `Bio à relire : ${p.data?.name ?? p.user_id.slice(0, 8)}`, detail: reasons.join(", "), severity: "warning" as const }] : [];
  });
}

export function repeatMessages(messages: { body: string; sender?: string; created_at: string }[], minRepeats = 3): Suggestion[] {
  const groups = new Map<string, { n: number; senders: Set<string>; sample: string }>();
  for (const m of messages) {
    const body = (m.body ?? "").trim().toLowerCase();
    if (body.length < 12) continue;
    const key = /https?:\/\//.test(body) ? `url:${(body.match(/https?:\/\/[^\s]+/) ?? [""])[0]}` : `txt:${body.slice(0, 120)}`;
    const g = groups.get(key) ?? { n: 0, senders: new Set<string>(), sample: m.body.slice(0, 120) };
    g.n++;
    if (m.sender) g.senders.add(m.sender);
    groups.set(key, g);
  }
  return [...groups.entries()]
    .filter(([, g]) => g.n >= minRepeats)
    .map(([k, g]) => ({
      ref: k,
      label: `Contenu répété ×${g.n}${g.senders.size > 1 ? ` par ${g.senders.size} comptes` : ""}`,
      detail: g.sample,
      severity: (g.senders.size > 1 ? "critical" : "warning") as "critical" | "warning",
    }));
}

export function urgentSafety(reports: { id: string; category: string; priority: string; status: string; reported_user_id?: string | null }[], repeats: Record<string, number>): Suggestion[] {
  return reports
    .filter((r) => ["new", "investigating", "waiting"].includes(r.status))
    .filter((r) => r.priority === "critical" || (r.priority === "high" && (repeats[r.reported_user_id ?? ""] ?? 0) >= 2))
    .map((r) => ({ ref: r.id, label: `Urgence : ${r.category} (${r.priority})`, detail: "revue humaine requise — jamais de sanction auto", severity: "critical" as const }));
}

export function summarizeCase(c: { id: string; status: string; priority: string; action_taken?: string | null; created_at: string }, notes: { body: string }[], pastReports: number): string {
  const lines = [
    `Cas ${c.id.slice(0, 8)} — ${c.status}, priorité ${c.priority}, ouvert le ${new Date(c.created_at).toLocaleDateString("fr-FR")}.`,
    `${notes.length} note(s) interne(s)${c.action_taken ? `, action : ${c.action_taken}` : ", aucune action consignée"}.`,
    `${pastReports} signalement(s) antérieur(s) sur le compte.`,
    "Résumé gabarit (pas de modèle) — décision : humain.",
  ];
  return lines.join(" ");
}

export function incompleteProfiles(profiles: { user_id: string; data: any }[], threshold = 80): Suggestion[] {
  return profiles
    .map((p) => ({ p, pct: profileCompleteness(p.data) }))
    .filter((x) => x.pct < threshold)
    .map((x) => ({ ref: x.p.user_id, label: `${x.p.data?.name ?? x.p.user_id.slice(0, 8)} : ${x.pct} %`, detail: "profil à compléter", severity: "info" as const }));
}

export function onboardingHelp(profiles: { user_id: string; data: any }[], days = 7, threshold = 50, nowMs = Date.now()): Suggestion[] {
  return profiles
    .filter((p) => {
      const j = p.data?.joinedAt ? new Date(p.data.joinedAt).getTime() : NaN;
      return Number.isFinite(j) && nowMs - j < days * 864e5 && profileCompleteness(p.data) < threshold;
    })
    .map((p) => ({ ref: p.user_id, label: `Onboarding : ${p.data?.name ?? p.user_id.slice(0, 8)}`, detail: "compte récent peu complété", severity: "info" as const }));
}

export function failedNotify(emailLog: { status: string; to?: string; created_at: string }[]): Suggestion[] {
  return emailLog
    .filter((e) => e.status === "failed")
    .slice(0, 50)
    .map((e) => ({ ref: e.to ?? e.created_at, label: `Échec d'envoi ${e.to ? `à ${e.to}` : ""}`, detail: new Date(e.created_at).toLocaleString("fr-FR"), severity: "warning" as const }));
}
