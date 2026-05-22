import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

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
 * Osigurava da pilot ima Stripe Express Connect account s dodanim IBAN-om.
 * Ako account već postoji, dodaje novi external account (bank account).
 * Express account type: Stripe preuzima odgovornost za ToS prihvaćanje —
 * nema potrebe za zasebnim onboarding flowom na strani platforme (MVP).
 *
 * NAPOMENA: Za punu produkcijsku upotrebu (Faza 4b) potreban je
 * stripe.accountLinks.create() flow da pilot prihvati Stripe ToS.
 */
export async function ensurePilotConnectAccount(
  stripe: Stripe,
  params: {
    pilotUserId: string;
    email: string | undefined;
    iban: string;
    accountHolderName: string;
    existingAccountId: string | null;
  },
): Promise<{ accountId: string }> {
  let accountId = params.existingAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "HR",
      email: params.email,
      capabilities: { transfers: { requested: true } },
      business_type: "individual",
      metadata: { pilot_user_id: params.pilotUserId },
    });
    accountId = account.id;
  }

  await stripe.accounts.createExternalAccount(accountId, {
    external_account: {
      object: "bank_account",
      country: "HR",
      currency: "eur",
      account_holder_name: params.accountHolderName,
      account_holder_type: "individual",
      account_number: params.iban.replace(/\s/g, ""),
    },
  });

  return { accountId };
}

/**
 * Vrši Stripe transfer na pilot Connect account.
 * idempotencyKey sprječava duplikate pri ponovnim pozivima.
 */
export async function transferToPilot(
  stripe: Stripe,
  params: {
    amountEur: number;
    connectAccountId: string;
    bookingId: string;
    idempotencyKey: string;
  },
): Promise<{ transferId: string }> {
  const transfer = await stripe.transfers.create(
    {
      amount: Math.round(params.amountEur * 100),
      currency: "eur",
      destination: params.connectAccountId,
      metadata: { booking_id: params.bookingId },
    },
    { idempotencyKey: params.idempotencyKey },
  );
  return { transferId: transfer.id };
}
