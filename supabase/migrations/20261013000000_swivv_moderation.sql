-- Moderation workspace: content decisions log + configurable policies.
-- AI provider: none configured — see admin-moderation.ts aiAvailable().

CREATE TABLE IF NOT EXISTS public.swivv_mod_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_kind text NOT NULL CHECK (target_kind IN ('text', 'photo', 'message', 'account')),
  target_ref text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approve', 'reject', 'changes', 'remove', 'restrict', 'refer', 'dismiss')),
  reason text,
  reviewer uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS swivv_moddec_ref_idx ON public.swivv_mod_decisions (target_kind, target_ref);

CREATE TABLE IF NOT EXISTS public.swivv_mod_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  signals text[] NOT NULL DEFAULT '{}',
  severity text NOT NULL DEFAULT 'review' CHECK (severity IN ('review', 'restrict', 'ban')),
  action text NOT NULL DEFAULT 'review',
  auto_apply boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.swivv_mod_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swivv_mod_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY swivv_moddec_select ON public.swivv_mod_decisions
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_moddec_insert ON public.swivv_mod_decisions
  FOR INSERT TO authenticated WITH CHECK (public.staff_level() >= 50);
CREATE POLICY swivv_modpol_select ON public.swivv_mod_policies
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY swivv_modpol_write ON public.swivv_mod_policies
  FOR ALL TO authenticated USING (public.staff_level() >= 80)
  WITH CHECK (public.staff_level() >= 80);

INSERT INTO public.swivv_mod_policies (name, signals, severity, action) VALUES
  ('Liens externes', ARRAY['url', 'phone', 'handle'], 'review', 'review'),
  ('Spam commercial', ARRAY['url', 'spamwords'], 'review', 'remove'),
  ('Contenu haineux', ARRAY['hatewords'], 'ban', 'refer'),
  ('Nudité / sexuel explicite', ARRAY['manual'], 'restrict', 'remove')
ON CONFLICT (name) DO NOTHING;
