-- Cap payout retry attempts for completed bookings awaiting pilot payout

ALTER TABLE public.flight_booking_requests
  ADD COLUMN IF NOT EXISTS payout_failed_count integer NOT NULL DEFAULT 0;
