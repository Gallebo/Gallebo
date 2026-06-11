import type Stripe from "npm:stripe@17.7.0";

import { getStripeClient } from "./connect.ts";
import { createAdminClient } from "./supabase.ts";

type Admin = ReturnType<typeof createAdminClient>;

type LedgerEntryType =
  | "booking_payment"
  | "platform_fee"
  | "pilot_payout"
  | "refund"
  | "payout_failed";

async function insertLedger(
  admin: Admin,
  entry: {
    booking_id: string;
    type: LedgerEntryType;
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
    metadata: entry.metadata ?? {},
  });

  if (error && error.code !== "23505") {
    throw new Error(`Ledger insert failed: ${error.message}`);
  }
}

async function insertSystemMessage(
  admin: Admin,
  bookingId: string,
  content: string,
): Promise<void> {
  const { error } = await admin.from("chat_messages").insert({
    booking_id: bookingId,
    sender_user_id: null,
    content,
    is_system: true,
  });

  if (error) {
    console.error("[chat/system]", error.message);
  }
}

async function queueNotification(
  admin: Admin,
  userId: string,
  type: string,
  payload: Record<string, unknown>,
  inApp?: {
    title: string;
    body: string;
    bookingId?: string;
    flightId?: string;
  },
): Promise<void> {
  const { data: settings } = await admin
    .from("user_notification_settings")
    .select("email_enabled, push_enabled, in_app_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  const emailEnabled = settings?.email_enabled ?? true;
  const pushEnabled = settings?.push_enabled ?? true;
  const inAppEnabled = settings?.in_app_enabled ?? true;

  if (emailEnabled || pushEnabled) {
    await admin.from("notification_queue").insert({
      user_id: userId,
      type,
      payload,
    });
  }

  if (inApp && inAppEnabled) {
    await admin.from("in_app_notifications").insert({
      user_id: userId,
      type,
      title: inApp.title,
      body: inApp.body,
      booking_id: inApp.bookingId ?? null,
      flight_id: inApp.flightId ?? null,
    });
  }
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

  let chargeId: string | null = null;
  if (paymentIntentId) {
    try {
      const stripe = getStripeClient();
      if (stripe) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          paymentIntentId,
        );
        chargeId =
          typeof paymentIntent.latest_charge === "string"
            ? paymentIntent.latest_charge
            : (paymentIntent.latest_charge?.id ?? null);
      }
    } catch (e) {
      console.warn("[stripe/webhook] could not retrieve charge id:", e);
    }
  }

  const paidAt = new Date().toISOString();

  const { error: updateErr } = await admin
    .from("flight_booking_requests")
    .update({
      status: "confirmed",
      paid_at: paidAt,
      payment_intent_id: paymentIntentId,
      checkout_session_id: session.id,
      stripe_charge_id: chargeId,
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

  await insertSystemMessage(
    admin,
    bookingId,
    "Plaćanje je potvrđeno. Kontakt podaci su dostupni.",
  );

  const paymentCopy = {
    title: "Payment confirmed",
    body: "Your seat is booked. Contact details are now available in chat.",
    bookingId,
    flightId: booking.flight_id,
  };

  await queueNotification(
    admin,
    booking.passenger_user_id,
    "payment_confirmed",
    { bookingId, flightId: booking.flight_id },
    paymentCopy,
  );

  if (flight?.pilot_user_id) {
    await queueNotification(
      admin,
      flight.pilot_user_id,
      "payment_confirmed",
      { bookingId, flightId: booking.flight_id },
      paymentCopy,
    );
  }
}

export async function handleAccountUpdated(
  account: Stripe.Account,
): Promise<void> {
  const isComplete =
    account.details_submitted === true &&
    account.charges_enabled === true &&
    account.payouts_enabled === true;

  const admin = createAdminClient();
  const { error } = await admin
    .from("pilot_profiles")
    .update({ stripe_onboarding_complete: isComplete })
    .eq("stripe_account_id", account.id);

  if (error) {
    console.error("[stripe/webhook] handleAccountUpdated db error:", error.message);
    throw new Error(error.message);
  }
}

export async function handleChargeRefunded(
  charge: Stripe.Charge,
): Promise<void> {
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
