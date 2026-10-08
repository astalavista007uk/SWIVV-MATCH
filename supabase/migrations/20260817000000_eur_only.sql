-- France-first launch: EUR is the only supported currency.
-- Normalize column defaults and existing rows that were created with 'usd'/'USD'.

ALTER TABLE public.profiles      ALTER COLUMN currency SET DEFAULT 'eur';
ALTER TABLE public.bookings      ALTER COLUMN currency SET DEFAULT 'eur';
ALTER TABLE public.payments      ALTER COLUMN currency SET DEFAULT 'eur';
ALTER TABLE public.lost_pets     ALTER COLUMN reward_currency SET DEFAULT 'eur';
ALTER TABLE public.pet_listings  ALTER COLUMN currency SET DEFAULT 'EUR';

UPDATE public.profiles      SET currency = 'eur' WHERE lower(currency) <> 'eur';
UPDATE public.bookings      SET currency = 'eur' WHERE lower(currency) <> 'eur';
UPDATE public.payments      SET currency = 'eur' WHERE lower(currency) <> 'eur';
UPDATE public.lost_pets     SET reward_currency = 'eur' WHERE lower(reward_currency) <> 'eur';
UPDATE public.pet_listings  SET currency = 'EUR' WHERE currency <> 'EUR';
