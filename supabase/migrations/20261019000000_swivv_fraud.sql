-- Fraud & security workspace: configurable rules + case workflow.
-- No IPs, device signals, or auth-failure logs exist — rules use reports, blocks,
-- message repetition, registration bursts, and admin-access transparency only.
-- Never: ethnicity, religion, disability, orientation, or inferred personality as signals.

CREATE TABLE IF NOT EXISTS public.swivv_fraud_rules (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  threshold int NOT NULL DEFAULT 3,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.swivv_fraud_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  subject_ref text,
  signals jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'investigating', 'dismissed', 'escalated', 'restricted', 'closed')),
  reviewer uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE INDEX IF NOT EXISTS swivv_fraud_status_idx ON public.swivv_fraud_cases (status, created_at DESC);

ALTER TABLE public.swivv_fraud_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_fraud_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY swivv_fraudrules_select ON public.swivv_fraud_rules
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_fraudrules_write ON public.swivv_fraud_rules
  FOR ALL TO authenticated USING (public.staff_level() >= 80)
  WITH CHECK (public.staff_level() >= 80);
CREATE POLICY swivv_fraudcases_select ON public.swivv_fraud_cases
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_fraudcases_write ON public.swivv_fraud_cases
  FOR ALL TO authenticated USING (public.staff_level() >= 50)
  WITH CHECK (public.staff_level() >= 50);

INSERT INTO public.swivv_fraud_rules (key, name, description, threshold) VALUES
  ('burst-regs', 'Rafale d''inscriptions', 'Comptes créés à moins d''une heure d''intervalle (source partagée possible, jamais une preuve).', 5),
  ('repeat-targets', 'Comptes multi-signalés', 'Signalés par N rapporteurs indépendants.', 3),
  ('spam-links', 'Spam et liens suspects', 'URLs, téléphones, handles, spam dans les bios.', 1),
  ('repeat-content', 'Contenu répété', 'Messages identiques ou mêmes URLs en masse (24 h).', 3),
  ('pair-volume', 'Volume anormal par conversation', 'Paires avec plus de N messages sur 24 h.', 50),
  ('admin-watch', 'Accès admin sensibles', 'Suspension/ban/rôles récents (transparence, pas accusation).', 1)
ON CONFLICT (key) DO NOTHING;
