-- Populate service_categories from signup metadata so the profile is complete
-- before the user confirms their email (when there is no client session yet).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, user_type, service_categories, notification_prefs)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'user_type')::public.user_type, 'owner'),
    COALESCE(NEW.raw_user_meta_data -> 'service_categories', '[]'::jsonb),
    jsonb_build_object(
      'new_messages', true,
      'new_feedback', true,
      'favourited_pets', true,
      'favourite_pet_sold', true,
      'new_followers', true,
      'new_pets', true,
      'new_providers', true
    )
  );
  RETURN NEW;
END;
$$;
