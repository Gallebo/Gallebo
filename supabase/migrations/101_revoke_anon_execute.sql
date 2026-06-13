-- Revoke EXECUTE from anon on 8 functions that should only be callable by authenticated users.
-- Pattern: REVOKE ALL FROM PUBLIC removes the default PostgreSQL grant;
--          REVOKE EXECUTE FROM anon removes Supabase explicit anon grants;
--          GRANT TO authenticated re-instates access for authenticated users only.
-- Functions 3 and 4 are already protected; statements below are idempotent.

-- 1. deactivate_flight_alert
REVOKE ALL ON FUNCTION public.deactivate_flight_alert(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deactivate_flight_alert(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.deactivate_flight_alert(uuid) TO authenticated;

-- 2. extend_flight_alert
REVOKE ALL ON FUNCTION public.extend_flight_alert(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.extend_flight_alert(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.extend_flight_alert(uuid) TO authenticated;

-- 3. update_airfield_as_operator (idempotent — already protected in 029)
REVOKE ALL ON FUNCTION public.update_airfield_as_operator(
  uuid, text, text, text, text,
  double precision, double precision,
  text, boolean, boolean, boolean, text, text
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_airfield_as_operator(
  uuid, text, text, text, text,
  double precision, double precision,
  text, boolean, boolean, boolean, text, text
) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_airfield_as_operator(
  uuid, text, text, text, text,
  double precision, double precision,
  text, boolean, boolean, boolean, text, text
) TO authenticated;

-- 4. swap_airfield_photo_order (idempotent — already protected in 029)
REVOKE ALL ON FUNCTION public.swap_airfield_photo_order(uuid, int, uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.swap_airfield_photo_order(uuid, int, uuid, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.swap_airfield_photo_order(uuid, int, uuid, int) TO authenticated;

-- 5. reveal_booking_reviews (was REVOKE FROM PUBLIC only; adds GRANT TO authenticated)
REVOKE ALL ON FUNCTION public.reveal_booking_reviews(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reveal_booking_reviews(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.reveal_booking_reviews(uuid) TO authenticated;

-- 6. finalize_expired_booking_reviews (was REVOKE FROM PUBLIC only; adds GRANT TO authenticated)
REVOKE ALL ON FUNCTION public.finalize_expired_booking_reviews(uuid, uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_expired_booking_reviews(uuid, uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.finalize_expired_booking_reviews(uuid, uuid, uuid) TO authenticated;

-- 7. flights_refresh_benchmark_on_publish (trigger function; no prior grants)
REVOKE ALL ON FUNCTION public.flights_refresh_benchmark_on_publish() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.flights_refresh_benchmark_on_publish() FROM anon;
GRANT EXECUTE ON FUNCTION public.flights_refresh_benchmark_on_publish() TO authenticated;

-- 8. refresh_route_price_benchmark (no prior grants)
REVOKE ALL ON FUNCTION public.refresh_route_price_benchmark(uuid, uuid, flight_type) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_route_price_benchmark(uuid, uuid, flight_type) FROM anon;
GRANT EXECUTE ON FUNCTION public.refresh_route_price_benchmark(uuid, uuid, flight_type) TO authenticated;
