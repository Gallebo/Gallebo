-- Critical security fixes (audit C1–C4)
-- C1: Block self-elevation via profiles UPDATE (role, status, id, created_at)
-- C2: Require payment_intent_id before booking status → confirmed
-- C3: reveal_booking_reviews — caller must be booking participant
-- C4: finalize_expired_booking_reviews — read participant IDs from DB, auth check

-- ---------------------------------------------------------------------------
-- C1: profiles UPDATE column guards
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_profiles_system_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT public.is_admin()) THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'permission_denied: cannot modify role';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'permission_denied: cannot modify status';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'permission_denied: cannot modify id';
  END IF;

  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'permission_denied: cannot modify created_at';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_system_columns ON public.profiles;

CREATE TRIGGER profiles_protect_system_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_system_columns();

DROP POLICY IF EXISTS profiles_update ON public.profiles;

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- ---------------------------------------------------------------------------
-- C2: Booking confirmed requires payment
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_booking_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF (OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected', 'expired', 'cancelled'))
  OR (OLD.status = 'accepted' AND NEW.status IN ('confirmed', 'expired', 'cancelled'))
  OR (OLD.status = 'confirmed' AND NEW.status IN ('completed', 'cancelled'))
  THEN
    IF NEW.status = 'confirmed' AND NEW.payment_intent_id IS NULL THEN
      RAISE EXCEPTION 'cannot_confirm_booking_without_payment';
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Invalid booking status transition: % → %', OLD.status, NEW.status;
END;
$$;

-- ---------------------------------------------------------------------------
-- C3: reveal_booking_reviews — participant auth check
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reveal_booking_reviews(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.flight_booking_requests fbr
      JOIN public.flights f ON f.id = fbr.flight_id
      WHERE
        fbr.id = p_booking_id
        AND (
          fbr.passenger_user_id = v_caller
          OR f.pilot_user_id = v_caller
        )
    ) THEN
      RAISE EXCEPTION 'not_authorized_for_this_booking';
    END IF;
  END IF;

  UPDATE public.pilot_reviews
  SET is_visible = true
  WHERE booking_id = p_booking_id;

  UPDATE public.passenger_reviews
  SET is_visible = true
  WHERE booking_id = p_booking_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- C4: finalize_expired_booking_reviews — DB-sourced IDs + auth check
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.finalize_expired_booking_reviews(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.finalize_expired_booking_reviews(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_caller uuid := auth.uid();
  v_pilot_user_id uuid;
  v_passenger_user_id uuid;
BEGIN
  SELECT f.pilot_user_id, fbr.passenger_user_id
  INTO v_pilot_user_id, v_passenger_user_id
  FROM public.flight_booking_requests fbr
  JOIN public.flights f ON f.id = fbr.flight_id
  WHERE fbr.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF v_caller IS NOT NULL
    AND v_caller <> v_pilot_user_id
    AND v_caller <> v_passenger_user_id
  THEN
    RAISE EXCEPTION 'not_authorized_for_this_booking';
  END IF;

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
      v_pilot_user_id,
      v_passenger_user_id,
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
      v_pilot_user_id,
      v_passenger_user_id,
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
REVOKE EXECUTE ON FUNCTION public.reveal_booking_reviews(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.reveal_booking_reviews(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.finalize_expired_booking_reviews(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_expired_booking_reviews(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.finalize_expired_booking_reviews(uuid) TO authenticated;
