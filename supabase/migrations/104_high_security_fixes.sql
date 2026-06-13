-- HIGH security fixes (audit H3, H5)
-- H3: Block pilots from self-setting stripe_onboarding_complete / stripe_account_id
-- H5: refresh_route_price_benchmark — auth check for direct RPC callers

-- ---------------------------------------------------------------------------
-- H3: pilot_profiles UPDATE column guards
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_pilot_profiles_system_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF (SELECT public.is_admin()) THEN
    RETURN NEW;
  END IF;

  IF NEW.stripe_onboarding_complete IS DISTINCT FROM OLD.stripe_onboarding_complete THEN
    RAISE EXCEPTION 'permission_denied: cannot modify stripe_onboarding_complete';
  END IF;

  IF NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id THEN
    RAISE EXCEPTION 'permission_denied: cannot modify stripe_account_id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pilot_profiles_protect_system_columns ON public.pilot_profiles;

CREATE TRIGGER pilot_profiles_protect_system_columns
  BEFORE UPDATE ON public.pilot_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_pilot_profiles_system_columns();

-- ---------------------------------------------------------------------------
-- H5: refresh_route_price_benchmark — caller authorization
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.refresh_route_price_benchmark(
  p_departure uuid,
  p_arrival uuid,
  p_type flight_type
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_count int;
  v_avg numeric(12, 2);
BEGIN
  IF v_caller IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = v_caller AND role IN ('pilot', 'admin')
    ) THEN
      RAISE EXCEPTION 'permission_denied: only pilots and admins can refresh benchmarks';
    END IF;
  END IF;

  SELECT
    count(*)::int,
    avg(price_per_passenger_eur)
  INTO
    v_count,
    v_avg
  FROM public.flights
  WHERE
    status = 'published'
    AND departure_airfield_id = p_departure
    AND arrival_airfield_id = p_arrival
    AND flight_type = p_type;

  IF v_count = 0 THEN
    DELETE FROM public.route_price_benchmarks
    WHERE
      departure_airfield_id = p_departure
      AND arrival_airfield_id = p_arrival
      AND flight_type = p_type;
    RETURN;
  END IF;

  INSERT INTO public.route_price_benchmarks (
    departure_airfield_id,
    arrival_airfield_id,
    flight_type,
    sample_count,
    avg_price_per_passenger_eur,
    updated_at
  )
  VALUES (
    p_departure,
    p_arrival,
    p_type,
    v_count,
    v_avg,
    now()
  )
  ON CONFLICT (departure_airfield_id, arrival_airfield_id, flight_type) DO UPDATE
  SET
    sample_count = EXCLUDED.sample_count,
    avg_price_per_passenger_eur = EXCLUDED.avg_price_per_passenger_eur,
    updated_at = now();
END;
$$;
