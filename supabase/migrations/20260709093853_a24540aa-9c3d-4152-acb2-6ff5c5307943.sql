
CREATE TABLE public.pet_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_listing_id text NOT NULL,
  pet_name text NOT NULL,
  seller_name text,
  listed_price_cents integer NOT NULL CHECK (listed_price_cents > 0),
  offer_amount_cents integer NOT NULL CHECK (offer_amount_cents > 0),
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.pet_offers TO authenticated;
GRANT SELECT ON public.pet_offers TO anon;
GRANT ALL ON public.pet_offers TO service_role;

ALTER TABLE public.pet_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own offers"
  ON public.pet_offers FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can insert their own offers"
  ON public.pet_offers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE TRIGGER update_pet_offers_updated_at
  BEFORE UPDATE ON public.pet_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Global daily count (rolling 24h), readable by everyone
CREATE OR REPLACE FUNCTION public.pet_offers_daily_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.pet_offers
  WHERE created_at > (now() - interval '24 hours');
$$;

GRANT EXECUTE ON FUNCTION public.pet_offers_daily_count() TO anon, authenticated;

-- Atomic create-offer that enforces the 30% floor and 20/24h global cap
CREATE OR REPLACE FUNCTION public.create_pet_offer(
  _pet_listing_id text,
  _pet_name text,
  _seller_name text,
  _listed_price_cents integer,
  _offer_amount_cents integer,
  _currency text DEFAULT 'EUR'
)
RETURNS public.pet_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _min integer;
  _count integer;
  _row public.pet_offers;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF _listed_price_cents <= 0 OR _offer_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  _min := ceil(_listed_price_cents * 0.70)::int;
  IF _offer_amount_cents < _min THEN
    RAISE EXCEPTION 'Offer below minimum (%.2f)', _min / 100.0
      USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*) INTO _count FROM public.pet_offers
   WHERE created_at > (now() - interval '24 hours');
  IF _count >= 20 THEN
    RAISE EXCEPTION 'Daily offer limit reached — please try again tomorrow'
      USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.pet_offers (
    buyer_id, pet_listing_id, pet_name, seller_name,
    listed_price_cents, offer_amount_cents, currency
  ) VALUES (
    _uid, _pet_listing_id, _pet_name, _seller_name,
    _listed_price_cents, _offer_amount_cents, COALESCE(_currency, 'EUR')
  )
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_pet_offer(text, text, text, integer, integer, text) TO authenticated;
