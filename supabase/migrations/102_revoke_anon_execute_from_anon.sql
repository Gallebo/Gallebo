-- Supabase grants EXECUTE to anon explicitly on functions (not only via PUBLIC).
-- Migration 101 revoked PUBLIC; this migration revokes the explicit anon grants.

REVOKE EXECUTE ON FUNCTION public.deactivate_flight_alert(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.extend_flight_alert(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_airfield_as_operator(
  uuid, text, text, text, text,
  double precision, double precision,
  text, boolean, boolean, boolean, text, text
) FROM anon;
REVOKE EXECUTE ON FUNCTION public.swap_airfield_photo_order(uuid, int, uuid, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reveal_booking_reviews(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.finalize_expired_booking_reviews(uuid, uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.flights_refresh_benchmark_on_publish() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_route_price_benchmark(uuid, uuid, flight_type) FROM anon;
