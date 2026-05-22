import type Stripe from "stripe";

import { insertSystemMessage } from "@/lib/chat/system";
import { insertLedger } from "@/lib/ledger/insert";
import { inAppCopyForType } from "@/lib/notifications/copy";
import { queueUserNotification } from "@/lib/notifications/notify";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

async function queueNotification(
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
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      chargeId =
        typeof paymentIntent.latest_charge === "string"
          ? paymentIntent.latest_charge
          : (paymentIntent.latest_charge?.id ?? null);
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
    bookingId,
    "Plaćanje je potvrđeno. Kontakt podaci su dostupni.",
  );

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

/**
 * Ažurira stripe_onboarding_complete na pilot_profiles kad se Stripe Express account
 * aktivira ili restringira. Stripe šalje ovaj event kad pilot završi onboarding
 * ili kad mu Stripe ograniči account (istekli dokumenti, fraud flag, itd.).
 *
 * NAPOMENA: Ovaj handler prima Connect event — webhook endpoint mora biti konfiguriran
 * s "Listen to events on Connected accounts" u Stripe Dashboardu → Webhooks.
 */
export async function handleAccountUpdated(account: Stripe.Account): Promise<void> {
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
