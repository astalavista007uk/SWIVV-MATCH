-- Mandatory dog & cat behaviour quiz for service providers.
-- provider_quiz_passed_at is set once a provider passes the quiz (>= 80%).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_quiz_passed_at TIMESTAMPTZ;

-- Grandfather existing providers: anyone who already offers services, or who
-- completed the previous onboarding (bio + location), is considered vetted.
UPDATE public.profiles p
SET provider_quiz_passed_at = now()
WHERE p.user_type IN ('sitter', 'both')
  AND (
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.sitter_id = p.id AND s.deleted_at IS NULL
    )
    OR (
      p.bio IS NOT NULL AND length(btrim(p.bio)) >= 20
      AND p.location IS NOT NULL AND length(btrim(p.location)) > 0
    )
  );
