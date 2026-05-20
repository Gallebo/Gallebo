CREATE OR REPLACE FUNCTION public.is_airfield_operator_for(p_airfield_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.airfields
    WHERE id = p_airfield_id
      AND operator_user_id = auth.uid()
  );
$$;

ALTER TABLE public.airfields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airfield_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airfield_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airfield_events ENABLE ROW LEVEL SECURITY;

-- airfields
CREATE POLICY airfields_select ON public.airfields
  FOR SELECT
  USING (true);

CREATE POLICY airfields_insert_admin ON public.airfields
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY airfields_update ON public.airfields
  FOR UPDATE
  USING (public.is_admin() OR operator_user_id = auth.uid())
  WITH CHECK (public.is_admin() OR operator_user_id = auth.uid());

CREATE POLICY airfields_delete_admin ON public.airfields
  FOR DELETE
  USING (public.is_admin());

-- airfield_photos
CREATE POLICY airfield_photos_select ON public.airfield_photos
  FOR SELECT
  USING (true);

CREATE POLICY airfield_photos_insert ON public.airfield_photos
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR public.is_airfield_operator_for(airfield_id)
  );

CREATE POLICY airfield_photos_update ON public.airfield_photos
  FOR UPDATE
  USING (
    public.is_admin()
    OR public.is_airfield_operator_for(airfield_id)
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_airfield_operator_for(airfield_id)
  );

CREATE POLICY airfield_photos_delete ON public.airfield_photos
  FOR DELETE
  USING (
    public.is_admin()
    OR public.is_airfield_operator_for(airfield_id)
  );

-- airfield_notices
CREATE POLICY airfield_notices_select ON public.airfield_notices
  FOR SELECT
  USING (true);

CREATE POLICY airfield_notices_insert ON public.airfield_notices
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR public.is_airfield_operator_for(airfield_id)
  );

CREATE POLICY airfield_notices_delete ON public.airfield_notices
  FOR DELETE
  USING (
    public.is_admin()
    OR public.is_airfield_operator_for(airfield_id)
  );

-- airfield_events
CREATE POLICY airfield_events_select ON public.airfield_events
  FOR SELECT
  USING (true);

CREATE POLICY airfield_events_insert ON public.airfield_events
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR public.is_airfield_operator_for(airfield_id)
  );

CREATE POLICY airfield_events_update ON public.airfield_events
  FOR UPDATE
  USING (
    public.is_admin()
    OR public.is_airfield_operator_for(airfield_id)
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_airfield_operator_for(airfield_id)
  );

CREATE POLICY airfield_events_delete ON public.airfield_events
  FOR DELETE
  USING (
    public.is_admin()
    OR public.is_airfield_operator_for(airfield_id)
  );
