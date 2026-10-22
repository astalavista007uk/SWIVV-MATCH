-- Audit enrichment: outcome, severity, reason, correlation.
-- Append-only preserved: no UPDATE/DELETE policies are added; GRANT stays SELECT + INSERT.

ALTER TABLE public.swivv_audit_log
  ADD COLUMN IF NOT EXISTS outcome text NOT NULL DEFAULT 'success'
    CHECK (outcome IN ('success', 'failure', 'rejected')),
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS correlation text;
CREATE INDEX IF NOT EXISTS swivv_audit_action_idx
  ON public.swivv_audit_log (action, created_at DESC);
CREATE INDEX IF NOT EXISTS swivv_audit_at_idx
  ON public.swivv_audit_log (created_at DESC);
