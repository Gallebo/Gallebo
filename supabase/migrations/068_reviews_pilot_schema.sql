-- Phase 7: Blind two-way reviews (pilot receives passenger reviews)
-- Extends pilot_reviews with:
-- - booking binding (booking_id)
-- - category ratings (communication/accuracy/experience)
-- - blind reveal visibility flag (is_visible)
-- - updated public view + payout threshold gating

-- 1) Columns / constraints
ALTER TABLE public.pilot_reviews
  ADD COLUMN IF NOT EXISTS booking_id uuid;

ALTER TABLE public.pilot_reviews
  ADD COLUMN IF NOT EXISTS communication_rating smallint,
  ADD COLUMN IF NOT EXISTS accuracy_rating smallint,
  ADD COLUMN IF NOT EXISTS experience_rating smallint,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT false;

ALTER TABLE public.pilot_reviews
  ALTER COLUMN comment DROP NOT NULL;

-- Categories: allow NULL during transition; we backfill below for legacy rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pilot_reviews_communication_rating_chk'
  ) THEN
    ALTER TABLE public.pilot_reviews
      ADD CONSTRAINT pilot_reviews_communication_rating_chk
        CHECK (communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pilot_reviews_accuracy_rating_chk'
  ) THEN
    ALTER TABLE public.pilot_reviews
      ADD CONSTRAINT pilot_reviews_accuracy_rating_chk
        CHECK (accuracy_rating IS NULL OR (accuracy_rating >= 1 AND accuracy_rating <= 5));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pilot_reviews_experience_rating_chk'
  ) THEN
    ALTER TABLE public.pilot_reviews
      ADD CONSTRAINT pilot_reviews_experience_rating_chk
        CHECK (experience_rating IS NULL OR (experience_rating >= 1 AND experience_rating <= 5));
  END IF;
END $$;

-- One review per booking (pilot <-> passenger for a flight)
CREATE UNIQUE INDEX IF NOT EXISTS pilot_reviews_unique_booking_id
  ON public.pilot_reviews (booking_id)
  WHERE booking_id IS NOT NULL;

-- Remove the old uniqueness that prevented multiple flights between the same two users.
ALTER TABLE public.pilot_reviews
  DROP CONSTRAINT IF EXISTS pilot_reviews_unique_reviewer;

-- Bind to the booking id.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pilot_reviews_booking_id_fkey'
  ) THEN
    ALTER TABLE public.pilot_reviews
      ADD CONSTRAINT pilot_reviews_booking_id_fkey
        FOREIGN KEY (booking_id)
        REFERENCES public.flight_booking_requests (id)
        ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill legacy rows (pre-Phase-7 data):
-- - copy overall rating into category fields
-- - make them visible so existing pilots' public rating doesn't disappear
UPDATE public.pilot_reviews
SET
  communication_rating = COALESCE(communication_rating, rating),
  accuracy_rating = COALESCE(accuracy_rating, rating),
  experience_rating = COALESCE(experience_rating, rating),
  is_visible = CASE
    WHEN booking_id IS NULL THEN true
    ELSE is_visible
  END
WHERE booking_id IS NULL;

-- 2) RLS policies
ALTER TABLE public.pilot_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pilot_reviews_insert_auth ON public.pilot_reviews;
DROP POLICY IF EXISTS pilot_reviews_select_own_or_admin ON public.pilot_reviews;

-- Insert: passenger can only insert a review for a booking they own.
-- The pilot_user_id must match flights.pilot_user_id for the booking's flight.
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

-- Select: only show visible reviews.
CREATE POLICY pilot_reviews_select_visible_to_participants ON public.pilot_reviews
  FOR SELECT
  USING (
    public.is_admin()
    OR (
      is_visible = true
      AND (
        auth.uid() = reviewer_user_id
        OR auth.uid() = pilot_user_id
      )
    )
  );

REVOKE SELECT ON TABLE public.pilot_reviews FROM anon;

-- 3) Public view: only visible reviews + categories
DROP VIEW IF EXISTS public.pilot_reviews_public;

CREATE VIEW public.pilot_reviews_public
WITH (security_invoker = FALSE) AS
SELECT
  id,
  pilot_user_id,
  rating,
  communication_rating,
  accuracy_rating,
  experience_rating,
  comment,
  created_at
FROM
  public.pilot_reviews
WHERE
  is_visible = true;

GRANT SELECT ON public.pilot_reviews_public TO anon, authenticated;

-- 4) Threshold gating: only visible reviews should count
CREATE OR REPLACE FUNCTION public.pilot_payout_threshold_met (p_pilot_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*) >= 5
    AND coalesce(avg(rating), 0) >= 4.0
  FROM public.pilot_reviews
  WHERE pilot_user_id = p_pilot_user_id
    AND is_visible = true;
$$;

REVOKE ALL ON FUNCTION public.pilot_payout_threshold_met(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pilot_payout_threshold_met(uuid) TO authenticated;

