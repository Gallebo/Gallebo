-- Faza 8 fixes: tighten RLS, block direct UPDATE, extend/deactivate via SECURITY DEFINER RPC

DROP POLICY IF EXISTS flight_alerts_insert_own ON public.flight_alerts;
DROP POLICY IF EXISTS flight_alerts_update_own ON public.flight_alerts;

CREATE POLICY flight_alerts_insert_passenger ON public.flight_alerts
  FOR INSERT
  WITH CHECK (
    passenger_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'passenger'
    )
  );

REVOKE UPDATE ON public.flight_alerts FROM authenticated;

CREATE OR REPLACE FUNCTION public.extend_flight_alert(p_alert_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_expires_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT fa.expires_at
  INTO v_expires_at
  FROM public.flight_alerts fa
  WHERE fa.id = p_alert_id
    AND fa.passenger_user_id = v_user_id
    AND fa.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alert not found or inactive';
  END IF;

  UPDATE public.flight_alerts
  SET
    expires_at = GREATEST(now(), v_expires_at) + interval '15 days',
    expiry_notified = false,
    updated_at = now()
  WHERE id = p_alert_id
    AND passenger_user_id = v_user_id
    AND is_active = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_flight_alert(p_alert_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.flight_alerts
  SET
    is_active = false,
    updated_at = now()
  WHERE id = p_alert_id
    AND passenger_user_id = v_user_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alert not found or already inactive';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.extend_flight_alert(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_flight_alert(uuid) TO authenticated;
