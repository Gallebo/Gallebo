import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { createAdminClient } from "../_shared/supabase.ts";

function tomorrowUtcDateString(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
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
  const targetDate = tomorrowUtcDateString();
  let queued = 0;

  const { data: flights, error: flightErr } = await supabase
    .from("flights")
    .select("id, pilot_user_id, flight_date, departure_time")
    .eq("flight_date", targetDate)
    .eq("status", "published");

  if (flightErr) {
    return new Response(JSON.stringify({ ok: false, error: flightErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  for (const flight of flights ?? []) {
    const { data: bookings } = await supabase
      .from("flight_booking_requests")
      .select("id, passenger_user_id")
      .eq("flight_id", flight.id)
      .eq("status", "confirmed");

    const participants = new Set<string>();
    if (flight.pilot_user_id) participants.add(flight.pilot_user_id);

    for (const b of bookings ?? []) {
      participants.add(b.passenger_user_id);

      const { data: existing } = await supabase
        .from("notification_queue")
        .select("id")
        .eq("user_id", b.passenger_user_id)
        .eq("type", "flight_reminder_24h")
        .gte("created_at", dayStart.toISOString())
        .limit(1);

      if (existing?.length) continue;

      const payload = {
        bookingId: b.id,
        flightId: flight.id,
        flightDate: flight.flight_date,
        departureTime: flight.departure_time,
      };

      const { data: settings } = await supabase
        .from("user_notification_settings")
        .select("email_enabled, in_app_enabled")
        .eq("user_id", b.passenger_user_id)
        .maybeSingle();

      if (settings?.email_enabled !== false) {
        await supabase.from("notification_queue").insert({
          user_id: b.passenger_user_id,
          type: "flight_reminder_24h",
          payload,
        });
      }

      if (settings?.in_app_enabled !== false) {
        await supabase.from("in_app_notifications").insert({
          user_id: b.passenger_user_id,
          type: "flight_reminder_24h",
          title: "Flight reminder",
          body: `Your flight on ${flight.flight_date} departs in about 24 hours.`,
          booking_id: b.id,
          flight_id: flight.id,
        });
      }

      queued += 1;
    }

    if (flight.pilot_user_id) {
      const { data: existingPilot } = await supabase
        .from("notification_queue")
        .select("id")
        .eq("user_id", flight.pilot_user_id)
        .eq("type", "flight_reminder_24h")
        .gte("created_at", dayStart.toISOString())
        .limit(1);

      if (!existingPilot?.length) {
        const payload = {
          flightId: flight.id,
          flightDate: flight.flight_date,
          departureTime: flight.departure_time,
          role: "pilot",
        };

        const { data: pilotSettings } = await supabase
          .from("user_notification_settings")
          .select("email_enabled, in_app_enabled")
          .eq("user_id", flight.pilot_user_id)
          .maybeSingle();

        if (pilotSettings?.email_enabled !== false) {
          await supabase.from("notification_queue").insert({
            user_id: flight.pilot_user_id,
            type: "flight_reminder_24h",
            payload,
          });
        }

        if (pilotSettings?.in_app_enabled !== false) {
          await supabase.from("in_app_notifications").insert({
            user_id: flight.pilot_user_id,
            type: "flight_reminder_24h",
            title: "Flight reminder",
            body: `You have a flight on ${flight.flight_date} in about 24 hours.`,
            flight_id: flight.id,
          });
        }

        queued += 1;
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, targetDate, queued }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
