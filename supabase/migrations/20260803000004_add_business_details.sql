-- Add business detail fields to profiles for invoicing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS business_address TEXT;
