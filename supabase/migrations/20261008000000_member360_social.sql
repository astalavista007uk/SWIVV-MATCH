-- Member 360 social graph: server truth for likes/matches/blocks/views.
-- ponytail: real-user UUIDs only — seed/demo ids never leave the browser (client skips non-uuid targets), so admin counts stay honest; views are append-only history (repeat views power the timeline + 24h/7d/30d filters)
CREATE TABLE IF NOT EXISTS public.swivv_likes (
  liker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (liker_id, liked_id)
);

CREATE TABLE IF NOT EXISTS public.swivv_matches (
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  PRIMARY KEY (user_a, user_b)
);

CREATE TABLE IF NOT EXISTS public.swivv_blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS public.swivv_profile_views (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.swivv_likes TO authenticated;
GRANT SELECT, INSERT ON public.swivv_matches TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.swivv_blocks TO authenticated;
GRANT SELECT, INSERT ON public.swivv_profile_views TO authenticated;
GRANT ALL ON public.swivv_likes TO service_role;
GRANT ALL ON public.swivv_matches TO service_role;
GRANT ALL ON public.swivv_blocks TO service_role;
GRANT ALL ON public.swivv_profile_views TO service_role;

ALTER TABLE public.swivv_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_profile_views ENABLE ROW LEVEL SECURITY;

-- ponytail: own-write + any-staff-read (the member page itself is staff-gated; RLS is the backstop, not the UX gate) — tighten to staff_level() >= 50 if support ever loses member-page access
CREATE POLICY swivv_likes_write_own ON public.swivv_likes FOR ALL TO authenticated
  USING (auth.uid() = liker_id OR public.staff_level() >= 10)
  WITH CHECK (auth.uid() = liker_id);
CREATE POLICY swivv_matches_write_own ON public.swivv_matches FOR ALL TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b OR public.staff_level() >= 10)
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY swivv_blocks_write_own ON public.swivv_blocks FOR ALL TO authenticated
  USING (auth.uid() = blocker_id OR public.staff_level() >= 10)
  WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY swivv_views_write_own ON public.swivv_profile_views FOR ALL TO authenticated
  USING (auth.uid() = viewer_id OR public.staff_level() >= 10)
  WITH CHECK (auth.uid() = viewer_id);

CREATE INDEX IF NOT EXISTS idx_likes_liked ON public.swivv_likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_matches_b ON public.swivv_matches(user_b);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.swivv_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_views_viewed ON public.swivv_profile_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_views_at ON public.swivv_profile_views(created_at);
CREATE INDEX IF NOT EXISTS idx_likes_at ON public.swivv_likes(created_at);
