-- Add display name/photo columns to messages so conversation lists
-- can show participant info without an extra profile lookup.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_display_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_display_photo TEXT,
  ADD COLUMN IF NOT EXISTS recipient_display_name TEXT,
  ADD COLUMN IF NOT EXISTS recipient_display_photo TEXT;
