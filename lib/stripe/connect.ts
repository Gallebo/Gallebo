import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/client";

export async function ensurePilotConnectAccount(params: {
  pilotUserId: string;
  email: string;
  iban: string;
  accountHolderName: string;
  existingAccountId: string | null;
}): Promise<{ accountId: string } | { error: string }> {
  if (!isStripeConfigured()) {
    return { accountId: `acct_stub_${params.pilotUserId}` };
  }

  const stripe = getStripe();
  let accountId = params.existingAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "custom",
      country: "HR",
      email: params.email,
      capabilities: {
        transfers: { requested: true },
      },
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

export async function transferToPilot(params: {
  amountEur: number;
  connectAccountId: string;
  bookingId: string;
  idempotencyKey: string;
}): Promise<{ transferId: string } | { error: string }> {
  if (!isStripeConfigured()) {
    console.warn("[stripe/connect] stub transfer", params);
    return { transferId: `tr_stub_${params.idempotencyKey}` };
  }

  const stripe = getStripe();
  const amountCents = Math.round(params.amountEur * 100);

  const transfer = await stripe.transfers.create(
    {
      amount: amountCents,
      currency: "eur",
      destination: params.connectAccountId,
      metadata: { booking_id: params.bookingId },
    },
    { idempotencyKey: params.idempotencyKey },
  );

  return { transferId: transfer.id };
}
