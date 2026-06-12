-- Pilot flight cancel may fail on Stripe refund; lock prevents repeat attempts until admin resolves.

ALTER TABLE public.flights
  ADD COLUMN IF NOT EXISTS cancellation_locked_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS cancellation_lock_reason text NULL;

COMMENT ON COLUMN public.flights.cancellation_locked_at IS
  'Set when pilot flight cancel fails (e.g. Stripe refund). Blocks repeat cancel until admin resolves.';
