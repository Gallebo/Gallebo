import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import {
  ensurePilotConnectAccount,
  getStripeClient,
  transferToPilot,
} from "../_shared/connect.ts";

const MAX_PAYOUT_RETRIES = 5;

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
  const { error } = await supabase.from("ledger").insert({
    booking_id: entry.booking_id,
    type: entry.type,
    amount_eur: entry.amount_eur,
    idempotency_key: entry.idempotency_key,
    stripe_transfer_id: entry.stripe_transfer_id ?? null,
    metadata: entry.metadata ?? {},
  });
  if (error && error.code !== "23505") {
    throw new Error(`Ledger insert failed: ${error.message}`);
  }
}

async function incrementPayoutFailedCount(
  supabase: ReturnType<typeof createAdminClient>,
  bookingId: string,
) {
  const { error } = await supabase.rpc("increment_payout_failed_count", {
    p_booking_id: bookingId,
  });
  if (error) {
    throw new Error(`increment_payout_failed_count failed: ${error.message}`);
  }
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
      id, pilot_payout_eur, paid_out_at, payout_after, payout_failed_count,
      flights!inner (pilot_user_id)
    `,
    )
    .eq("status", "completed")
    .is("paid_out_at", null)
    .lte("payout_after", now)
    .lt("payout_failed_count", MAX_PAYOUT_RETRIES);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stripe = getStripeClient();

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
      .select("stripe_connect_account_id, account_holder_name, iban_vault_secret_id")
      .eq("user_id", pilotUserId)
      .single();

    const { data: iban } = await supabase.rpc("get_pilot_iban_for_payout", {
      p_user_id: pilotUserId,
    });

    if (!iban) {
      try {
        await insertLedger(supabase, {
          booking_id: bookingId,
          type: "payout_failed",
          amount_eur: amount,
          idempotency_key: `payout_failed:no_iban:${bookingId}`,
          metadata: { reason: "missing_iban" },
        });
      } catch (e) {
        console.error(`[process-payouts] insertLedger failed for ${bookingId}:`, e);
      }
      try {
        await incrementPayoutFailedCount(supabase, bookingId);
      } catch (e) {
        console.error(`[process-payouts] increment failed for ${bookingId}:`, e);
      }
      failed += 1;
      continue;
    }

    let connectAccountId = pilotProfile?.stripe_connect_account_id as string | null;

    try {
      if (stripe && !connectAccountId) {
        const { data: authUser } = await supabase.auth.admin.getUserById(pilotUserId);

        const result = await ensurePilotConnectAccount(stripe, {
          pilotUserId,
          email: authUser.user?.email,
          iban: String(iban),
          accountHolderName: pilotProfile?.account_holder_name ?? "Pilot",
          existingAccountId: null,
        });
        connectAccountId = result.accountId;

        await supabase
          .from("pilot_profiles")
          .update({ stripe_connect_account_id: connectAccountId })
          .eq("user_id", pilotUserId);
      }

      let transferId = `stub_tr_${bookingId}`;

      if (stripe && connectAccountId) {
        const result = await transferToPilot(stripe, {
          amountEur: amount,
          connectAccountId,
          bookingId,
          idempotencyKey: `payout:${bookingId}`,
        });
        transferId = result.transferId;
      }

      await supabase
        .from("flight_booking_requests")
        .update({ paid_out_at: now, stripe_transfer_id: transferId })
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
      try {
        await insertLedger(supabase, {
          booking_id: bookingId,
          type: "payout_failed",
          amount_eur: amount,
          idempotency_key: `payout_failed:${bookingId}`,
          metadata: { error: msg },
        });
      } catch (ledgerErr) {
        console.error(
          `[process-payouts] insertLedger failed for ${bookingId}:`,
          ledgerErr,
        );
      }
      try {
        await incrementPayoutFailedCount(supabase, bookingId);
      } catch (incErr) {
        console.error(
          `[process-payouts] increment failed for ${bookingId}:`,
          incErr,
        );
      }
      failed += 1;
    }
  }

  return new Response(JSON.stringify({ ok: true, paid, failed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
