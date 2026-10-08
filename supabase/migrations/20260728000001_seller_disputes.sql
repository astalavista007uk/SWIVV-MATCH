-- Allow sellers to open disputes too (not just buyers)
CREATE OR REPLACE FUNCTION public.open_pet_dispute(
  _offer_id uuid,
  _reason text,
  _evidence_urls jsonb DEFAULT '[]'::jsonb
)
RETURNS public.pet_disputes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  _uid uuid := auth.uid();
  _offer public.pet_offers;
  _dispute public.pet_disputes;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO _offer FROM public.pet_offers WHERE id = _offer_id;
  IF _offer IS NULL THEN
    RAISE EXCEPTION 'Offer not found' USING ERRCODE = '42704';
  END IF;

  IF NOT (_offer.buyer_id = _uid OR _offer.seller_id = _uid) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF _offer.status NOT IN ('in_escrow','completed','disputed') THEN
    RAISE EXCEPTION 'Cannot dispute an order in this state' USING ERRCODE = '22023';
  END IF;

  IF _offer.status != 'disputed' THEN
    UPDATE public.pet_offers SET status = 'disputed', updated_at = now() WHERE id = _offer_id;
  END IF;

  SELECT * INTO _dispute FROM public.pet_disputes WHERE pet_order_id = _offer_id AND status = 'open' LIMIT 1;
  IF _dispute IS NOT NULL THEN
    RAISE EXCEPTION 'A dispute is already open for this order' USING ERRCODE = '42704';
  END IF;

  INSERT INTO public.pet_disputes (pet_order_id, buyer_id, seller_id, reason, evidence_urls)
  VALUES (_offer_id, _offer.buyer_id, _offer.seller_id, _reason, COALESCE(_evidence_urls, '[]'::jsonb))
  RETURNING * INTO _dispute;

  RETURN _dispute;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.open_pet_dispute(uuid, text, jsonb) TO authenticated;
