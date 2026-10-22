-- Email outbox diagnostics: provider id + failure reason per send attempt.
-- ponytail: additive columns only (existing statuses untouched, digest cadence reads status='sent' as before) — a delivery webhook writes final delivery here if Resend webhooks ever land
ALTER TABLE public.swivv_email_log ADD COLUMN IF NOT EXISTS provider_id TEXT;
ALTER TABLE public.swivv_email_log ADD COLUMN IF NOT EXISTS error TEXT;
