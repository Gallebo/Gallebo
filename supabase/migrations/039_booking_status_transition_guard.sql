DROP POLICY IF EXISTS flight_booking_requests_update_own ON public.flight_booking_requests;

CREATE POLICY flight_booking_requests_update_own ON public.flight_booking_requests
  FOR UPDATE
  USING (auth.uid() = passenger_user_id)
  WITH CHECK (
    auth.uid() = passenger_user_id
    AND status = 'cancelled'
  );

CREATE OR REPLACE FUNCTION public.check_booking_status_transition ()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'cancelled' AND NEW.status = 'pending' THEN
    RAISE EXCEPTION 'Booking cannot be reactivated once cancelled';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_status_transition ON public.flight_booking_requests;

CREATE TRIGGER booking_status_transition
  BEFORE UPDATE OF status ON public.flight_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_status_transition ();
