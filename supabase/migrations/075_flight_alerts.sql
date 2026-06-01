-- Phase 8: Flight alerts — passengers get notified when matching flights are published

CREATE TABLE public.flight_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  departure_airfield_id uuid REFERENCES public.airfields (id) ON DELETE SET NULL,
  departure_country text,
  arrival_airfield_id uuid REFERENCES public.airfields (id) ON DELETE SET NULL,
  arrival_country text,
  date_from date NOT NULL,
  date_to date NOT NULL,
  flight_type public.flight_type,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 days'),
  expiry_notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT flight_alerts_departure_location_check CHECK (
    departure_airfield_id IS NOT NULL
    OR departure_country IS NOT NULL
  ),
  CONSTRAINT flight_alerts_arrival_location_check CHECK (
    arrival_airfield_id IS NOT NULL
    OR arrival_country IS NOT NULL
  ),
  CONSTRAINT flight_alerts_date_range_check CHECK (date_to >= date_from)
);

CREATE INDEX flight_alerts_passenger_active_idx
  ON public.flight_alerts (passenger_user_id)
  WHERE is_active = true;

CREATE INDEX flight_alerts_expires_at_idx
  ON public.flight_alerts (expires_at)
  WHERE is_active = true;

CREATE INDEX flight_alerts_departure_airfield_idx
  ON public.flight_alerts (departure_airfield_id)
  WHERE is_active = true;

CREATE INDEX flight_alerts_arrival_airfield_idx
  ON public.flight_alerts (arrival_airfield_id)
  WHERE is_active = true;

CREATE INDEX flight_alerts_departure_country_idx
  ON public.flight_alerts (departure_country)
  WHERE is_active = true;

CREATE INDEX flight_alerts_arrival_country_idx
  ON public.flight_alerts (arrival_country)
  WHERE is_active = true;

CREATE TRIGGER flight_alerts_updated_at
  BEFORE UPDATE ON public.flight_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.flight_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY flight_alerts_select_own ON public.flight_alerts
  FOR SELECT
  USING (passenger_user_id = auth.uid() OR public.is_admin());

CREATE POLICY flight_alerts_insert_own ON public.flight_alerts
  FOR INSERT
  WITH CHECK (passenger_user_id = auth.uid());

CREATE POLICY flight_alerts_update_own ON public.flight_alerts
  FOR UPDATE
  USING (passenger_user_id = auth.uid())
  WITH CHECK (passenger_user_id = auth.uid());

CREATE POLICY flight_alerts_delete_own ON public.flight_alerts
  FOR DELETE
  USING (passenger_user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flight_alerts TO authenticated;

-- Returns passengers to notify when a flight is published
CREATE OR REPLACE FUNCTION public.match_alerts_for_flight(p_flight_id uuid)
RETURNS TABLE (
  passenger_user_id uuid,
  alert_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fa.passenger_user_id, fa.id AS alert_id
  FROM public.flight_alerts fa
  INNER JOIN public.flights f ON f.id = p_flight_id
  INNER JOIN public.airfields dep_af ON dep_af.id = f.departure_airfield_id
  INNER JOIN public.airfields arr_af ON arr_af.id = f.arrival_airfield_id
  WHERE fa.is_active = true
    AND fa.expires_at > now()
    AND (
      fa.departure_airfield_id = f.departure_airfield_id
      OR fa.departure_country = dep_af.country
    )
    AND (
      fa.arrival_airfield_id = f.arrival_airfield_id
      OR fa.arrival_country = arr_af.country
    )
    AND f.flight_date >= fa.date_from
    AND f.flight_date <= fa.date_to
    AND (
      fa.flight_type IS NULL
      OR fa.flight_type = f.flight_type
    );
$$;

GRANT EXECUTE ON FUNCTION public.match_alerts_for_flight(uuid) TO service_role;

-- Count distinct passengers waiting on a route (for pilot publish hint)
CREATE OR REPLACE FUNCTION public.count_waiting_passengers_for_route(
  p_departure uuid,
  p_arrival uuid,
  p_date date,
  p_flight_type text DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(DISTINCT fa.passenger_user_id)::bigint
  FROM public.flight_alerts fa
  INNER JOIN public.airfields dep_af ON dep_af.id = p_departure
  INNER JOIN public.airfields arr_af ON arr_af.id = p_arrival
  WHERE fa.is_active = true
    AND fa.expires_at > now()
    AND (
      fa.departure_airfield_id = p_departure
      OR fa.departure_country = dep_af.country
    )
    AND (
      fa.arrival_airfield_id = p_arrival
      OR fa.arrival_country = arr_af.country
    )
    AND p_date >= fa.date_from
    AND p_date <= fa.date_to
    AND (
      fa.flight_type IS NULL
      OR p_flight_type IS NULL
      OR fa.flight_type::text = p_flight_type
    );
$$;

GRANT EXECUTE ON FUNCTION public.count_waiting_passengers_for_route(uuid, uuid, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_waiting_passengers_for_route(uuid, uuid, date, text) TO service_role;

-- Daily cron: expiry warnings + deactivate expired alerts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-alert-expiry') THEN
    PERFORM cron.unschedule('process-alert-expiry');
  END IF;
END $$;

SELECT cron.schedule(
  'process-alert-expiry',
  '0 7 * * *',
  $$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'supabase_url'
        LIMIT 1
      ) || '/functions/v1/process-alert-expiry',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'cron_secret'
          LIMIT 1
        )
      ),
      body := '{}'::jsonb
    );
  $$
);
