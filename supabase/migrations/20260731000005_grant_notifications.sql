-- Grant table privileges on notifications to authenticated/anon roles.
-- Without these grants, PostgREST rejects all client-side operations
-- even though RLS policies exist.
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated, anon;
