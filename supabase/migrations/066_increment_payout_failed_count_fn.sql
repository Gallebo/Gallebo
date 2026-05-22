-- Atomic increment for payout_failed_count (process-payouts edge function only)

CREATE OR REPLACE FUNCTION public.increment_payout_failed_count(p_booking_id uuid)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.flight_booking_requests
  SET payout_failed_count = payout_failed_count + 1
  WHERE id = p_booking_id;
$$;

REVOKE ALL ON FUNCTION public.increment_payout_failed_count(uuid) FROM PUBLIC;
