-- Phase 7: public read of visible passenger reviews + own-row SELECT during blind period

DROP VIEW IF EXISTS public.passenger_reviews_public;

CREATE VIEW public.passenger_reviews_public
WITH (security_invoker = FALSE) AS
SELECT
  id,
  booking_id,
  pilot_user_id,
  passenger_user_id,
  rating,
  accuracy_rating,
  behavior_rating,
  weight_accuracy_rating,
  comment,
  submitted_at
FROM public.passenger_reviews
WHERE is_visible = true;

GRANT SELECT ON public.passenger_reviews_public TO authenticated;

-- Participants can read their own submission before reveal; others only when visible.
DROP POLICY IF EXISTS pilot_reviews_select_visible_to_participants ON public.pilot_reviews;

CREATE POLICY pilot_reviews_select_visible_to_participants ON public.pilot_reviews
  FOR SELECT
  USING (
    public.is_admin()
    OR auth.uid() = reviewer_user_id
    OR (
      is_visible = true
      AND auth.uid() = pilot_user_id
    )
  );

DROP POLICY IF EXISTS passenger_reviews_select_visible_to_participants ON public.passenger_reviews;

CREATE POLICY passenger_reviews_select_visible_to_participants ON public.passenger_reviews
  FOR SELECT
  USING (
    public.is_admin()
    OR auth.uid() = pilot_user_id
    OR (
      is_visible = true
      AND auth.uid() = passenger_user_id
    )
  );
