import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";

/**
 * Osigurava da pilot ima Stripe Express Connect account.
 * Stripe upravlja IBAN-om, KYC-om i SEPA transferima — mi čuvamo samo stripe_account_id.
 * Ako account već postoji, vraća postojeći ID.
 */
export async function createPilotConnectAccount(
  pilotId: string,
  email: string,
): Promise<{ accountId: string }> {
  const admin = createAdminClient();

  const { data: pilot } = await admin
    .from("pilot_profiles")
    .select("stripe_account_id")
    .eq("user_id", pilotId)
    .single();

  if (pilot?.stripe_account_id) {
    return { accountId: pilot.stripe_account_id };
  }

  if (!isStripeConfigured()) {
    const stubId = `acct_stub_${pilotId}`;
    await admin
      .from("pilot_profiles")
      .update({ stripe_account_id: stubId })
      .eq("user_id", pilotId);
    return { accountId: stubId };
  }

  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country: "HR",
    email,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: { pilot_user_id: pilotId },
  });

  await admin
    .from("pilot_profiles")
    .update({ stripe_account_id: account.id })
    .eq("user_id", pilotId);

  return { accountId: account.id };
}

/**
 * Generira Stripe onboarding link za Express account.
 * UVIJEK generira novi link — Stripe linkovi istječu za 24h i jednokratni su.
 * Ne sprema URL u bazu.
 */
export async function createOnboardingLink(stripeAccountId: string): Promise<string> {
  const appUrl = getAppUrl();
  if (!isStripeConfigured() || stripeAccountId.startsWith("acct_stub_")) {
    return `${appUrl}/pilot/stripe/complete?stub=1`;
  }

  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${appUrl}/pilot/stripe/refresh`,
    return_url: `${appUrl}/pilot/stripe/complete`,
    type: "account_onboarding",
  });

  return link.url;
}

/**
 * Vrši Stripe transfer na pilot Connect account.
 * source_transaction mora biti charge ID (ch_xxx), ne payment intent ID.
 * idempotencyKey sprječava duplikate pri ponovnim pozivima.
 */
export async function transferToPilot(params: {
  stripeAccountId: string;
  amount: number;
  chargeId: string;
  bookingId: string;
  idempotencyKey: string;
}): Promise<{ transferId: string }> {
  if (!isStripeConfigured() || params.stripeAccountId.startsWith("acct_stub_")) {
    console.warn("[stripe/connect] stub transfer", params.bookingId);
    return { transferId: `tr_stub_${params.idempotencyKey}` };
  }

  const stripe = getStripe();
  const transfer = await stripe.transfers.create(
    {
      amount: params.amount,
      currency: "eur",
      destination: params.stripeAccountId,
      source_transaction: params.chargeId,
      metadata: { booking_id: params.bookingId },
    },
    { idempotencyKey: params.idempotencyKey },
  );

  return { transferId: transfer.id };
}

/**
 * Refundira putnika.
 * Koristi charge ID (ch_xxx), ne payment intent ID.
 */
export async function refundPassenger(
  chargeId: string,
  amount?: number,
): Promise<{ refundId: string }> {
  if (!isStripeConfigured()) {
    return { refundId: `re_stub_${chargeId}` };
  }

  const stripe = getStripe();
  const refund = await stripe.refunds.create({
    charge: chargeId,
    ...(amount !== undefined && { amount }),
  });

  return { refundId: refund.id };
}

/** Removes Express Connect account when pilot deletes their platform account. */
export async function deletePilotStripeAccount(
  stripeAccountId: string,
): Promise<void> {
  if (!stripeAccountId || stripeAccountId.startsWith("acct_stub_")) {
    return;
  }
  if (!isStripeConfigured()) {
    return;
  }

  const stripe = getStripe();
  await stripe.accounts.del(stripeAccountId);
}
