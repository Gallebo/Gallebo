-- Performance indexes for frequently filtered/sorted columns.
-- Note: CONCURRENTLY omitted — Supabase migrations run inside a transaction.

CREATE INDEX IF NOT EXISTS idx_flight_booking_requests_flight_status
  ON public.flight_booking_requests(flight_id, status);

CREATE INDEX IF NOT EXISTS idx_flights_created_at
  ON public.flights(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_flights_price_deviation_flag
  ON public.flights(price_deviation_flag)
  WHERE price_deviation_flag = true;
