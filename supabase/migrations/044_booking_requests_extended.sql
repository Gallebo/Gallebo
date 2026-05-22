ALTER TABLE public.flight_booking_requests
  ADD COLUMN IF NOT EXISTS pilot_responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS pilot_response_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkout_session_id text,
  ADD COLUMN IF NOT EXISTS payment_intent_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS passenger_amount_eur numeric(12, 2),
  ADD COLUMN IF NOT EXISTS pilot_payout_eur numeric(12, 2),
  ADD COLUMN IF NOT EXISTS platform_fee_eur numeric(12, 2),
  ADD COLUMN IF NOT EXISTS payout_after timestamptz,
  ADD COLUMN IF NOT EXISTS paid_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES public.profiles (id),
  ADD COLUMN IF NOT EXISTS refund_id text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- Default 48h pilot response window for new requests
CREATE OR REPLACE FUNCTION public.set_booking_pilot_response_expires ()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.pilot_response_expires_at IS NULL THEN
    NEW.pilot_response_expires_at := NEW.created_at + interval '48 hours';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_pilot_response_expires ON public.flight_booking_requests;

CREATE TRIGGER booking_pilot_response_expires
  BEFORE INSERT ON public.flight_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_pilot_response_expires ();

-- Backfill existing rows
UPDATE public.flight_booking_requests
SET pilot_response_expires_at = created_at + interval '48 hours'
WHERE pilot_response_expires_at IS NULL;
