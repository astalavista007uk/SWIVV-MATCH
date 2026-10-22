-- Campaign scheduling + cancellation (sending stays manual: no worker is configured).
-- Consent: no server-side opt-out store exists (toggles are device-local) —
-- frequency protection is a 7-day per-user suppression applied at send time.

ALTER TABLE public.swivv_announcements
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
