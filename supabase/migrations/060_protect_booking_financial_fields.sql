-- Popravak 1: Zaštita financijskih polja bookinga od direktnog ažuriranja.
-- RLS pilot policy ne ograničava koje stupce pilot može mijenjati, pa ovaj
-- trigger blokira promjenu iznosa nakon što su jednom postavljeni.

CREATE OR REPLACE FUNCTION public.guard_booking_financial_fields ()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.passenger_amount_eur IS NOT NULL
    AND NEW.passenger_amount_eur IS DISTINCT FROM OLD.passenger_amount_eur
  THEN
    RAISE EXCEPTION 'Cannot modify passenger_amount_eur after it is set';
  END IF;

  IF OLD.pilot_payout_eur IS NOT NULL
    AND NEW.pilot_payout_eur IS DISTINCT FROM OLD.pilot_payout_eur
  THEN
    RAISE EXCEPTION 'Cannot modify pilot_payout_eur after it is set';
  END IF;

  IF OLD.platform_fee_eur IS NOT NULL
    AND NEW.platform_fee_eur IS DISTINCT FROM OLD.platform_fee_eur
  THEN
    RAISE EXCEPTION 'Cannot modify platform_fee_eur after it is set';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_booking_financial_fields ON public.flight_booking_requests;

CREATE TRIGGER guard_booking_financial_fields
  BEFORE UPDATE ON public.flight_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_booking_financial_fields ();
