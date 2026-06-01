-- Pilot dashboard: aggregate waiting passengers by alert route (counts only, no PII)

CREATE OR REPLACE FUNCTION public.top_waiting_alert_routes(p_limit int DEFAULT 5)
RETURNS TABLE (
  departure_airfield_id uuid,
  arrival_airfield_id uuid,
  departure_country text,
  arrival_country text,
  waiting_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fa.departure_airfield_id,
    fa.arrival_airfield_id,
    fa.departure_country,
    fa.arrival_country,
    count(DISTINCT fa.passenger_user_id)::bigint AS waiting_count
  FROM public.flight_alerts fa
  WHERE fa.is_active = true
    AND fa.expires_at > now()
  GROUP BY
    fa.departure_airfield_id,
    fa.arrival_airfield_id,
    fa.departure_country,
    fa.arrival_country
  ORDER BY waiting_count DESC
  LIMIT least(greatest(p_limit, 1), 50);
$$;

GRANT EXECUTE ON FUNCTION public.top_waiting_alert_routes(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.top_waiting_alert_routes(int) TO service_role;
