import Stripe from "npm:stripe@17.7.0";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/**
 * Vraća instancu Stripe klijenta ili null ako STRIPE_SECRET_KEY nije postavljen.
 * null = stub mode za lokalni razvoj.
 */
export function getStripeClient(): Stripe | null {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

/**
 * Osigurava da pilot ima Stripe Express Connect account.
 * Stripe upravlja IBAN-om, KYC-om i SEPA transferima.
 * Ne prima IBAN — Stripe onboarding flow rješava unos bankovnih podataka.
 */
export async function ensurePilotConnectAccount(
  stripe: Stripe,
  supabase: SupabaseClient,
  params: {
    pilotUserId: string;
    email: string | undefined;
    existingAccountId: string | null;
  },
): Promise<{ accountId: string }> {
  if (params.existingAccountId) {
    return { accountId: params.existingAccountId };
  }

  const account = await stripe.accounts.create({
    type: "express",
    country: "HR",
    email: params.email,
    capabilities: { transfers: { requested: true } },
    business_type: "individual",
    metadata: { pilot_user_id: params.pilotUserId },
  });

  await supabase
    .from("pilot_profiles")
    .update({ stripe_account_id: account.id })
    .eq("user_id", params.pilotUserId);

  return { accountId: account.id };
}

/**
 * Vrši Stripe transfer na pilot Connect account.
 * source_transaction mora biti charge ID (ch_xxx).
 * idempotencyKey sprječava duplikate pri ponovnim pozivima.
 */
export async function transferToPilot(
  stripe: Stripe,
  params: {
    amountEur: number;
    connectAccountId: string;
    bookingId: string;
    chargeId: string;
    idempotencyKey: string;
  },
): Promise<{ transferId: string }> {
  const transfer = await stripe.transfers.create(
    {
      amount: Math.round(params.amountEur * 100),
      currency: "eur",
      destination: params.connectAccountId,
      source_transaction: params.chargeId,
      metadata: { booking_id: params.bookingId },
    },
    { idempotencyKey: params.idempotencyKey },
  );
  return { transferId: transfer.id };
}
