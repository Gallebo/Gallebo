-- P2: Restrict direct UPDATE on airfields to admins; operators use SECURITY DEFINER RPC.
DROP POLICY IF EXISTS airfields_update ON public.airfields;

CREATE POLICY airfields_update ON public.airfields FOR UPDATE USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.update_airfield_as_operator (
  p_airfield_id uuid,
  p_name text,
  p_contact_email text,
  p_contact_phone text,
  p_working_hours text,
  p_latitude double precision,
  p_longitude double precision,
  p_country text,
  p_has_fuel boolean,
  p_has_hangar boolean,
  p_has_rental boolean,
  p_description text,
  p_destination_info text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.is_airfield_operator_for(p_airfield_id)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.airfields
  SET
    name = p_name,
    contact_email = p_contact_email,
    contact_phone = p_contact_phone,
    working_hours = p_working_hours,
    latitude = p_latitude,
    longitude = p_longitude,
    country = p_country,
    has_fuel = p_has_fuel,
    has_hangar = p_has_hangar,
    has_rental = p_has_rental,
    description = p_description,
    destination_info = p_destination_info
  WHERE id = p_airfield_id;
END;
$$;

-- P3: Atomically swap two photo rows' sort_order (same airfield, authorized operator/admin).
CREATE OR REPLACE FUNCTION public.swap_airfield_photo_order (
  p_id_a uuid,
  p_order_a int,
  p_id_b uuid,
  p_order_b int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_airfield_a uuid;
  v_airfield_b uuid;
BEGIN
  SELECT
    airfield_id INTO v_airfield_a
  FROM public.airfield_photos
  WHERE id = p_id_a;

  SELECT
    airfield_id INTO v_airfield_b
  FROM public.airfield_photos
  WHERE id = p_id_b;

  IF v_airfield_a IS NULL OR v_airfield_b IS NULL OR v_airfield_a <> v_airfield_b THEN
    RAISE EXCEPTION 'Invalid photo pair';
  END IF;

  IF NOT (public.is_admin() OR public.is_airfield_operator_for(v_airfield_a)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.airfield_photos
    SET sort_order = p_order_b
  WHERE id = p_id_a;

  UPDATE public.airfield_photos
    SET sort_order = p_order_a
  WHERE id = p_id_b;
END;
$$;

REVOKE ALL ON FUNCTION public.update_airfield_as_operator (uuid,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  boolean,
  boolean,
  boolean,
  text,
  text)
FROM PUBLIC;

REVOKE ALL ON FUNCTION public.swap_airfield_photo_order (uuid,
  int,
  uuid,
  int)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_airfield_as_operator (uuid,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  text,
  boolean,
  boolean,
  boolean,
  text,
  text)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.swap_airfield_photo_order (uuid,
  int,
  uuid,
  int)
TO authenticated;

-- TODO (Phase 4): tighten pilot_reviews so only passengers who flew with the pilot may review.
COMMENT ON TABLE public.pilot_reviews IS 'Reviews of pilots by other users (RLS Phase 4: restrict reviewer to verified passengers after a completed shared flight — see Phase 4 spec).';
