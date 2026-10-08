-- Drop the follows table and remove the new_followers notification preference.
-- The follow feature has been removed from the UI.

DROP TABLE IF EXISTS public.follows CASCADE;

-- Remove the 'new_followers' key from existing profiles' notification_prefs.
UPDATE public.profiles
SET notification_prefs = (notification_prefs - 'new_followers')
WHERE notification_prefs ? 'new_followers';
