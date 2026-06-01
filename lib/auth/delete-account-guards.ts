import { createAdminClient } from "@/lib/supabase/admin";

const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "accepted",
  "confirmed",
] as const;

export class DeleteAccountBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeleteAccountBlockedError";
  }
}

export async function assertCanDeleteAccount(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { count: passengerActive } = await admin
    .from("flight_booking_requests")
    .select("*", { count: "exact", head: true })
    .eq("passenger_user_id", userId)
    .in("status", [...ACTIVE_BOOKING_STATUSES]);

  if ((passengerActive ?? 0) > 0) {
    throw new DeleteAccountBlockedError(
      "Cannot delete account while you have active booking requests.",
    );
  }

  const { data: pilotFlights } = await admin
    .from("flights")
    .select("id")
    .eq("pilot_user_id", userId);

  const flightIds = (pilotFlights ?? []).map((f) => f.id);
  if (flightIds.length === 0) {
    return;
  }

  const { count: pilotActiveBookings } = await admin
    .from("flight_booking_requests")
    .select("*", { count: "exact", head: true })
    .in("flight_id", flightIds)
    .in("status", [...ACTIVE_BOOKING_STATUSES]);

  if ((pilotActiveBookings ?? 0) > 0) {
    throw new DeleteAccountBlockedError(
      "Cannot delete account while your flights have active bookings.",
    );
  }

  const { count: pendingPayouts } = await admin
    .from("flight_booking_requests")
    .select("*", { count: "exact", head: true })
    .in("flight_id", flightIds)
    .eq("payout_status", "pending");

  if ((pendingPayouts ?? 0) > 0) {
    throw new DeleteAccountBlockedError(
      "Cannot delete account while a payout is still pending.",
    );
  }
}
