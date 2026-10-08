-- Enable Supabase Realtime on messages and notifications tables.
-- Without this, all client-side postgres_changes subscriptions on these
-- tables silently do nothing — badges/counts only update on page refresh.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
