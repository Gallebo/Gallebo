-- View for available_seats filter (security_invoker preserves RLS on underlying tables)
CREATE OR REPLACE VIEW public.flights_with_available_seats
  WITH (security_invoker = true)
AS
SELECT
  f.*,
  f.passenger_seats - COALESCE(
    (
      SELECT count(*)::int
      FROM public.flight_booking_requests b
      WHERE
        b.flight_id = f.id
        AND b.status = 'pending'
    ),
    0
  ) AS available_seats
FROM public.flights f;

GRANT SELECT ON public.flights_with_available_seats TO anon, authenticated;

-- Fix 3: RLS UPDATE must verify flight is published and in the future
DROP POLICY IF EXISTS flight_booking_requests_update_own ON public.flight_booking_requests;

CREATE POLICY flight_booking_requests_update_own ON public.flight_booking_requests
  FOR UPDATE
  USING (auth.uid() = passenger_user_id)
  WITH CHECK (
    auth.uid() = passenger_user_id
    AND status IN ('pending', 'cancelled')
    AND EXISTS (
      SELECT 1
      FROM public.flights fl
      WHERE
        fl.id = flight_id
        AND fl.status = 'published'
        AND fl.flight_date >= CURRENT_DATE
    )
  );

-- Fix 4: notification dead-letter columns
ALTER TABLE public.notification_queue
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz;

-- Cleanup orphaned function from migration 039 (trigger removed in 040)
DROP FUNCTION IF EXISTS public.check_booking_status_transition ();
