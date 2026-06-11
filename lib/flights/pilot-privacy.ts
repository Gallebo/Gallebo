import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export async function getConfirmedBookingFlightIds(
  supabase: DbClient,
  passengerUserId: string,
  flightIds: string[],
): Promise<Set<string>> {
  if (flightIds.length === 0) return new Set();

  const { data } = await supabase
    .from("flight_booking_requests")
    .select("flight_id")
    .eq("passenger_user_id", passengerUserId)
    .eq("status", "confirmed")
    .in("flight_id", flightIds);

  return new Set((data ?? []).map((row) => row.flight_id));
}

export async function hasConfirmedBookingForFlight(
  supabase: DbClient,
  passengerUserId: string,
  flightId: string,
): Promise<boolean> {
  const ids = await getConfirmedBookingFlightIds(supabase, passengerUserId, [flightId]);
  return ids.has(flightId);
}
