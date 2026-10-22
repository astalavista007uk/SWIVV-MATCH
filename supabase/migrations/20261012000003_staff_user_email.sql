-- Staff-only auth e-mail lookup for the admin member sheet (e-mails live in
-- auth.users, unreachable from PostgREST/RLS). Gate lives inside the function so
-- the address never leaks through grants; moderator+ (50).
-- ponytail: single-address RPC, not a view — a view over auth.users would expose the
-- table to every grant; bulk export if staff ever needs lists.
CREATE OR REPLACE FUNCTION public.staff_user_email(target_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE em text;
BEGIN
  IF public.staff_level() < 50 THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT u.email INTO em FROM auth.users u WHERE u.id = target_id;
  RETURN em;
END; $$;
REVOKE ALL ON FUNCTION public.staff_user_email(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_user_email(uuid) TO authenticated;
