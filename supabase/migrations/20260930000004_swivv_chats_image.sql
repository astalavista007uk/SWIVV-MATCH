-- SWIVV dating chats: image attachments between mutual matches (same pipeline as voice notes).
alter table public.swivv_chats add column if not exists image_url text;
