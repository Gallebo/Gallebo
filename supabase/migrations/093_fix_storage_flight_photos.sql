-- Flight photo publish (move/upload/remove) uses service role in app code.
-- See publishFlightAction in lib/flights/actions.ts (adminSupabase.storage).
-- Storage RLS policies are unchanged; ownership is enforced on flights / flight_photos.

SELECT 1;
