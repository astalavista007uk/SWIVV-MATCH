-- 1) Clear removed gender values on existing rows
UPDATE public.profiles
SET gender = NULL
WHERE gender IN ('non_binary', 'prefer_not_to_say');

-- 2) Set default notification_prefs on the column so new rows default to all-on
ALTER TABLE public.profiles
  ALTER COLUMN notification_prefs SET DEFAULT jsonb_build_object(
    'new_messages', true,
    'new_feedback', true,
    'favourited_pets', true,
    'favourite_pet_sold', true,
    'new_followers', true,
    'new_pets', true,
    'new_providers', true
  );

-- 3) Update the new-user trigger to seed notification defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, user_type, notification_prefs)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'user_type')::public.user_type, 'owner'),
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
$function$;
