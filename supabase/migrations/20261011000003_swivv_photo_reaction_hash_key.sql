-- Photo reactions: re-add the (photo_hash, reactor_id) uniqueness key.
-- The previous migration's defensive drop matched it by accident (LIKE '%(photo%'
-- also matches '(photo_hash, ...)') — this one checks the exact constraint name.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'swivv_photo_reactions_hash_reactor_key'
  ) THEN
    ALTER TABLE public.swivv_photo_reactions
      ADD CONSTRAINT swivv_photo_reactions_hash_reactor_key UNIQUE (photo_hash, reactor_id);
  END IF;
END $$;
