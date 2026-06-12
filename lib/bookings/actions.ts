"use server";

import { revalidatePath } from "next/cache";

import {
  calculateBookingAmounts,
  flightDepartureUtc,
  hasFlightDeparted,
  passengerRefundEligible,
} from "@/lib/bookings/pricing";
import { weightFromDbValue } from "@/lib/crypto/weight";
import { checkFlightWeight } from "@/lib/bookings/weight";
import { requirePilot, requireUser, getProfile } from "@/lib/auth/rbac";
import { createBookingCheckoutSession } from "@/lib/stripe/checkout";
import { createBookingRefund } from "@/lib/stripe/refund";
import { insertSystemMessage } from "@/lib/chat/system";
import {
  inAppCopyForType,
} from "@/lib/notifications/copy";
import { queueUserNotification } from "@/lib/notifications/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type BookingActionState = {
  error?: string;
  success?: string;
  checkoutUrl?: string;
};

async function notify(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  type: string,
  payload: Json,
) {
  const payloadObj = (payload ?? {}) as Record<string, unknown>;
  const copy = inAppCopyForType(type, payloadObj);
  await queueUserNotification(admin, userId, type, payload, copy
    ? {
        title: copy.title,
        body: copy.body,
        bookingId:
          typeof payloadObj.bookingId === "string"
            ? payloadObj.bookingId
            : undefined,
        flightId:
          typeof payloadObj.flightId === "string"
            ? payloadObj.flightId
            : undefined,
      }
    : undefined);
}

export async function acceptBookingAction(
  bookingId: string,
): Promise<BookingActionState> {
  try {
    const { user } = await requirePilot();
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: booking } = await supabase
      .from("flight_booking_requests")
      .select("id, status, passenger_user_id, flight_id")
      .eq("id", bookingId)
      .eq("status", "pending")
      .maybeSingle();

    if (!booking) {
      return { error: "Booking not found or already handled" };
    }

    const { data: flight } = await supabase
      .from("flights")
      .select("pilot_user_id, price_per_passenger_eur, status")
      .eq("id", booking.flight_id)
      .eq("pilot_user_id", user.id)
      .eq("status", "published")
      .maybeSingle();

    if (!flight) {
      return { error: "Not authorized or flight not available" };
    }

    const amounts = calculateBookingAmounts(
      Number(flight.price_per_passenger_eur),
    );
    const now = new Date();
    const paymentExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from("flight_booking_requests")
      .update({
        status: "accepted",
        pilot_responded_at: now.toISOString(),
        accepted_at: now.toISOString(),
        payment_expires_at: paymentExpires.toISOString(),
        passenger_amount_eur: amounts.passengerAmountEur,
        pilot_payout_eur: amounts.pilotPayoutEur,
        platform_fee_eur: amounts.platformFeeEur,
      })
      .eq("id", bookingId)
      .eq("status", "pending");

    if (error) return { error: error.message };

    await insertSystemMessage(
      bookingId,
      "Booking je prihvaćen. Putnik ima 24 sata za plaćanje.",
    );

    await notify(admin, booking.passenger_user_id, "booking_accepted", {
      bookingId,
      flightId: booking.flight_id,
      paymentExpiresAt: paymentExpires.toISOString(),
      passengerAmountEur: amounts.passengerAmountEur,
    });

    revalidatePath("/pilot/bookings");
    revalidatePath("/passenger/bookings");
    revalidatePath(`/flights/${booking.flight_id}`);

    return { success: "Booking accepted. Passenger has 24 hours to pay." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to accept booking",
    };
  }
}

export async function rejectBookingAction(
  bookingId: string,
): Promise<BookingActionState> {
  try {
    const { user } = await requirePilot();
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: booking } = await supabase
      .from("flight_booking_requests")
      .select("id, status, passenger_user_id, flight_id")
      .eq("id", bookingId)
      .eq("status", "pending")
      .maybeSingle();

    if (!booking) {
      return { error: "Booking not found or already handled" };
    }

    const { data: flight } = await supabase
      .from("flights")
      .select("id")
      .eq("id", booking.flight_id)
      .eq("pilot_user_id", user.id)
      .maybeSingle();

    if (!flight) {
      return { error: "Not authorized" };
    }

    const { error } = await supabase
      .from("flight_booking_requests")
      .update({
        status: "rejected",
        pilot_responded_at: new Date().toISOString(),
        payout_status: "not_applicable",
      })
      .eq("id", bookingId)
      .eq("status", "pending");

    if (error) return { error: error.message };

    await insertSystemMessage(
      bookingId,
      "Booking je odbijen od strane pilota.",
    );

    await notify(admin, booking.passenger_user_id, "booking_rejected", {
      bookingId,
      flightId: booking.flight_id,
    });

    revalidatePath("/pilot/bookings");
    revalidatePath("/passenger/bookings");

    return { success: "Booking rejected" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to reject booking",
    };
  }
}

export async function startCheckoutAction(
  bookingId: string,
): Promise<BookingActionState> {
  try {
    const user = await requireUser();
    const profile = await getProfile();
    if (profile?.role !== "passenger") {
      return { error: "Only passengers can pay for bookings" };
    }

    const supabase = await createClient();
    const { data: booking } = await supabase
      .from("flight_booking_requests")
      .select(
        "id, status, flight_id, passenger_user_id, passenger_amount_eur, payment_expires_at",
      )
      .eq("id", bookingId)
      .eq("passenger_user_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();

    if (!booking) {
      return { error: "Booking not available for payment" };
    }

    if (
      booking.payment_expires_at &&
      new Date(booking.payment_expires_at).getTime() < Date.now()
    ) {
      return { error: "Payment window has expired" };
    }

    const { data: flight } = await supabase
      .from("flights")
      .select("flight_date, departure_time")
      .eq("id", booking.flight_id)
      .maybeSingle();

    if (!flight?.flight_date || !flight.departure_time) {
      return { error: "Flight not found" };
    }

    const now = new Date();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const thirtyMinutesMs = 30 * 60 * 1000;
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const departureUtc = flightDepartureUtc(
      flight.flight_date,
      flight.departure_time,
    );
    const msUntilDeparture = departureUtc.getTime() - now.getTime();

    let checkoutExpiresAt = new Date(now.getTime() + twentyFourHoursMs);
    if (msUntilDeparture < twentyFourHoursMs) {
      checkoutExpiresAt = new Date(departureUtc.getTime() - twoHoursMs);
    }

    if (
      checkoutExpiresAt.getTime() <
      now.getTime() + thirtyMinutesMs
    ) {
      return { error: "Payment window too close to departure" };
    }

    const amount = Number(booking.passenger_amount_eur ?? 0);
    if (amount <= 0) {
      return { error: "Invalid booking amount" };
    }

    const result = await createBookingCheckoutSession({
      bookingId: booking.id,
      flightId: booking.flight_id,
      passengerUserId: user.id,
      passengerAmountEur: amount,
      paymentExpiresAt: checkoutExpiresAt,
    });

    if ("error" in result) {
      return { error: result.error };
    }

    const admin = createAdminClient();
    await admin
      .from("flight_booking_requests")
      .update({ checkout_session_id: result.sessionId })
      .eq("id", bookingId);

    return { success: "Redirecting to payment…", checkoutUrl: result.url };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to start checkout",
    };
  }
}

export async function cancelBookingAction(
  bookingId: string,
): Promise<BookingActionState> {
  try {
    const user = await requireUser();
    const profile = await getProfile();
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: booking } = await supabase
      .from("flight_booking_requests")
      .select(
        "id, status, passenger_user_id, payment_intent_id, passenger_amount_eur, flight_id",
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (!booking) {
      return { error: "Booking not found" };
    }

    const { data: flight } = await supabase
      .from("flights")
      .select("pilot_user_id, flight_date, status")
      .eq("id", booking.flight_id)
      .maybeSingle();

    if (!flight) {
      return { error: "Flight not found" };
    }

    const isPassenger = booking.passenger_user_id === user.id;
    const isPilot = flight.pilot_user_id === user.id && profile?.role === "pilot";

    if (!isPassenger && !isPilot) {
      return { error: "Not authorized" };
    }

    const cancellable = ["pending", "accepted", "confirmed"];
    if (!cancellable.includes(booking.status)) {
      return { error: "This booking cannot be cancelled" };
    }

    let refundFull = false;
    if (isPilot) {
      refundFull = booking.status === "confirmed";
    } else if (booking.status === "confirmed") {
      refundFull = passengerRefundEligible(flight.flight_date);
    }

    // Late passenger cancel (<48h before flight): no refund to passenger;
    // payout_status becomes not_applicable — pilot payout / platform retention TBD (see docs/booking-cancellation.md).

    const now = new Date().toISOString();

    if (booking.status === "confirmed" && booking.payment_intent_id) {
      if (refundFull) {
        const refundResult = await createBookingRefund(
          booking.payment_intent_id,
          `cancel:${bookingId}`,
        );
        if ("error" in refundResult) {
          return { error: refundResult.error };
        }
        await admin
          .from("flight_booking_requests")
          .update({
            status: "cancelled",
            cancelled_at: now,
            cancelled_by: user.id,
            refund_id: refundResult.refundId,
            refunded_at: now,
            payout_status: "not_applicable",
          })
          .eq("id", bookingId);
        // Refund ledger entry is written only by handleChargeRefunded (Stripe webhook).
      } else {
        await admin
          .from("flight_booking_requests")
          .update({
            status: "cancelled",
            cancelled_at: now,
            cancelled_by: user.id,
            payout_status: "not_applicable",
          })
          .eq("id", bookingId);
      }
    } else {
      const client = isPilot ? admin : supabase;
      const { error } = await client
        .from("flight_booking_requests")
        .update({
          status: "cancelled",
          cancelled_at: now,
          cancelled_by: user.id,
          payout_status: "not_applicable",
        })
        .eq("id", bookingId);

      if (error) return { error: error.message };
    }

    await insertSystemMessage(
      bookingId,
      "Booking je otkazan.",
    );

    const notifyType = isPilot
      ? "booking_cancelled_by_pilot"
      : "booking_cancelled_by_passenger";
    const notifyUserId = isPilot
      ? booking.passenger_user_id
      : flight.pilot_user_id;

    await notify(admin, notifyUserId, notifyType, {
      bookingId,
      flightId: booking.flight_id,
      refundFull,
    });

    revalidatePath("/passenger/bookings");
    revalidatePath("/pilot/bookings");
    revalidatePath(`/flights/${booking.flight_id}`);

    return {
      success: refundFull
        ? "Booking cancelled. Full refund will be processed."
        : "Booking cancelled.",
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to cancel booking",
    };
  }
}

export async function markFlightCompletedAction(
  flightId: string,
): Promise<BookingActionState> {
  try {
    const { user } = await requirePilot();
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: flight } = await supabase
      .from("flights")
      .select("id, pilot_user_id, status, flight_date, departure_time")
      .eq("id", flightId)
      .eq("pilot_user_id", user.id)
      .eq("status", "published")
      .maybeSingle();

    if (!flight) {
      return { error: "Flight not found or not published" };
    }

    if (
      !hasFlightDeparted(flight.flight_date, flight.departure_time)
    ) {
      return {
        error:
          "Let se može označiti završenim tek nakon planiranog vremena polaska.",
      };
    }

    const { data: thresholdRow } = await supabase.rpc(
      "pilot_payout_threshold_met",
      { p_pilot_user_id: user.id },
    );
    const thresholdMet = thresholdRow === true;
    const payoutAfter = thresholdMet
      ? new Date().toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Phase 7: both sides have 24h to leave their blind reviews.
    const reviewDeadlineAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    const now = new Date().toISOString();

    await admin
      .from("flights")
      .update({ status: "completed", completed_at: now })
      .eq("id", flightId);

    const { data: bookings } = await admin
      .from("flight_booking_requests")
      .select("id, passenger_user_id")
      .eq("flight_id", flightId)
      .eq("status", "confirmed");

    for (const b of bookings ?? []) {
      await admin
        .from("flight_booking_requests")
        .update({
          status: "completed",
          payout_after: payoutAfter,
          review_deadline_at: reviewDeadlineAt,
        })
        .eq("id", b.id);

      await insertSystemMessage(b.id, "Let je završen.");

      await notify(admin, b.passenger_user_id, "flight_completed", {
        flightId,
        bookingId: b.id,
      });
    }

    // Spec faza 5: "Let oznacen kao zavrsen — oboje primaju potvrdu"
    await notify(admin, user.id, "flight_completed", {
      flightId,
      role: "pilot",
    });

    revalidatePath("/pilot/flights");
    revalidatePath("/pilot/bookings");
    revalidatePath(`/flights/${flightId}`);

    return {
      success: thresholdMet
        ? "Flight marked complete. Payouts will process shortly."
        : "Flight marked complete. Payouts scheduled after 24h review period.",
    };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Failed to mark flight completed",
    };
  }
}

export async function getFlightWeightCheck(flightId: string) {
  const { user } = await requirePilot();
  const supabase = await createClient();

  const { data: flight } = await supabase
    .from("flights")
    .select("id, pilot_user_id, aircraft_id")
    .eq("id", flightId)
    .eq("pilot_user_id", user.id)
    .maybeSingle();

  if (!flight?.aircraft_id) {
    return { error: "Flight or aircraft not found" };
  }

  const { data: aircraft } = await supabase
    .from("aircraft")
    .select("max_passenger_weight_kg")
    .eq("id", flight.aircraft_id)
    .single();

  const { data: bookings } = await supabase
    .from("flight_booking_requests")
    .select("passenger_user_id, status")
    .eq("flight_id", flightId)
    .in("status", ["pending", "accepted", "confirmed"]);

  const passengerIds = (bookings ?? []).map((b) => b.passenger_user_id);
  if (!passengerIds.length) {
    return checkFlightWeight(aircraft?.max_passenger_weight_kg, []);
  }

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, weight_encrypted")
    .in("id", passengerIds);

  const weights = (profiles ?? []).map((p) => {
    let weightKg: number | null = null;
    if (p.weight_encrypted) {
      try {
        weightKg = weightFromDbValue(p.weight_encrypted);
      } catch {
        weightKg = null;
      }
    }
    return { userId: p.id, weightKg };
  });

  return checkFlightWeight(aircraft?.max_passenger_weight_kg, weights);
}
