CREATE TABLE public.route_price_benchmarks (
  departure_airfield_id uuid NOT NULL REFERENCES public.airfields (id) ON DELETE CASCADE,
  arrival_airfield_id uuid NOT NULL REFERENCES public.airfields (id) ON DELETE CASCADE,
  flight_type flight_type NOT NULL,
  sample_count int NOT NULL DEFAULT 0,
  avg_price_per_passenger_eur numeric(12, 2),
  updated_at timestamptz NOT NULL DEFAULT now (),
  PRIMARY KEY (departure_airfield_id, arrival_airfield_id, flight_type)
);

ALTER TABLE public.route_price_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY route_price_benchmarks_select ON public.route_price_benchmarks
  FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.refresh_route_price_benchmark (
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
  v_count int;
  v_avg numeric(12, 2);
BEGIN
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

CREATE OR REPLACE FUNCTION public.flights_refresh_benchmark_on_publish ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' THEN
    PERFORM public.refresh_route_price_benchmark (
      NEW.departure_airfield_id,
      NEW.arrival_airfield_id,
      NEW.flight_type
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'published' AND NEW.status IS DISTINCT FROM 'published' THEN
    PERFORM public.refresh_route_price_benchmark (
      OLD.departure_airfield_id,
      OLD.arrival_airfield_id,
      OLD.flight_type
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER flights_refresh_benchmark
  AFTER INSERT OR UPDATE OF status ON public.flights
  FOR EACH ROW
  EXECUTE FUNCTION public.flights_refresh_benchmark_on_publish ();
