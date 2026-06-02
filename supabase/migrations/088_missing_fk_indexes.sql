-- Missing indexes on foreign key columns (Supabase linter / FK lookup performance).

CREATE INDEX IF NOT EXISTS idx_airfield_operator_requests_user_id
  ON public.airfield_operator_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_user_id
  ON public.chat_messages(sender_user_id);

CREATE INDEX IF NOT EXISTS idx_flight_booking_requests_cancelled_by
  ON public.flight_booking_requests(cancelled_by);

CREATE INDEX IF NOT EXISTS idx_flights_aircraft_id
  ON public.flights(aircraft_id);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_booking_id
  ON public.in_app_notifications(booking_id);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_flight_id
  ON public.in_app_notifications(flight_id);

CREATE INDEX IF NOT EXISTS idx_pilot_reviews_reviewer_user_id
  ON public.pilot_reviews(reviewer_user_id);

CREATE INDEX IF NOT EXISTS idx_route_price_benchmarks_arrival_airfield_id
  ON public.route_price_benchmarks(arrival_airfield_id);

CREATE INDEX IF NOT EXISTS idx_verification_requests_reviewed_by
  ON public.verification_requests(reviewed_by);
