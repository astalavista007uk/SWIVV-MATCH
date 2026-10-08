ALTER TABLE public.profiles
ADD COLUMN service_categories JSONB NOT NULL DEFAULT '[]'::jsonb;
