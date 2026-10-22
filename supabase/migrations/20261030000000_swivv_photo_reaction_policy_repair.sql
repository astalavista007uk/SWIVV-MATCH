-- Photo reactions: repair write policies that drifted from the repo migration.
-- Live symptom (real accounts only, seeds never touch the DB): reacting failed because
-- the event INSERT is denied (403 RLS), and changing/removing a reaction silently hit
-- 0 rows (UPDATE/DELETE policies missing). Fresh reaction INSERTs already worked.
-- ponytail: drop every policy on the two tables first so an older restrictive leftover
-- can't AND the recreated permissive ones into a deny; narrow to named drops once the
-- live set is known to match the repo.
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('swivv_photo_reactions', 'swivv_photo_reaction_events')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

ALTER TABLE public.swivv_photo_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_photo_reaction_events ENABLE ROW LEVEL SECURITY;

-- reactions: reactor owns the action, owner may read the counts on their photos
CREATE POLICY swivv_photoreact_read ON public.swivv_photo_reactions
  FOR SELECT TO authenticated USING (reactor_id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY swivv_photoreact_insert ON public.swivv_photo_reactions
  FOR INSERT TO authenticated
  WITH CHECK (reactor_id = auth.uid() AND NOT public.is_blocked(auth.uid(), owner_id));
CREATE POLICY swivv_photoreact_update ON public.swivv_photo_reactions
  FOR UPDATE TO authenticated
  USING (reactor_id = auth.uid()) WITH CHECK (reactor_id = auth.uid());
CREATE POLICY swivv_photoreact_delete ON public.swivv_photo_reactions
  FOR DELETE TO authenticated USING (reactor_id = auth.uid());

-- history: each member writes and reads only their own filings (owners read what they received)
CREATE POLICY swivv_photoreact_ev_insert ON public.swivv_photo_reaction_events
  FOR INSERT TO authenticated WITH CHECK (reactor_id = auth.uid());
CREATE POLICY swivv_photoreact_ev_read ON public.swivv_photo_reaction_events
  FOR SELECT TO authenticated USING (owner_id = auth.uid() OR reactor_id = auth.uid());

-- staff backstop (member page is staff-gated)
CREATE POLICY swivv_photoreact_staff_read ON public.swivv_photo_reactions
  FOR SELECT TO authenticated USING (public.staff_level() >= 10);
CREATE POLICY swivv_photoreact_ev_staff_read ON public.swivv_photo_reaction_events
  FOR SELECT TO authenticated USING (public.staff_level() >= 10);
