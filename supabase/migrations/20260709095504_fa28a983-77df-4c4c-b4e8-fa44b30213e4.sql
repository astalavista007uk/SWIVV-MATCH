
DO $$ BEGIN
  CREATE TYPE public.avatar_moderation_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_status public.avatar_moderation_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS pending_avatar_url text,
  ADD COLUMN IF NOT EXISTS avatar_moderation_note text,
  ADD COLUMN IF NOT EXISTS avatar_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS avatar_reviewed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.avatar_moderation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  verdict public.avatar_moderation_status NOT NULL,
  auto boolean NOT NULL DEFAULT true,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.avatar_moderation_log TO authenticated;
GRANT ALL ON public.avatar_moderation_log TO service_role;

ALTER TABLE public.avatar_moderation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own avatar moderation log"
  ON public.avatar_moderation_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
