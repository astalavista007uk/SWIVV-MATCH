-- Alert inbox v2: stable dedupe keys, sources, references, assignee, full workflow.
-- Dedupe: one live alert per dedupe_key (partial unique index) — re-fire allowed after resolve/dismiss.

ALTER TABLE public.swivv_admin_alerts
  ADD COLUMN IF NOT EXISTS dedupe_key text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS ref_kind text,
  ADD COLUMN IF NOT EXISTS ref_id text,
  ADD COLUMN IF NOT EXISTS assignee uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reason text;
DO $$
BEGIN
  ALTER TABLE public.swivv_admin_alerts DROP CONSTRAINT IF EXISTS swivv_admin_alerts_status_check;
  ALTER TABLE public.swivv_admin_alerts ADD CONSTRAINT swivv_admin_alerts_status_check
    CHECK (status IN ('open', 'acknowledged', 'in_progress', 'escalated', 'resolved', 'dismissed'));
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS swivv_alerts_dedupe_open_idx
  ON public.swivv_admin_alerts (dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status IN ('open', 'acknowledged', 'in_progress', 'escalated');
CREATE INDEX IF NOT EXISTS swivv_alerts_source_idx
  ON public.swivv_admin_alerts (source, status, created_at DESC);
