-- Atomic reveal + expired-review finalization (Phase 7 operational hardening)

CREATE OR REPLACE FUNCTION public.reveal_booking_reviews(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pilot_reviews
  SET is_visible = true
  WHERE booking_id = p_booking_id;

  UPDATE public.passenger_reviews
  SET is_visible = true
  WHERE booking_id = p_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_expired_booking_reviews(
  p_booking_id uuid,
  p_pilot_user_id uuid,
  p_passenger_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.flight_booking_requests fbr
    WHERE
      fbr.id = p_booking_id
      AND fbr.status = 'completed'
      AND fbr.review_deadline_at IS NOT NULL
      AND fbr.review_deadline_at <= v_now
      AND fbr.reviews_processed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'booking_not_eligible_for_review_finalization';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pilot_reviews WHERE booking_id = p_booking_id
  ) THEN
    INSERT INTO public.pilot_reviews (
      booking_id,
      pilot_user_id,
      reviewer_user_id,
      rating,
      communication_rating,
      accuracy_rating,
      experience_rating,
      comment,
      is_visible
    )
    VALUES (
      p_booking_id,
      p_pilot_user_id,
      p_passenger_user_id,
      5,
      5,
      5,
      5,
      NULL,
      true
    );
  ELSE
    UPDATE public.pilot_reviews
    SET is_visible = true
    WHERE booking_id = p_booking_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.passenger_reviews WHERE booking_id = p_booking_id
  ) THEN
    INSERT INTO public.passenger_reviews (
      booking_id,
      pilot_user_id,
      passenger_user_id,
      accuracy_rating,
      behavior_rating,
      weight_accuracy_rating,
      rating,
      comment,
      is_visible
    )
    VALUES (
      p_booking_id,
      p_pilot_user_id,
      p_passenger_user_id,
      5,
      5,
      5,
      5,
      NULL,
      true
    );
  ELSE
    UPDATE public.passenger_reviews
    SET is_visible = true
    WHERE booking_id = p_booking_id;
  END IF;

  UPDATE public.flight_booking_requests
  SET reviews_processed_at = v_now
  WHERE id = p_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reveal_booking_reviews(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_expired_booking_reviews(uuid, uuid, uuid) FROM PUBLIC;
