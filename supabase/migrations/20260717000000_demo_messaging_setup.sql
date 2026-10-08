-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto with schema public;

-- Table to map demo short IDs to auth user UUIDs
create table if not exists public.demo_short_ids (
  short_id text primary key,
  user_id uuid not null,
  created_at timestamptz not null default now()
);

-- allow authenticated users to read demo_short_ids (needed by server fn)
alter table public.demo_short_ids enable row level security;
create policy "Anyone can read demo_short_ids"
  on public.demo_short_ids for select
  using (true);

-- Function to create a demo auth user with a specified ID.
-- SECURITY: security defener — only callable via service_role.
create or replace function public.create_demo_auth_user(
  p_id uuid,
  p_email text,
  p_password text,
  p_name text
) returns void
language plpgsql
security definer
set search_path to public, extensions
as $func$
begin
  if not exists (select 1 from auth.users where id = p_id) then
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values (
      p_id,
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', p_name, 'is_demo', true)
    );

    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(),
      p_id,
      jsonb_build_object('sub', p_id::text, 'email', p_email),
      'email',
      p_email,
      now(),
      now(),
      now()
    );
  end if;
end;
$func$;
