CREATE TYPE flight_type AS ENUM ('panoramic', 'excursion', 'one_way');

CREATE TYPE flight_status AS ENUM ('draft', 'published', 'cancelled');

CREATE TYPE flight_language AS ENUM ('hr', 'en', 'it');

CREATE TYPE flight_booking_status AS ENUM ('pending', 'cancelled');

CREATE TABLE public.flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  pilot_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  flight_type flight_type NOT NULL,
  status flight_status NOT NULL DEFAULT 'draft',
  departure_airfield_id uuid NOT NULL REFERENCES public.airfields (id),
  arrival_airfield_id uuid NOT NULL REFERENCES public.airfields (id),
  flight_date date NOT NULL,
  departure_time time NOT NULL,
  total_cost_eur numeric(12, 2) NOT NULL,
  price_per_passenger_eur numeric(12, 2) NOT NULL,
  passenger_seats smallint NOT NULL,
  description text NOT NULL,
  communication_language flight_language NOT NULL DEFAULT 'en',
  return_note text,
  pilot_return_date date,
  aircraft_id uuid REFERENCES public.aircraft (id) ON DELETE SET NULL,
  rented_model text,
  rented_registration text,
  rented_seats smallint,
  route_avg_price_eur numeric(12, 2),
  price_deviation_flag boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT flights_passenger_seats_check CHECK (
    passenger_seats >= 1
    AND passenger_seats <= 5
  ),
  CONSTRAINT flights_total_cost_positive CHECK (total_cost_eur > 0),
  CONSTRAINT flights_aircraft_xor_rent CHECK (
    (
      aircraft_id IS NOT NULL
      AND rented_model IS NULL
      AND rented_registration IS NULL
      AND rented_seats IS NULL
    )
    OR (
      aircraft_id IS NULL
      AND rented_model IS NOT NULL
      AND rented_registration IS NOT NULL
      AND rented_seats IS NOT NULL
    )
  ),
  CONSTRAINT flights_rented_seats_check CHECK (
    rented_seats IS NULL
    OR (
      rented_seats >= 2
      AND rented_seats <= 6
    )
  )
);

CREATE INDEX flights_status_date_idx ON public.flights (status, flight_date);

CREATE INDEX flights_departure_airfield_idx ON public.flights (departure_airfield_id);

CREATE INDEX flights_arrival_airfield_idx ON public.flights (arrival_airfield_id);

CREATE INDEX flights_pilot_user_id_idx ON public.flights (pilot_user_id);

CREATE TRIGGER flights_updated_at
  BEFORE UPDATE ON public.flights
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at ();

ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY flights_select_published ON public.flights
  FOR SELECT
  USING (status = 'published' OR auth.uid() = pilot_user_id OR public.is_admin());

CREATE POLICY flights_insert_pilot ON public.flights
  FOR INSERT
  WITH CHECK (
    auth.uid() = pilot_user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE
        p.id = pilot_user_id
        AND p.role = 'pilot'
        AND p.status = 'verified'
    )
  );

CREATE POLICY flights_update_pilot ON public.flights
  FOR UPDATE
  USING (auth.uid() = pilot_user_id OR public.is_admin())
  WITH CHECK (auth.uid() = pilot_user_id OR public.is_admin());

CREATE POLICY flights_delete_pilot ON public.flights
  FOR DELETE
  USING (auth.uid() = pilot_user_id OR public.is_admin());
