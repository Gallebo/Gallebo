CREATE TABLE public.flight_booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  flight_id uuid NOT NULL REFERENCES public.flights (id) ON DELETE CASCADE,
  passenger_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status flight_booking_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT flight_booking_requests_unique_passenger UNIQUE (flight_id, passenger_user_id)
);

CREATE INDEX flight_booking_requests_flight_id_idx ON public.flight_booking_requests (flight_id);

CREATE INDEX flight_booking_requests_passenger_idx ON public.flight_booking_requests (passenger_user_id);

ALTER TABLE public.flight_booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY flight_booking_requests_select ON public.flight_booking_requests
  FOR SELECT
  USING (
    auth.uid() = passenger_user_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.pilot_user_id = auth.uid()
    )
  );

CREATE POLICY flight_booking_requests_insert ON public.flight_booking_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = passenger_user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE
        p.id = passenger_user_id
        AND p.role = 'passenger'
        AND p.status = 'verified'
    )
    AND EXISTS (
      SELECT 1
      FROM public.flights f
      WHERE
        f.id = flight_id
        AND f.status = 'published'
        AND f.flight_date >= CURRENT_DATE
    )
  );

CREATE POLICY flight_booking_requests_update_own ON public.flight_booking_requests
  FOR UPDATE
  USING (auth.uid() = passenger_user_id)
  WITH CHECK (auth.uid() = passenger_user_id);
