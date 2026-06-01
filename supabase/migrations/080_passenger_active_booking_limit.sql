-- Max 3 active booking requests per passenger (pending, accepted, confirmed).

CREATE OR REPLACE FUNCTION public.is_active_booking_status (p_status public.flight_booking_status)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_status IN ('pending', 'accepted', 'confirmed');
$$;

CREATE OR REPLACE FUNCTION public.check_passenger_active_booking_limit ()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_active_count int;
BEGIN
  IF NOT public.is_active_booking_status (NEW.status) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF public.is_active_booking_status (OLD.status)
      AND NEW.status = OLD.status
      AND NEW.passenger_user_id = OLD.passenger_user_id THEN
      RETURN NEW;
    END IF;

    IF public.is_active_booking_status (OLD.status)
      AND NOT public.is_active_booking_status (NEW.status) THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT count(*)::int
  INTO v_active_count
  FROM public.flight_booking_requests b
  WHERE b.passenger_user_id = NEW.passenger_user_id
    AND public.is_active_booking_status (b.status)
    AND (TG_OP = 'INSERT' OR b.id <> OLD.id);

  IF v_active_count >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 active booking requests per passenger'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS passenger_active_booking_limit ON public.flight_booking_requests;

CREATE TRIGGER passenger_active_booking_limit
  BEFORE INSERT OR UPDATE OF status, passenger_user_id ON public.flight_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_passenger_active_booking_limit ();
