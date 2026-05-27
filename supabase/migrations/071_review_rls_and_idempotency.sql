-- Phase 7 fixes: review deadline RLS guards + cron idempotency flag

ALTER TABLE public.flight_booking_requests
  ADD COLUMN IF NOT EXISTS reviews_processed_at timestamptz;

CREATE INDEX IF NOT EXISTS flight_booking_requests_reviews_processed_at_idx
  ON public.flight_booking_requests (reviews_processed_at)
  WHERE reviews_processed_at IS NULL;

-- pilot_reviews: enforce active review window on INSERT
DROP POLICY IF EXISTS pilot_reviews_insert_auth ON public.pilot_reviews;

CREATE POLICY pilot_reviews_insert_auth ON public.pilot_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_user_id
    AND pilot_user_id <> auth.uid()
    AND booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.flight_booking_requests fbr
      JOIN public.flights fl ON fl.id = fbr.flight_id
      WHERE
        fbr.id = booking_id
        AND fbr.passenger_user_id = reviewer_user_id
        AND fbr.status = 'completed'
        AND fbr.review_deadline_at IS NOT NULL
        AND fbr.review_deadline_at > now()
        AND fl.pilot_user_id = pilot_user_id
        AND fl.status = 'completed'
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE
        p.id = pilot_user_id
        AND p.role = 'pilot'
        AND p.status = 'verified'
    )
  );

-- passenger_reviews: enforce active review window on INSERT
DROP POLICY IF EXISTS passenger_reviews_insert_auth ON public.passenger_reviews;

CREATE POLICY passenger_reviews_insert_auth ON public.passenger_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = pilot_user_id
    AND passenger_user_id <> auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.flight_booking_requests fbr
      JOIN public.flights fl ON fl.id = fbr.flight_id
      WHERE
        fbr.id = booking_id
        AND fbr.passenger_user_id = passenger_user_id
        AND fbr.status = 'completed'
        AND fbr.review_deadline_at IS NOT NULL
        AND fbr.review_deadline_at > now()
        AND fl.pilot_user_id = pilot_user_id
        AND fl.status = 'completed'
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = pilot_user_id AND p.role = 'pilot' AND p.status = 'verified'
    )
  );
