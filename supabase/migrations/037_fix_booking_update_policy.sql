DROP POLICY IF EXISTS flight_booking_requests_update_own ON public.flight_booking_requests;

CREATE POLICY flight_booking_requests_update_own ON public.flight_booking_requests
  FOR UPDATE
  USING (auth.uid() = passenger_user_id)
  WITH CHECK (
    auth.uid() = passenger_user_id
    AND status IN ('pending', 'cancelled')
  );

CREATE OR REPLACE FUNCTION public.prevent_booking_immutable_fields ()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.flight_id IS DISTINCT FROM OLD.flight_id
    OR NEW.passenger_user_id IS DISTINCT FROM OLD.passenger_user_id THEN
    RAISE EXCEPTION 'flight_id and passenger_user_id are immutable';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_immutable_fields ON public.flight_booking_requests;

CREATE TRIGGER booking_immutable_fields
  BEFORE UPDATE ON public.flight_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_booking_immutable_fields ();
