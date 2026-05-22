import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createAdminClient } from "../_shared/supabase.ts";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

async function insertLedger(
  supabase: ReturnType<typeof createAdminClient>,
  entry: {
    booking_id: string;
    type: "pilot_payout" | "payout_failed";
    amount_eur: number;
    idempotency_key: string;
    stripe_transfer_id?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from("ledger").insert({
    booking_id: entry.booking_id,
    type: entry.type,
    amount_eur: entry.amount_eur,
    idempotency_key: entry.idempotency_key,
    stripe_transfer_id: entry.stripe_transfer_id ?? null,
    metadata: entry.metadata ?? {},
  });
}

serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  const auth = req.headers.get("Authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: bookings, error } = await supabase
    .from("flight_booking_requests")
    .select(
      `
      id, pilot_payout_eur, paid_out_at, payout_after,
      flights!inner (pilot_user_id)
    `,
    )
    .eq("status", "completed")
    .is("paid_out_at", null)
    .lte("payout_after", now);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stripe = stripeKey
    ? new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" })
    : null;

  let paid = 0;
  let failed = 0;

  for (const row of bookings ?? []) {
    const bookingId = row.id as string;
    const amount = Number(row.pilot_payout_eur ?? 0);
    const flight = row.flights as { pilot_user_id: string };
    const pilotUserId = flight.pilot_user_id;

    if (amount <= 0) {
      await supabase
        .from("flight_booking_requests")
        .update({ paid_out_at: now })
        .eq("id", bookingId);
      continue;
    }

    const { data: pilotProfile } = await supabase
      .from("pilot_profiles")
      .select(
        "stripe_connect_account_id, account_holder_name, iban_vault_secret_id",
      )
      .eq("user_id", pilotUserId)
      .single();

    const { data: iban } = await supabase.rpc("get_pilot_iban_for_payout", {
      p_user_id: pilotUserId,
    });

    if (!iban) {
      await insertLedger(supabase, {
        booking_id: bookingId,
        type: "payout_failed",
        amount_eur: amount,
        idempotency_key: `payout_failed:no_iban:${bookingId}`,
        metadata: { reason: "missing_iban" },
      });
      failed += 1;
      continue;
    }

    let connectAccountId = pilotProfile?.stripe_connect_account_id as
      | string
      | null;

    try {
      if (stripe && !connectAccountId) {
        const { data: authUser } = await supabase.auth.admin.getUserById(
          pilotUserId,
        );
        const account = await stripe.accounts.create({
          type: "custom",
          country: "HR",
          email: authUser.user?.email ?? undefined,
          capabilities: { transfers: { requested: true } },
          business_type: "individual",
          metadata: { pilot_user_id: pilotUserId },
        });
        connectAccountId = account.id;

        await stripe.accounts.createExternalAccount(connectAccountId, {
          external_account: {
            object: "bank_account",
            country: "HR",
            currency: "eur",
            account_holder_name:
              pilotProfile?.account_holder_name ?? "Pilot",
            account_holder_type: "individual",
            account_number: String(iban).replace(/\s/g, ""),
          },
        });

        await supabase
          .from("pilot_profiles")
          .update({ stripe_connect_account_id: connectAccountId })
          .eq("user_id", pilotUserId);
      }

      let transferId = `stub_tr_${bookingId}`;

      if (stripe && connectAccountId) {
        const transfer = await stripe.transfers.create(
          {
            amount: Math.round(amount * 100),
            currency: "eur",
            destination: connectAccountId,
            metadata: { booking_id: bookingId },
          },
          { idempotencyKey: `payout:${bookingId}` },
        );
        transferId = transfer.id;
      }

      await supabase
        .from("flight_booking_requests")
        .update({
          paid_out_at: now,
          stripe_transfer_id: transferId,
        })
        .eq("id", bookingId);

      await insertLedger(supabase, {
        booking_id: bookingId,
        type: "pilot_payout",
        amount_eur: amount,
        idempotency_key: `payout:${bookingId}`,
        stripe_transfer_id: transferId,
      });

      await supabase.from("notification_queue").insert({
        user_id: pilotUserId,
        type: "payout_sent",
        payload: { bookingId, amountEur: amount },
      });

      paid += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "transfer failed";
      console.error(`[process-payouts] ${bookingId}:`, msg);
      await insertLedger(supabase, {
        booking_id: bookingId,
        type: "payout_failed",
        amount_eur: amount,
        idempotency_key: `payout_failed:${bookingId}`,
        metadata: { error: msg },
      });
      failed += 1;
    }
  }

  return new Response(JSON.stringify({ ok: true, paid, failed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
