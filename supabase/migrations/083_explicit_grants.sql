-- Explicit table grants for Supabase default privilege changes (May 2025).
-- RLS policies remain the authorization layer; grants restore table-level access.

-- authenticated: full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pilot_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.airfield_operator_requests TO authenticated;
GRANT SELECT ON public.notification_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.airfields TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.airfield_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.airfield_notices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.airfield_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aircraft TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aircraft_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flight_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flight_publish_drafts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_price_benchmarks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flight_booking_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.in_app_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notification_settings TO authenticated;

-- anon: public read only
GRANT SELECT ON public.airfields TO anon;
GRANT SELECT ON public.airfield_photos TO anon;
GRANT SELECT ON public.airfield_notices TO anon;
GRANT SELECT ON public.airfield_events TO anon;
GRANT SELECT ON public.flights TO anon;
GRANT SELECT ON public.flight_photos TO anon;

-- Default privileges for future tables in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
