-- AI ops centre: automation rules registry + execution log.
-- No AI provider is configured and no background worker exists:
-- runs are manual synchronous executions, logged here; a worker consumes
-- queued rows when one is deployed. Sanctions are never automated.

CREATE TABLE IF NOT EXISTS public.swivv_ai_rules (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  trigger_kind text NOT NULL DEFAULT 'manual',
  enabled boolean NOT NULL DEFAULT true,
  dry_run boolean NOT NULL DEFAULT true,
  priority int NOT NULL DEFAULT 100,
  approval text NOT NULL DEFAULT 'human' CHECK (approval IN ('human', 'auto-low-risk')),
  config jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.swivv_ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL REFERENCES public.swivv_ai_rules(key) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'done' CHECK (status IN ('queued', 'running', 'done', 'failed', 'review')),
  input_ref text,
  result jsonb NOT NULL DEFAULT '{}',
  duration_ms int,
  error text,
  reviewer uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_ai_runs_rule_idx ON public.swivv_ai_runs (rule_key, created_at DESC);
CREATE INDEX IF NOT EXISTS swivv_ai_runs_status_idx ON public.swivv_ai_runs (status, created_at DESC);

ALTER TABLE public.swivv_ai_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY swivv_airules_select ON public.swivv_ai_rules
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_airules_write ON public.swivv_ai_rules
  FOR ALL TO authenticated USING (public.staff_level() >= 80)
  WITH CHECK (public.staff_level() >= 80);
CREATE POLICY swivv_airuns_select ON public.swivv_ai_runs
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_airuns_insert ON public.swivv_ai_runs
  FOR INSERT TO authenticated WITH CHECK (public.staff_level() >= 50);

INSERT INTO public.swivv_ai_rules (key, name, description, trigger_kind, priority, approval, config) VALUES
  ('classify-reports', 'Classer les nouveaux signalements', 'Catégorie + priorité suggérées par règles (mots-clés, récidive).', 'manual', 10, 'human', '{"min_confidence": 0.8}'),
  ('spam-bios', 'Spam dans les bios', 'URLs, téléphones, handles et spam présumé dans bio/accroche.', 'manual', 20, 'human', '{}'),
  ('repeat-messages', 'Messages répétés / liens', 'Corps identiques ou mêmes URLs envoyés en masse (24 h).', 'manual', 30, 'human', '{"min_repeats": 3}'),
  ('urgent-safety', 'Urgences sécurité', 'Critiques + haute priorité sur comptes récidivistes.', 'manual', 5, 'human', '{}'),
  ('summarize-case', 'Résumés de cas', 'Résumé gabarit (pas de modèle) : états, notes, antécédents.', 'manual', 60, 'human', '{}'),
  ('incomplete-profiles', 'Profils incomplets', 'Complétude < 80 % : suggestions de champs manquants.', 'manual', 70, 'auto-low-risk', '{"threshold": 80}'),
  ('onboarding-help', 'Aide à l''onboarding', 'Comptes < 7 j avec complétude < 50 %.', 'manual', 80, 'auto-low-risk', '{"days": 7, "threshold": 50}'),
  ('failed-notify', 'Notifications en échec', 'E-mails failed (journal) à réessayer ou escalader.', 'manual', 40, 'human', '{}')
ON CONFLICT (key) DO NOTHING;
