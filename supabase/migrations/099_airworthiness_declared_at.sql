ALTER TABLE public.flights
  ADD COLUMN IF NOT EXISTS airworthiness_declared_at timestamptz;

COMMENT ON COLUMN public.flights.airworthiness_declared_at IS
  'UTC timestamp when the publishing pilot confirmed airworthiness, passenger insurance, and operating authorization.';
