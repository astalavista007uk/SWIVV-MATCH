-- Add attachments column to messages for inline photos/images
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
