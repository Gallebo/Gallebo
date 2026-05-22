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

  const flightList = flights ?? [];
  const flightIds = flightList.map((f) => f.id);

  const bookingsByFlight = new Map<
    string,
    { id: string; passenger_user_id: string }[]
  >();

  if (flightIds.length > 0) {
    const { data: allBookings, error: bookingErr } = await supabase
      .from("flight_booking_requests")
      .select("id, passenger_user_id, flight_id")
      .in("flight_id", flightIds)
      .eq("status", "confirmed");

    if (bookingErr) {
      return new Response(JSON.stringify({ ok: false, error: bookingErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    for (const b of allBookings ?? []) {
      const list = bookingsByFlight.get(b.flight_id) ?? [];
      list.push({ id: b.id, passenger_user_id: b.passenger_user_id });
      bookingsByFlight.set(b.flight_id, list);
    }
  }

  const participantIds = new Set<string>();
  for (const flight of flightList) {
    if (flight.pilot_user_id) participantIds.add(flight.pilot_user_id);
    for (const b of bookingsByFlight.get(flight.id) ?? []) {
      participantIds.add(b.passenger_user_id);
    }
  }

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const alreadyReminded = new Set<string>();
  const participantIdList = [...participantIds];
  if (participantIdList.length > 0) {
    const { data: existingReminders } = await supabase
      .from("notification_queue")
      .select("user_id")
      .eq("type", "flight_reminder_24h")
      .gte("created_at", dayStart.toISOString())
      .in("user_id", participantIdList);

    for (const row of existingReminders ?? []) {
      alreadyReminded.add(row.user_id);
    }
  }

  for (const flight of flightList) {
    const bookings = bookingsByFlight.get(flight.id) ?? [];

    for (const b of bookings) {
      if (alreadyReminded.has(b.passenger_user_id)) continue;

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

      alreadyReminded.add(b.passenger_user_id);
      queued += 1;
    }

    if (flight.pilot_user_id && !alreadyReminded.has(flight.pilot_user_id)) {
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

      alreadyReminded.add(flight.pilot_user_id);
      queued += 1;
    }
  }

  return new Response(JSON.stringify({ ok: true, targetDate, queued }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
