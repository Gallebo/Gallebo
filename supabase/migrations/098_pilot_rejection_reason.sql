ALTER TABLE public.flight_booking_requests
  ADD COLUMN IF NOT EXISTS pilot_rejection_reason text;

COMMENT ON COLUMN public.flight_booking_requests.pilot_rejection_reason IS
  'Mandatory reason when pilot declines a pending booking request.';
