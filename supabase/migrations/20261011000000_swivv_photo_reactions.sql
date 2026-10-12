-- Photo reactions: one active reaction per member per photo + append-only event history.
-- ponytail: photos are URL strings (no photo rows exist anywhere), so photo = URL and owner_id is stated-then-verified (stats join the owner's real profile photos; the notify listener re-checks ownership before pinging) — a photo-registry table if uploads ever need metadata/dates
CREATE TABLE IF NOT EXISTS public.swivv_photo_reactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  photo TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reactor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('craquant', 'jadore', 'charmant', 'canon', 'clin-doeil', 'original')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (photo, reactor_id),
  CHECK (owner_id <> reactor_id)
);

CREATE TABLE IF NOT EXISTS public.swivv_photo_reaction_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  photo TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reactor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN ('created', 'changed', 'removed')),
  reaction TEXT CHECK (reaction IN ('craquant', 'jadore', 'charmant', 'canon', 'clin-doeil', 'original')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ponytail: update locks identity columns (a client may only change its reaction) — drop if a moderation flow ever needs to reassign rows
CREATE OR REPLACE FUNCTION public.photo_reaction_lock_keys() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.photo IS DISTINCT FROM OLD.photo OR NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.reactor_id IS DISTINCT FROM OLD.reactor_id THEN
    RAISE EXCEPTION 'reaction keys immutable';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_photo_reaction_lock ON public.swivv_photo_reactions;
CREATE TRIGGER trg_photo_reaction_lock BEFORE UPDATE ON public.swivv_photo_reactions
  FOR EACH ROW EXECUTE FUNCTION public.photo_reaction_lock_keys();

-- ponytail: 30 actions/min per reactor (retries share the upsert key so they never inflate totals) — tighten if abuse ever shows up in the event log
CREATE OR REPLACE FUNCTION public.photo_reaction_rate() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.swivv_photo_reaction_events WHERE reactor_id = NEW.reactor_id AND created_at > now() - interval '1 minute') >= 30 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_photo_reaction_rate ON public.swivv_photo_reaction_events;
CREATE TRIGGER trg_photo_reaction_rate BEFORE INSERT ON public.swivv_photo_reaction_events
  FOR EACH ROW EXECUTE FUNCTION public.photo_reaction_rate();

-- Public per-type counts without exposing who reacted (base table stays reactor/owner-readable only).
CREATE OR REPLACE FUNCTION public.photo_reaction_counts(photos TEXT[])
RETURNS TABLE (photo TEXT, reaction TEXT, n INT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT r.photo, r.reaction, COUNT(*)::int FROM public.swivv_photo_reactions r
  WHERE r.photo = ANY (photos) GROUP BY r.photo, r.reaction;
$$;

ALTER TABLE public.swivv_photo_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_photo_reaction_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY swivv_photoreact_read ON public.swivv_photo_reactions
  FOR SELECT TO authenticated USING (reactor_id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY swivv_photoreact_insert ON public.swivv_photo_reactions
  FOR INSERT TO authenticated WITH CHECK (reactor_id = auth.uid());
CREATE POLICY swivv_photoreact_update ON public.swivv_photo_reactions
  FOR UPDATE TO authenticated USING (reactor_id = auth.uid()) WITH CHECK (reactor_id = auth.uid());
CREATE POLICY swivv_photoreact_delete ON public.swivv_photo_reactions
  FOR DELETE TO authenticated USING (reactor_id = auth.uid());
CREATE POLICY swivv_photoreact_ev_insert ON public.swivv_photo_reaction_events
  FOR INSERT TO authenticated WITH CHECK (reactor_id = auth.uid());
CREATE POLICY swivv_photoreact_ev_read ON public.swivv_photo_reaction_events
  FOR SELECT TO authenticated USING (owner_id = auth.uid() OR reactor_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.swivv_photo_reactions TO authenticated;
GRANT SELECT, INSERT ON public.swivv_photo_reaction_events TO authenticated;
GRANT ALL ON public.swivv_photo_reactions TO service_role;
GRANT ALL ON public.swivv_photo_reaction_events TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

CREATE INDEX IF NOT EXISTS idx_photoreact_owner ON public.swivv_photo_reactions(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_photoreact_photo ON public.swivv_photo_reactions(photo);
CREATE INDEX IF NOT EXISTS idx_photoreact_ev_owner ON public.swivv_photo_reaction_events(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photoreact_ev_reactor ON public.swivv_photo_reaction_events(reactor_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'swivv_photo_reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.swivv_photo_reactions;
  END IF;
END $$;
