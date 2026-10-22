// Engagement recommendations from aggregates only — never individual ranking,
// never message-content mining, never auto-messaging.
// ponytail: threshold rules with supporting numbers shown (no model) —
// a model plugs in when providerStatus() is configured; rules stay as the audit trail

export type Agg = {
  completionRate: number | null;
  photoRate: number | null;
  bioRate: number | null;
  regToCompleteH: number | null;
  msgPerActive: number | null;
  announceReadRate: number | null;
  failMail: number;
  failRuns: number;
  scanned: number;
};

export type Reco = { title: string; why: string; action: string; to: string };

export function recommend(a: Agg): Reco[] {
  const out: Reco[] = [];
  if (a.completionRate != null && a.completionRate < 60)
    out.push({
      title: "Simplifier la complétion du profil",
      why: `seulement ${a.completionRate} % des ${a.scanned} profils scannés atteignent 80 %`,
      action: "Revoir les champs obligatoires de l'inscription",
      to: "/admin/content",
    });
  if (a.bioRate != null && a.bioRate < 50)
    out.push({
      title: "Aider à écrire la bio",
      why: `${a.bioRate} % des profils ont une bio — les autres restent muets`,
      action: "Mettre en avant le guide et des exemples",
      to: "/guide-photos",
    });
  if (a.photoRate != null && a.photoRate < 70)
    out.push({
      title: "Encourager les photos",
      why: `${a.photoRate} % des profils ont au moins une photo`,
      action: "Rappeler le guide photos à l'onboarding",
      to: "/guide-photos",
    });
  if (a.regToCompleteH != null && a.regToCompleteH > 48)
    out.push({
      title: "Réduire la friction d'inscription",
      why: `médiane inscription → profil de ${Math.round(a.regToCompleteH)} h`,
      action: "Raccourcir le tunnel ou relancer pendant la fenêtre",
      to: "/admin/analytics",
    });
  if (a.failMail + a.failRuns > 0)
    out.push({
      title: "Corriger les échecs techniques",
      why: `${a.failMail} e-mail(s) en échec, ${a.failRuns} automation(s) en échec — freins directs aux interactions`,
      action: "Voir les incidents",
      to: "/admin/fraud",
    });
  out.push({
    title: "Préférences de notification serveur",
    why: "les toggles actuels sont appareil-local, donc inopposables aux campagnes",
    action: "Cadrer une table de consentement avant tout reciblage",
    to: "/admin/settings",
  });
  return out;
}
