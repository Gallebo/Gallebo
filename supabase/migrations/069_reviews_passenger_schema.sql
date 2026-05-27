-- Phase 7: Blind two-way reviews (pilot reviews passenger)

CREATE TABLE public.passenger_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  booking_id uuid NOT NULL REFERENCES public.flight_booking_requests (id) ON DELETE CASCADE,
  pilot_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  passenger_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,

  accuracy_rating smallint NOT NULL,
  behavior_rating smallint NOT NULL,
  weight_accuracy_rating smallint NOT NULL,
  rating smallint NOT NULL,

  comment text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  is_visible boolean NOT NULL DEFAULT false,

  CONSTRAINT passenger_reviews_rating_chk CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT passenger_reviews_categories_chk CHECK (
    accuracy_rating >= 1 AND accuracy_rating <= 5
    AND behavior_rating >= 1 AND behavior_rating <= 5
    AND weight_accuracy_rating >= 1 AND weight_accuracy_rating <= 5
  ),
  CONSTRAINT passenger_reviews_no_self CHECK (pilot_user_id <> passenger_user_id),
  CONSTRAINT passenger_reviews_unique_booking UNIQUE (booking_id)
);

CREATE INDEX passenger_reviews_passenger_user_id_idx
  ON public.passenger_reviews (passenger_user_id);

CREATE INDEX passenger_reviews_pilot_user_id_idx
  ON public.passenger_reviews (pilot_user_id);

ALTER TABLE public.passenger_reviews ENABLE ROW LEVEL SECURITY;

-- Pilot inserts review for a completed booking they own (flight pilot).
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
        AND fl.pilot_user_id = pilot_user_id
        AND fl.status = 'completed'
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = pilot_user_id AND p.role = 'pilot' AND p.status = 'verified'
    )
  );

-- Only visible reviews are readable by participants.
DROP POLICY IF EXISTS passenger_reviews_select_visible_to_participants ON public.passenger_reviews;
CREATE POLICY passenger_reviews_select_visible_to_participants ON public.passenger_reviews
  FOR SELECT
  USING (
    public.is_admin()
    OR (
      is_visible = true
      AND (
        auth.uid() = passenger_user_id
        OR auth.uid() = pilot_user_id
      )
    )
  );

REVOKE SELECT ON TABLE public.passenger_reviews FROM anon;

GRANT INSERT ON public.passenger_reviews TO authenticated;
GRANT SELECT ON public.passenger_reviews TO authenticated;

