CREATE OR REPLACE FUNCTION public.check_flight_booking_seats ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seats int;
  v_pending int;
BEGIN
  SELECT passenger_seats
  INTO v_seats
  FROM public.flights
  WHERE id = NEW.flight_id
  FOR UPDATE;

  SELECT count(*)::int
  INTO v_pending
  FROM public.flight_booking_requests
  WHERE flight_id = NEW.flight_id
    AND status = 'pending';

  IF v_pending >= v_seats THEN
    RAISE EXCEPTION 'No seats available on this flight';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER flight_booking_seat_limit
  BEFORE INSERT ON public.flight_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_flight_booking_seats ();
