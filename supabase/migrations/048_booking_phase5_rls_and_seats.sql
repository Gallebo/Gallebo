-- Reserved seats: pending, accepted, confirmed (not yet completed flight)
CREATE OR REPLACE FUNCTION public.count_reserved_bookings (p_flight_id uuid)
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
    AND b.status IN ('pending', 'accepted', 'confirmed');
$$;

REVOKE ALL ON FUNCTION public.count_reserved_bookings(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.count_reserved_bookings(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.count_pending_bookings (p_flight_id uuid)
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

DROP VIEW IF EXISTS public.flights_with_available_seats CASCADE;

CREATE VIEW public.flights_with_available_seats
  WITH (security_invoker = true)
AS
SELECT
  f.*,
  f.passenger_seats - public.count_reserved_bookings(f.id) AS available_seats
FROM public.flights f;

GRANT SELECT ON public.flights_with_available_seats TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_flight_booking_seats ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seats int;
  v_reserved int;
BEGIN
  IF TG_OP = 'UPDATE' AND NOT (OLD.status = 'cancelled' AND NEW.status = 'pending') THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('pending') THEN
    RETURN NEW;
  END IF;

  SELECT passenger_seats
  INTO v_seats
  FROM public.flights
  WHERE id = NEW.flight_id
  FOR UPDATE;

  SELECT public.count_reserved_bookings(NEW.flight_id)
  INTO v_reserved;

  IF v_reserved >= v_seats THEN
    RAISE EXCEPTION 'No seats available on this flight';
  END IF;

  RETURN NEW;
END;
$$;

-- Pilot can accept/reject pending bookings on their flights
DROP POLICY IF EXISTS flight_booking_requests_update_pilot ON public.flight_booking_requests;

CREATE POLICY flight_booking_requests_update_pilot ON public.flight_booking_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = auth.uid()
    )
  );

-- Passenger cancel: pending, accepted (unpaid), confirmed (paid — refund via app)
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
    RETURN NEW;
  END IF;

  IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
    RAISE EXCEPTION 'Booking cannot be reactivated once cancelled';
  END IF;

  IF OLD.status IN ('rejected', 'expired', 'completed') AND NEW.status != OLD.status THEN
    RAISE EXCEPTION 'Booking status is final';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_status_transition ON public.flight_booking_requests;

CREATE TRIGGER booking_status_transition
  BEFORE UPDATE OF status ON public.flight_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_status_transition ();

-- Service role helper to read pilot IBAN for payouts (edge function)
CREATE OR REPLACE FUNCTION public.get_pilot_iban_for_payout (p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id uuid;
  v_iban text;
BEGIN
  SELECT iban_vault_secret_id
  INTO v_secret_id
  FROM public.pilot_profiles
  WHERE user_id = p_user_id;

  IF v_secret_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret
  INTO v_iban
  FROM vault.decrypted_secrets
  WHERE id = v_secret_id;

  RETURN v_iban;
END;
$$;

REVOKE ALL ON FUNCTION public.get_pilot_iban_for_payout(uuid) FROM PUBLIC;
