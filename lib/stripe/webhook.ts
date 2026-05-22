import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

async function insertLedger(
  admin: ReturnType<typeof createAdminClient>,
  entry: {
    booking_id: string;
    type:
      | "booking_payment"
      | "platform_fee"
      | "pilot_payout"
      | "refund"
      | "payout_failed";
    amount_eur: number;
    idempotency_key: string;
    stripe_payment_intent_id?: string | null;
    stripe_checkout_session_id?: string | null;
    stripe_refund_id?: string | null;
    stripe_transfer_id?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await admin.from("ledger").insert({
    booking_id: entry.booking_id,
    type: entry.type,
    amount_eur: entry.amount_eur,
    idempotency_key: entry.idempotency_key,
    stripe_payment_intent_id: entry.stripe_payment_intent_id ?? null,
    stripe_checkout_session_id: entry.stripe_checkout_session_id ?? null,
    stripe_refund_id: entry.stripe_refund_id ?? null,
    stripe_transfer_id: entry.stripe_transfer_id ?? null,
    metadata: (entry.metadata ?? {}) as Record<string, never>,
  });

  if (error && error.code !== "23505") {
    throw new Error(`Ledger insert failed: ${error.message}`);
  }
}

async function queueNotification(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  type: string,
  payload: Json,
) {
  await admin.from("notification_queue").insert({
    user_id: userId,
    type,
    payload,
  });
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    console.error("[stripe/webhook] missing booking_id in session metadata");
    return;
  }

  const admin = createAdminClient();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { data: booking, error: fetchErr } = await admin
    .from("flight_booking_requests")
    .select(
      "id, status, passenger_user_id, passenger_amount_eur, platform_fee_eur, flight_id",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchErr || !booking) {
    console.error("[stripe/webhook] booking not found:", bookingId);
    return;
  }

  if (booking.status === "confirmed") {
    return;
  }

  if (booking.status !== "accepted") {
    console.warn(
      `[stripe/webhook] booking ${bookingId} not accepted (status=${booking.status})`,
    );
    return;
  }

  const paidAt = new Date().toISOString();

  const { error: updateErr } = await admin
    .from("flight_booking_requests")
    .update({
      status: "confirmed",
      paid_at: paidAt,
      payment_intent_id: paymentIntentId,
      checkout_session_id: session.id,
    })
    .eq("id", bookingId);

  if (updateErr) {
    throw new Error(updateErr.message);
  }

  const passengerAmount = Number(booking.passenger_amount_eur ?? 0);
  const platformFee = Number(booking.platform_fee_eur ?? 0);

  await insertLedger(admin, {
    booking_id: bookingId,
    type: "booking_payment",
    amount_eur: passengerAmount,
    idempotency_key: `payment:${session.id}`,
    stripe_payment_intent_id: paymentIntentId,
    stripe_checkout_session_id: session.id,
  });

  await insertLedger(admin, {
    booking_id: bookingId,
    type: "platform_fee",
    amount_eur: platformFee,
    idempotency_key: `platform_fee:${session.id}`,
    stripe_payment_intent_id: paymentIntentId,
    stripe_checkout_session_id: session.id,
  });

  const { data: flight } = await admin
    .from("flights")
    .select("pilot_user_id")
    .eq("id", booking.flight_id)
    .single();

  await queueNotification(admin, booking.passenger_user_id, "payment_confirmed", {
    bookingId,
    flightId: booking.flight_id,
  });

  if (flight?.pilot_user_id) {
    await queueNotification(admin, flight.pilot_user_id, "payment_confirmed", {
      bookingId,
      flightId: booking.flight_id,
    });
  }
}

export async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("flight_booking_requests")
    .select("id, passenger_amount_eur")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (!booking) return;

  const refundId = charge.refunds?.data[0]?.id ?? `refund:${charge.id}`;

  await insertLedger(admin, {
    booking_id: booking.id,
    type: "refund",
    amount_eur: Number(booking.passenger_amount_eur ?? 0),
    idempotency_key: `refund:${refundId}`,
    stripe_payment_intent_id: paymentIntentId,
    stripe_refund_id: refundId,
  });
}
