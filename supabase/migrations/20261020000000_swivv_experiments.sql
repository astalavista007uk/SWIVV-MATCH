-- Experiment journal (manual tracking — no feature-flag machinery is wired;
-- status transitions are human decisions, audited from the UI).

CREATE TABLE IF NOT EXISTS public.swivv_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  hypothesis text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  start_at timestamptz,
  end_at timestamptz,
  metrics text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'done')),
  conclusion text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.swivv_experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY swivv_exp_select ON public.swivv_experiments
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_exp_write ON public.swivv_experiments
  FOR ALL TO authenticated USING (public.staff_level() >= 80)
  WITH CHECK (public.staff_level() >= 80);
