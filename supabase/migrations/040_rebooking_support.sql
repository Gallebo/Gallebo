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
  IF TG_OP = 'UPDATE' AND NOT (OLD.status = 'cancelled' AND NEW.status = 'pending') THEN
    RETURN NEW;
  END IF;

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

DROP TRIGGER IF EXISTS flight_booking_seat_limit ON public.flight_booking_requests;

CREATE TRIGGER flight_booking_seat_limit
  BEFORE INSERT OR UPDATE ON public.flight_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_flight_booking_seats ();

DROP POLICY IF EXISTS flight_booking_requests_update_own ON public.flight_booking_requests;

CREATE POLICY flight_booking_requests_update_own ON public.flight_booking_requests
  FOR UPDATE
  USING (auth.uid() = passenger_user_id)
  WITH CHECK (
    auth.uid() = passenger_user_id
    AND status IN ('pending', 'cancelled')
  );

DROP TRIGGER IF EXISTS booking_status_transition ON public.flight_booking_requests;
