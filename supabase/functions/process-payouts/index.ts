import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { ensurePilotConnectAccount, getStripeClient, transferToPilot } from "../_shared/connect.ts";

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

  // Step A: Join to flights to get pilot_user_id. There is no direct FK from
  // flight_booking_requests to pilot_profiles, so pilot_profiles!inner cannot
  // be resolved by PostgREST from this table. pilot_profiles are fetched via a
  // separate batch query below (Step B).
  const { data: bookings, error } = await supabase
    .from("flight_booking_requests")
    .select(
      `
      id, pilot_payout_eur, payout_after, payout_failed_count, stripe_charge_id,
      flights!inner(pilot_user_id)
    `,
    )
    .eq("status", "completed")
    .eq("payout_status", "pending")
    .not("stripe_charge_id", "is", null)
    .lte("payout_after", now)
    .lt("payout_failed_count", MAX_PAYOUT_RETRIES);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step B: Batch-fetch pilot_profiles for all pilots in this batch.
  const pilotUserIds = [
    ...new Set(
      (bookings ?? []).map(
        (b) => (b.flights as { pilot_user_id: string }).pilot_user_id,
      ),
    ),
  ];

  const { data: pilotProfiles } = await supabase
    .from("pilot_profiles")
    .select("user_id, stripe_account_id, stripe_onboarding_complete")
    .in("user_id", pilotUserIds);

  const profileMap = new Map(
    (pilotProfiles ?? []).map((p) => [p.user_id, p]),
  );

  const stripe = getStripeClient();

  let paid = 0;
  let failed = 0;

  for (const row of bookings ?? []) {
    const bookingId = row.id as string;
    const amount = Number(row.pilot_payout_eur ?? 0);
    const chargeId = row.stripe_charge_id as string;

    // Step C: Use profileMap — replaces the broken pilot_profiles!inner join.
    const pilotUserId = (row.flights as { pilot_user_id: string }).pilot_user_id;
    const pilotProfile = profileMap.get(pilotUserId);

    // Skip if onboarding not complete (replicates the old .eq filter).
    if (!pilotProfile?.stripe_onboarding_complete) continue;

    if (amount <= 0) {
      await supabase
        .from("flight_booking_requests")
        .update({ payout_status: "not_applicable", paid_out_at: now })
        .eq("id", bookingId);
      continue;
    }

    let connectAccountId = pilotProfile.stripe_account_id ?? null;

    try {
      if (stripe && !connectAccountId) {
        // Safety net: should have an account because stripe_onboarding_complete = true,
        // but attempt to create one if somehow missing.
        // pilotUserId is already in scope from Step C — no inner query needed.
        const { data: authUser } = await supabase.auth.admin.getUserById(pilotUserId);
        const result = await ensurePilotConnectAccount(stripe, supabase, {
          pilotUserId,
          email: authUser.user?.email,
          existingAccountId: null,
        });
        connectAccountId = result.accountId;
      }

      let transferId = `stub_tr_${bookingId}`;

      if (stripe && connectAccountId) {
        const result = await transferToPilot(stripe, {
          amountEur: amount,
          connectAccountId,
          bookingId,
          chargeId,
          idempotencyKey: `payout:${bookingId}`,
        });
        transferId = result.transferId;
      }

      await supabase
        .from("flight_booking_requests")
        .update({
          payout_status: "paid",
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

      // Step D: pilotUserId is already in scope — no second DB query needed.
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
          idempotency_key: `payout_failed:${bookingId}:${Date.now()}`,
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
