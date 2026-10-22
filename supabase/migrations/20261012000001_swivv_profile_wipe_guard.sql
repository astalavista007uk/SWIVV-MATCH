-- Profile wipe guard: reject any UPDATE that empties a non-empty photo album AND
-- drops data fields at the same time (the stale-offline-overwrite signature — a full
-- album wipe plus lost keys is never a genuine edit). Pure album moderation (keys
-- intact) and ordinary field edits (photos intact) always pass; INSERTs, DELETEs
-- (account removal) and the verified:false key strip are untouched.
-- ponytail: signature-level, not value-level — a stale write that keeps every key and
-- photo still lands; per-field optimistic locking (rev column) if that ever matters.
CREATE OR REPLACE FUNCTION public.swivv_guard_profile_wipe() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  old_photos jsonb := COALESCE(OLD.data -> 'photos', '[]'::jsonb);
  new_photos jsonb := COALESCE(NEW.data -> 'photos', '[]'::jsonb);
  old_keys integer;
  new_keys integer;
BEGIN
  IF jsonb_typeof(OLD.data) <> 'object' OR jsonb_typeof(NEW.data) <> 'object' THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO old_keys FROM jsonb_object_keys(OLD.data);
  SELECT count(*) INTO new_keys FROM jsonb_object_keys(NEW.data);
  IF jsonb_typeof(old_photos) = 'array' AND jsonb_array_length(old_photos) > 0
     AND (jsonb_typeof(new_photos) <> 'array' OR jsonb_array_length(new_photos) = 0)
     AND new_keys < old_keys THEN
    RAISE EXCEPTION 'SWIVV_GUARD_PROFILE_WIPE';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS swivv_guard_profile_wipe ON public.swivv_profiles;
CREATE TRIGGER swivv_guard_profile_wipe BEFORE UPDATE ON public.swivv_profiles
FOR EACH ROW EXECUTE FUNCTION public.swivv_guard_profile_wipe();
