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
  let expiredPilot = 0;
  let expiredPayment = 0;

  const { data: noResponse, error: err1 } = await supabase
    .from("flight_booking_requests")
    .select("id, passenger_user_id, flight_id")
    .eq("status", "pending")
    .lt("pilot_response_expires_at", now);

  if (err1) {
    console.error("[booking-expiry] pending fetch:", err1.message);
    return new Response(JSON.stringify({ ok: false, error: err1.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  for (const b of noResponse ?? []) {
    const { error } = await supabase
      .from("flight_booking_requests")
      .update({ status: "expired", payout_status: "not_applicable" })
      .eq("id", b.id)
      .eq("status", "pending");

    if (!error) {
      expiredPilot += 1;
      await supabase.from("chat_messages").insert({
        booking_id: b.id,
        sender_user_id: null,
        content: "Booking je istekao — pilot nije odgovorio u roku od 48 sati.",
        is_system: true,
      });
      const { data: settings } = await supabase
        .from("user_notification_settings")
        .select("email_enabled, in_app_enabled")
        .eq("user_id", b.passenger_user_id)
        .maybeSingle();
      if (settings?.email_enabled !== false) {
        await supabase.from("notification_queue").insert({
          user_id: b.passenger_user_id,
          type: "booking_expired_no_response",
          payload: { bookingId: b.id, flightId: b.flight_id },
        });
      }
      if (settings?.in_app_enabled !== false) {
        await supabase.from("in_app_notifications").insert({
          user_id: b.passenger_user_id,
          type: "booking_expired_no_response",
          title: "Booking expired",
          body: "The pilot did not respond in time.",
          booking_id: b.id,
          flight_id: b.flight_id,
        });
      }
    }
  }

  const { data: unpaid, error: err2 } = await supabase
    .from("flight_booking_requests")
    .select("id, passenger_user_id, flight_id")
    .eq("status", "accepted")
    .lt("payment_expires_at", now);

  if (err2) {
    console.error("[booking-expiry] accepted fetch:", err2.message);
    return new Response(JSON.stringify({ ok: false, error: err2.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  for (const b of unpaid ?? []) {
    const { error } = await supabase
      .from("flight_booking_requests")
      .update({ status: "expired", payout_status: "not_applicable" })
      .eq("id", b.id)
      .eq("status", "accepted");

    if (!error) {
      expiredPayment += 1;
      await supabase.from("chat_messages").insert({
        booking_id: b.id,
        sender_user_id: null,
        content: "Booking je istekao — plaćanje nije izvršeno u roku od 30 minuta.",
        is_system: true,
      });
      const { data: settings } = await supabase
        .from("user_notification_settings")
        .select("email_enabled, in_app_enabled")
        .eq("user_id", b.passenger_user_id)
        .maybeSingle();
      if (settings?.email_enabled !== false) {
        await supabase.from("notification_queue").insert({
          user_id: b.passenger_user_id,
          type: "booking_expired_no_response",
          payload: {
            bookingId: b.id,
            flightId: b.flight_id,
            reason: "payment_timeout",
          },
        });
      }
      if (settings?.in_app_enabled !== false) {
        await supabase.from("in_app_notifications").insert({
          user_id: b.passenger_user_id,
          type: "booking_expired_no_response",
          title: "Booking expired",
          body: "Payment was not received in time.",
          booking_id: b.id,
          flight_id: b.flight_id,
        });
      }
    }
  }

  console.log(
    `[booking-expiry] pilot_timeout=${expiredPilot} payment_timeout=${expiredPayment}`,
  );

  return new Response(
    JSON.stringify({
      ok: true,
      expiredPilot,
      expiredPayment,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
