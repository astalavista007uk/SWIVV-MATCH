ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
-- phone column already exists per dashboard form; add only if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_country_code TEXT;