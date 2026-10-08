BEGIN;

UPDATE pet_listings
SET photo_url = SUBSTRING(photo_url FROM '/supabase-api/storage/.*$')
WHERE photo_url LIKE 'http%supabase-api%';

UPDATE pet_listings
SET description = (
  SELECT jsonb_set(
    description::jsonb,
    '{gallery}',
    jsonb_agg(
      CASE
        WHEN elem LIKE 'http%supabase-api%'
        THEN SUBSTRING(elem FROM '/supabase-api/storage/.*$')
        ELSE elem
      END
    )
  )::text
  FROM jsonb_array_elements_text(description::jsonb->'gallery') AS elem
)
WHERE description::jsonb ? 'gallery'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(description::jsonb->'gallery') AS e
    WHERE e LIKE 'http%supabase-api%'
  );

UPDATE services
SET photo_url = SUBSTRING(photo_url FROM '/supabase-api/storage/.*$')
WHERE photo_url LIKE 'http%supabase-api%';

UPDATE services
SET gallery = (
  SELECT jsonb_agg(
    CASE
      WHEN elem LIKE 'http%supabase-api%'
      THEN SUBSTRING(elem FROM '/supabase-api/storage/.*$')
      ELSE elem
    END
  )
  FROM jsonb_array_elements_text(gallery) AS elem
)
WHERE gallery IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(gallery) AS e
    WHERE e LIKE 'http%supabase-api%'
  );

UPDATE pets
SET photo_url = SUBSTRING(photo_url FROM '/supabase-api/storage/.*$')
WHERE photo_url LIKE 'http%supabase-api%';

UPDATE profiles
SET cover_url = SUBSTRING(cover_url FROM '/supabase-api/storage/.*$')
WHERE cover_url LIKE 'http%supabase-api%';

UPDATE profiles
SET avatar_url = SUBSTRING(avatar_url FROM '/supabase-api/storage/.*$')
WHERE avatar_url LIKE 'http%supabase-api%';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipient_display_photo') THEN
    UPDATE messages
    SET recipient_display_photo = SUBSTRING(recipient_display_photo FROM '/supabase-api/storage/.*$')
    WHERE recipient_display_photo LIKE 'http%supabase-api%';
  END IF;
END $$;

COMMIT;
