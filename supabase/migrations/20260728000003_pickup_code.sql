-- Add pickup_code column
ALTER TABLE public.pet_offers ADD COLUMN IF NOT EXISTS pickup_code text;

-- RPC: Seller generates a 4-digit pickup code
CREATE OR REPLACE FUNCTION public.generate_pickup_code(_offer_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  _uid uuid := auth.uid();
  _code text;
  _offer public.pet_offers;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO _offer FROM public.pet_offers WHERE id = _offer_id;
  IF _offer IS NULL THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = '42704';
  END IF;

  IF _offer.seller_id != _uid THEN
    RAISE EXCEPTION 'Only the seller can generate a pickup code' USING ERRCODE = '42501';
  END IF;

  IF _offer.status NOT IN ('accepted', 'in_escrow') THEN
    RAISE EXCEPTION 'Pickup code can only be generated for accepted or in-escrow orders' USING ERRCODE = '22023';
  END IF;

  -- Generate random 4-digit code
  _code := lpad((floor(random() * 10000))::text, 4, '0');

  UPDATE public.pet_offers SET pickup_code = _code, updated_at = now() WHERE id = _offer_id;

  RETURN _code;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.generate_pickup_code(uuid) TO authenticated;

-- Update confirm_pet_received to verify pickup code
CREATE OR REPLACE FUNCTION public.confirm_pet_received(_offer_id uuid, _pickup_code text DEFAULT NULL)
RETURNS public.pet_offers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  _uid uuid := auth.uid();
  _row public.pet_offers;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO _row FROM public.pet_offers WHERE id = _offer_id AND buyer_id = _uid;

  IF _row IS NULL THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = '42704';
  END IF;

  IF _row.status NOT IN ('in_escrow', 'accepted') THEN
    RAISE EXCEPTION 'Cannot confirm in this state' USING ERRCODE = '22023';
  END IF;

  -- Verify pickup code if one has been generated
  IF _row.pickup_code IS NOT NULL THEN
    IF _pickup_code IS NULL OR _pickup_code != _row.pickup_code THEN
      RAISE EXCEPTION 'Invalid pickup code' USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.pet_offers
     SET status = 'completed',
         confirmed_by_buyer_at = now(),
         pickup_code = NULL,
         updated_at = now()
   WHERE id = _offer_id
  RETURNING * INTO _row;

  UPDATE public.pet_listings
     SET status = 'sold', updated_at = now()
   WHERE id::text = _row.pet_listing_id AND status = 'active';

  RETURN _row;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.confirm_pet_received(uuid, text) TO authenticated;
