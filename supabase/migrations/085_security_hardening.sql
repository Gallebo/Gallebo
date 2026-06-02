-- Security hardening: legacy IBAN revoke, search_path on triggers, storage SELECT policies.

-- 1) Revoke EXECUTE on legacy IBAN functions from anon (Stripe Express is the active path).
REVOKE EXECUTE ON FUNCTION public.store_pilot_iban(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_pilot_iban(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_pilot_iban_for_payout(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_pilot_iban_last_four() FROM anon;

-- 2) Pin search_path on trigger/helper functions (mutable search_path advisory).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_notification_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.user_id != OLD.user_id
     OR NEW.type != OLD.type
     OR NEW.title != OLD.title
     OR NEW.body != OLD.body
     OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
     OR NEW.flight_id IS DISTINCT FROM OLD.flight_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Only read_at can be updated on in_app_notifications';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_active_booking_status (p_status public.flight_booking_status)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT p_status IN ('pending', 'accepted', 'confirmed');
$$;

CREATE OR REPLACE FUNCTION public.check_passenger_active_booking_limit ()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_active_count int;
BEGIN
  IF NOT public.is_active_booking_status (NEW.status) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF public.is_active_booking_status (OLD.status)
      AND NEW.status = OLD.status
      AND NEW.passenger_user_id = OLD.passenger_user_id THEN
      RETURN NEW;
    END IF;

    IF public.is_active_booking_status (OLD.status)
      AND NOT public.is_active_booking_status (NEW.status) THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT count(*)::int
  INTO v_active_count
  FROM public.flight_booking_requests b
  WHERE b.passenger_user_id = NEW.passenger_user_id
    AND public.is_active_booking_status (b.status)
    AND (TG_OP = 'INSERT' OR b.id <> OLD.id);

  IF v_active_count >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 active booking requests per passenger'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.deny_ledger_mutation ()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.booking_id IS NOT NULL
     AND NEW.booking_id IS NULL
     AND (to_jsonb(NEW) - 'booking_id') IS NOT DISTINCT FROM (to_jsonb(OLD) - 'booking_id')
  THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'ledger rows are immutable';
END;
$$;

-- 3) Restrict storage SELECT to registered metadata paths (blocks orphan bucket enumeration).
DROP POLICY IF EXISTS storage_aircraft_photos_select ON storage.objects;
CREATE POLICY storage_aircraft_photos_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'aircraft-photos'
    AND EXISTS (
      SELECT 1 FROM public.aircraft_photos ap
      WHERE ap.storage_path = name
    )
  );

DROP POLICY IF EXISTS storage_profile_photos_select ON storage.objects;
CREATE POLICY storage_profile_photos_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'profile-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.avatar_path = name
        AND (
          p.id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles_public pp WHERE pp.id = p.id)
        )
    )
  );

DROP POLICY IF EXISTS storage_airfield_photos_select ON storage.objects;
CREATE POLICY storage_airfield_photos_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'airfield-photos'
    AND EXISTS (
      SELECT 1 FROM public.airfield_photos ap
      WHERE ap.storage_path = name
    )
  );

DROP POLICY IF EXISTS storage_flight_photos_select ON storage.objects;
CREATE POLICY storage_flight_photos_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'flight-photos'
    AND (
      EXISTS (
        SELECT 1
        FROM public.flight_photos fp
        INNER JOIN public.flights f ON f.id = fp.flight_id
        WHERE fp.storage_path = name
          AND (
            f.status = 'published'
            OR f.pilot_user_id = auth.uid()
            OR public.is_admin()
          )
      )
      OR (
        auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND (storage.foldername(name))[2] = 'draft'
      )
    )
  );

-- MANUAL (Supabase Dashboard, not SQL):
-- Authentication → Settings → Password Security
-- Enable "Leaked Password Protection"
