CREATE OR REPLACE FUNCTION public.count_pending_bookings(p_flight_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.flight_booking_requests b
  WHERE
    b.flight_id = p_flight_id
    AND b.status = 'pending';
$$;

REVOKE ALL ON FUNCTION public.count_pending_bookings(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.count_pending_bookings(uuid) TO anon, authenticated;

CREATE OR REPLACE VIEW public.flights_with_available_seats
  WITH (security_invoker = true)
AS
SELECT
  f.*,
  f.passenger_seats - public.count_pending_bookings(f.id) AS available_seats
FROM public.flights f;
