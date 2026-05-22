ALTER TYPE flight_status ADD VALUE IF NOT EXISTS 'completed';

ALTER TABLE public.flights
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE OR REPLACE FUNCTION public.pilot_payout_threshold_met (p_pilot_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*) >= 5
    AND coalesce(avg(rating), 0) >= 4.0
  FROM public.pilot_reviews
  WHERE pilot_user_id = p_pilot_user_id;
$$;

REVOKE ALL ON FUNCTION public.pilot_payout_threshold_met(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.pilot_payout_threshold_met(uuid) TO authenticated;
