-- Photo reactions: drop the raw-photo btree (index rows cap at 8KB; member photos are
-- base64 data URLs up to ~750KB). Counts/stats/deletes fall back to seq scans on a
-- small table; the (photo_hash, reactor_id) key stays the indexed uniqueness path.
-- ponytail: seq scans are fine while reaction rows number in the thousands — a hash-partitioned
-- counts rollup if photo reactions ever approach like-scale
DROP INDEX IF EXISTS public.idx_photoreact_photo;
-- Defensive: the UNIQUE(photo, reactor_id) from the first migration under any name.
DO $$
DECLARE c TEXT;
BEGIN
  SELECT conname INTO c FROM pg_constraint
  WHERE conrelid = 'public.swivv_photo_reactions'::regclass AND contype = 'u'
    AND pg_get_constraintdef(oid) LIKE '%(photo%';
  IF c IS NOT NULL THEN EXECUTE format('ALTER TABLE public.swivv_photo_reactions DROP CONSTRAINT %I', c); END IF;
END $$;
