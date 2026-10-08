ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

CREATE INDEX IF NOT EXISTS services_lat_lng_idx ON public.services (latitude, longitude);