-- Shared moderation evaluations log (refs only — no bodies, no documents, no images).
-- Written by reviewer decisions and fraud case openings; AI providers fill
-- confidence/provider when configured (all null today = rules v1).

CREATE TABLE IF NOT EXISTS public.swivv_mod_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_ref text,
  content_ref text,
  content_type text NOT NULL CHECK (content_type IN ('text', 'photo', 'message', 'account', 'other')),
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  confidence numeric,
  method text NOT NULL DEFAULT 'rule' CHECK (method IN ('rule', 'model', 'human')),
  provider text,
  policy_version text NOT NULL DEFAULT 'rules-v1',
  recommended text,
  action_taken text,
  approval_required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'done' CHECK (status IN ('done', 'review', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_eval_account_idx ON public.swivv_mod_evaluations (account_ref, created_at DESC);
CREATE INDEX IF NOT EXISTS swivv_eval_content_idx ON public.swivv_mod_evaluations (content_ref, created_at DESC);

ALTER TABLE public.swivv_mod_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY swivv_eval_select ON public.swivv_mod_evaluations
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_eval_insert ON public.swivv_mod_evaluations
  FOR INSERT TO authenticated WITH CHECK (public.staff_level() >= 50);
