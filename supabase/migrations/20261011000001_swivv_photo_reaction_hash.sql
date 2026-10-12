-- Photo reactions: uniqueness on md5(photo) — raw photos are routinely 50-100KB
-- base64 data URLs, which blow Postgres' 8KB btree index limit (54000) on UNIQUE(photo, reactor_id).
-- ponytail: md5 is a uniqueness shortcut, not security — a collision would merge two photos' counts; switch to sha256 (+pgcrypto) if photo keys ever become adversarial
ALTER TABLE public.swivv_photo_reactions
  ADD COLUMN IF NOT EXISTS photo_hash TEXT GENERATED ALWAYS AS (md5(photo)) STORED;
ALTER TABLE public.swivv_photo_reactions
  DROP CONSTRAINT IF EXISTS swivv_photo_reactions_photo_reactor_id_key;
ALTER TABLE public.swivv_photo_reactions
  ADD CONSTRAINT swivv_photo_reactions_hash_reactor_key UNIQUE (photo_hash, reactor_id);
CREATE INDEX IF NOT EXISTS idx_photoreact_hash ON public.swivv_photo_reactions(photo_hash);
