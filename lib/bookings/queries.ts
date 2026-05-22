import { weightFromDbValue } from "@/lib/crypto/weight";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PassengerBookingRow } from "@/components/bookings/passenger-booking-card";
import type { PilotBookingRow } from "@/components/bookings/pilot-booking-card";
import type { BookingStatus } from "@/lib/bookings/constants";

type BookingBase = {
  id: string;
  status: string;
  created_at: string;
  payment_expires_at: string | null;
  passenger_amount_eur: number | null;
  pilot_payout_eur: number | null;
  paid_at: string | null;
  refunded_at: string | null;
  passenger_user_id: string;
  flight_id: string;
};

type FlightBase = {
  id: string;
  flight_date: string;
  departure_time: string;
  price_per_passenger_eur: number;
  pilot_user_id: string;
  departure_airfield_id: string;
  arrival_airfield_id: string;
  status: string;
};

export async function getPassengerBookings(
  userId: string,
): Promise<PassengerBookingRow[]> {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("flight_booking_requests")
    .select(
      "id, status, created_at, payment_expires_at, passenger_amount_eur, paid_at, refunded_at, flight_id",
    )
    .eq("passenger_user_id", userId)
    .order("created_at", { ascending: false });

  if (!bookings?.length) return [];

  const flightIds = [...new Set(bookings.map((b) => b.flight_id))];
  const { data: flights } = await supabase
    .from("flights")
    .select(
      "id, flight_date, departure_time, price_per_passenger_eur, pilot_user_id, departure_airfield_id, arrival_airfield_id",
    )
    .in("id", flightIds);

  const flightMap = new Map((flights ?? []).map((f) => [f.id, f as FlightBase]));
  const pilotIds = [...new Set((flights ?? []).map((f) => f.pilot_user_id))];
  const airfieldIds = [
    ...new Set(
      (flights ?? []).flatMap((f) => [
        f.departure_airfield_id,
        f.arrival_airfield_id,
      ]),
    ),
  ];

  const { data: pilots } = await supabase
    .from("profiles_public")
    .select("id, first_name, last_name")
    .in("id", pilotIds);

  const { data: airfields } = await supabase
    .from("airfields")
    .select("id, name, icao_code")
    .in("id", airfieldIds);

  const pilotMap = new Map((pilots ?? []).map((p) => [p.id, p]));
  const airfieldMap = new Map((airfields ?? []).map((a) => [a.id, a]));

  return bookings.map((b) => {
    const flight = flightMap.get(b.flight_id);
    const dep = flight
      ? airfieldMap.get(flight.departure_airfield_id)
      : null;
    const arr = flight ? airfieldMap.get(flight.arrival_airfield_id) : null;
    const pilot = flight ? pilotMap.get(flight.pilot_user_id) : null;

    return {
      id: b.id,
      status: b.status as BookingStatus,
      created_at: b.created_at,
      payment_expires_at: b.payment_expires_at,
      passenger_amount_eur: b.passenger_amount_eur,
      paid_at: b.paid_at,
      refunded_at: b.refunded_at,
      flight: {
        id: b.flight_id,
        flight_date: flight?.flight_date ?? "",
        departure_time: flight?.departure_time ?? "",
        price_per_passenger_eur: Number(flight?.price_per_passenger_eur ?? 0),
        pilot: pilot ?? null,
        departure: dep ?? null,
        arrival: arr ?? null,
      },
    };
  });
}

export async function getPilotBookings(
  pilotUserId: string,
): Promise<{ bookings: PilotBookingRow[]; weightByFlight: Map<string, string> }> {
  const supabase = await createClient();

  const { data: flights } = await supabase
    .from("flights")
    .select("id")
    .eq("pilot_user_id", pilotUserId);

  const flightIds = (flights ?? []).map((f) => f.id);
  if (!flightIds.length) {
    return { bookings: [], weightByFlight: new Map() };
  }

  const { data: bookings } = await supabase
    .from("flight_booking_requests")
    .select(
      "id, status, created_at, pilot_payout_eur, passenger_user_id, flight_id",
    )
    .in("flight_id", flightIds)
    .order("created_at", { ascending: false });

  if (!bookings?.length) {
    return { bookings: [], weightByFlight: new Map() };
  }

  const passengerIds = [...new Set(bookings.map((b) => b.passenger_user_id))];
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name, weight_encrypted")
    .in("id", passengerIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => {
      let weightKg: number | null = null;
      if (p.weight_encrypted) {
        try {
          weightKg = weightFromDbValue(p.weight_encrypted);
        } catch {
          weightKg = null;
        }
      }
      return [p.id, { ...p, weightKg }];
    }),
  );

  const { data: flightRows } = await supabase
    .from("flights")
    .select("id, flight_date, price_per_passenger_eur, status, aircraft_id")
    .in("id", flightIds);

  const flightMap = new Map((flightRows ?? []).map((f) => [f.id, f]));

  const weightByFlight = new Map<string, string>();

  for (const flightId of flightIds) {
    const flight = flightMap.get(flightId);
    if (!flight?.aircraft_id) continue;

    const { data: aircraft } = await supabase
      .from("aircraft")
      .select("max_passenger_weight_kg")
      .eq("id", flight.aircraft_id)
      .maybeSingle();

    const max = aircraft?.max_passenger_weight_kg;
    if (max == null) continue;

    const flightBookings = bookings.filter(
      (b) =>
        b.flight_id === flightId &&
        ["pending", "accepted", "confirmed"].includes(b.status),
    );
    const total = flightBookings.reduce((sum, b) => {
      const w = profileMap.get(b.passenger_user_id)?.weightKg;
      return sum + (w != null ? w : 0);
    }, 0);

    if (total > Number(max)) {
      weightByFlight.set(
        flightId,
        `Weight warning: ${total.toFixed(0)} kg total exceeds aircraft limit (${max} kg)`,
      );
    }
  }

  const rows: PilotBookingRow[] = bookings.map((b) => {
    const flight = flightMap.get(b.flight_id);
    const passenger = profileMap.get(b.passenger_user_id);
    return {
      id: b.id,
      status: b.status as BookingStatus,
      created_at: b.created_at,
      pilot_payout_eur: b.pilot_payout_eur,
      passenger: passenger
        ? {
            first_name: passenger.first_name,
            last_name: passenger.last_name,
            weight_kg: passenger.weightKg,
          }
        : null,
      flight: {
        id: b.flight_id,
        flight_date: flight?.flight_date ?? "",
        price_per_passenger_eur: Number(flight?.price_per_passenger_eur ?? 0),
        status: flight?.status ?? "",
      },
    };
  });

  return { bookings: rows, weightByFlight };
}
