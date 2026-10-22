-- Block guard: blocks enforced server-side on social writes (client guards are bypassable).
-- ponytail: one SECURITY DEFINER helper (same pattern as staff_level — an RLS check can't read the other party's block row) referenced from every social insert check; unlike/unmatch/delete paths stay open so leaving always works
CREATE OR REPLACE FUNCTION public.is_blocked(a uuid, b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.swivv_blocks
    WHERE (blocker_id = a AND blocked_id = b) OR (blocker_id = b AND blocked_id = a)
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid, uuid) TO authenticated;

-- chats: drop the superseded open insert (policies are permissive-OR, so it would void the guard) —
-- "own chats" already covers own copies, "deliver to peer" covers recipient copies.
DROP POLICY IF EXISTS chats_deliver ON public.swivv_chats;
DROP POLICY IF EXISTS "deliver to peer" ON public.swivv_chats;
CREATE POLICY "deliver to peer" ON public.swivv_chats
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() <> user_id
    AND sender = 'them'
    AND peer_id = 'u:' || (auth.uid())::text
    AND NOT public.is_blocked(auth.uid(), user_id)
  );

-- likes: guard inserts only (USING untouched — unlike/unmatch dissolves must keep working while blocked).
DROP POLICY IF EXISTS swivv_likes_write_own ON public.swivv_likes;
CREATE POLICY swivv_likes_write_own ON public.swivv_likes FOR ALL TO authenticated
  USING (auth.uid() = liker_id OR public.staff_level() >= 10)
  WITH CHECK (auth.uid() = liker_id AND NOT public.is_blocked(auth.uid(), liked_id));

-- matches: inserts need both sides unblocked; deletes keep working.
DROP POLICY IF EXISTS swivv_matches_write_own ON public.swivv_matches;
CREATE POLICY swivv_matches_write_own ON public.swivv_matches FOR ALL TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b OR public.staff_level() >= 10)
  WITH CHECK ((auth.uid() = user_a OR auth.uid() = user_b) AND NOT public.is_blocked(user_a, user_b));

-- views: guard inserts only.
DROP POLICY IF EXISTS swivv_views_write_own ON public.swivv_profile_views;
CREATE POLICY swivv_views_write_own ON public.swivv_profile_views FOR ALL TO authenticated
  USING (auth.uid() = viewer_id OR public.staff_level() >= 10)
  WITH CHECK (auth.uid() = viewer_id AND NOT public.is_blocked(auth.uid(), viewed_id));

-- reactions: guard inserts only; reactor update/delete untouched.
DROP POLICY IF EXISTS swivv_photoreact_insert ON public.swivv_photo_reactions;
CREATE POLICY swivv_photoreact_insert ON public.swivv_photo_reactions
  FOR INSERT TO authenticated
  WITH CHECK (reactor_id = auth.uid() AND NOT public.is_blocked(auth.uid(), owner_id));
