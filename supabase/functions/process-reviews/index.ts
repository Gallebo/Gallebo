import { createAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
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
      "id, passenger_user_id, status, review_deadline_at, flights!inner(pilot_user_id)",
    )
    .eq("status", "completed")
    .not("review_deadline_at", "is", null)
    .lte("review_deadline_at", now)
    .is("reviews_processed_at", null);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let processed = 0;
  let failed = 0;
  const errors: { bookingId: string; error: string }[] = [];

  for (const b of bookings ?? []) {
    const bookingId = b.id as string;
    const passengerId = b.passenger_user_id as string;
    const pilotId = (b.flights as { pilot_user_id: string } | null)
      ?.pilot_user_id;

    if (!pilotId) {
      failed += 1;
      errors.push({ bookingId, error: "missing_pilot_user_id" });
      continue;
    }

    const { error: rpcErr } = await supabase.rpc(
      "finalize_expired_booking_reviews",
      {
        p_booking_id: bookingId,
        p_pilot_user_id: pilotId,
        p_passenger_user_id: passengerId,
      },
    );

    if (rpcErr) {
      failed += 1;
      errors.push({ bookingId, error: rpcErr.message });
      continue;
    }

    processed += 1;
  }

  return new Response(
    JSON.stringify({
      ok: failed === 0,
      processed,
      failed,
      errors: errors.length ? errors : undefined,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
