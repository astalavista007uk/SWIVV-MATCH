ALTER TABLE public.profiles
  ADD COLUMN last_login TIMESTAMPTZ;

ALTER TABLE public.messages
  ADD COLUMN listing_type TEXT,
  ADD COLUMN listing_id UUID;

CREATE INDEX idx_messages_listing ON public.messages (listing_type, listing_id);
