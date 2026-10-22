-- Verification queue: reviewer assignment + inline review note.
-- No identity documents are stored (minimum-data retention: kinds + decisions only).
-- No IDV provider is configured; email stays Supabase Auth, face check stays local liveness.

ALTER TABLE public.swivv_verification_requests
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_note text;
