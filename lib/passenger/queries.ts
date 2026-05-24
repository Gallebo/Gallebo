import { averageRating } from "@/lib/pilot/review-stats";
import { airfieldCityName } from "@/lib/flights/route-meta";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/lib/bookings/constants";

export type PassengerSidebarContext = {
  firstName: string;
  lastName: string;
  initials: string;
  idVerified: boolean;
  activeBookings: number;
};

export type PassengerBookingV3 = {
  id: string;
  status: BookingStatus;
  created_at: string;
  payment_expires_at: string | null;
  passenger_amount_eur: number | null;
  paid_at: string | null;
  refunded_at: string | null;
  flight: {
    id: string;
    flight_date: string;
    departure_time: string;
    price_per_passenger_eur: number;
    pilot_user_id: string;
    pilot: {
      first_name: string | null;
      last_name: string | null;
      rating: number | null;
    } | null;
    departure: { name: string; icao_code: string } | null;
    arrival: { name: string; icao_code: string } | null;
    aircraft: { model: string | null; registration: string | null } | null;
  };
};

export type PassengerReviewRow = {
  id: string;
  pilotName: string;
  routeLabel: string;
  flightDate: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type PendingReviewRow = {
  bookingId: string;
  flightId: string;
  pilot_user_id: string;
  routeLabel: string;
  flight_date: string;
};

function initials(first: string | null, last: string | null): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "P";
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatFlightDateTime(iso: string, time: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${date}, ${time.slice(0, 5)} local`;
}

async function pilotRatingsMap(
  pilotIds: string[],
): Promise<Map<string, number>> {
  if (!pilotIds.length) return new Map();
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("pilot_reviews_public")
    .select("pilot_user_id, rating")
    .in("pilot_user_id", pilotIds);

  const buckets = new Map<string, number[]>();
  for (const r of reviews ?? []) {
    if (!r.pilot_user_id || r.rating === null) continue;
    const list = buckets.get(r.pilot_user_id) ?? [];
    list.push(r.rating);
    buckets.set(r.pilot_user_id, list);
  }

  const out = new Map<string, number>();
  for (const [id, ratings] of buckets) {
    const avg = averageRating(ratings);
    if (avg !== null) out.set(id, avg);
  }
  return out;
}

export async function getPassengerSidebarContext(
  userId: string,
): Promise<PassengerSidebarContext> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, status")
    .eq("id", userId)
    .single();

  const { count } = await supabase
    .from("flight_booking_requests")
    .select("id", { count: "exact", head: true })
    .eq("passenger_user_id", userId)
    .in("status", ["pending", "accepted", "confirmed"]);

  return {
    firstName: profile?.first_name ?? "Passenger",
    lastName: profile?.last_name ?? "",
    initials: initials(profile?.first_name ?? null, profile?.last_name ?? null),
    idVerified: profile?.status === "verified",
    activeBookings: count ?? 0,
  };
}

export async function getPassengerBookingsV3(
  userId: string,
): Promise<PassengerBookingV3[]> {
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
      `
      id, flight_date, departure_time, price_per_passenger_eur, pilot_user_id, aircraft_id,
      departure_airfield:airfields!flights_departure_airfield_id_fkey ( name, icao_code ),
      arrival_airfield:airfields!flights_arrival_airfield_id_fkey ( name, icao_code ),
      aircraft ( model, registration )
    `,
    )
    .in("id", flightIds);

  const flightMap = new Map((flights ?? []).map((f) => [f.id, f]));
  const pilotIds = [
    ...new Set((flights ?? []).map((f) => f.pilot_user_id).filter(Boolean)),
  ];

  const { data: pilots } = await supabase
    .from("profiles_public")
    .select("id, first_name, last_name")
    .in("id", pilotIds.length ? pilotIds : ["00000000-0000-0000-0000-000000000000"]);

  const pilotMap = new Map((pilots ?? []).map((p) => [p.id, p]));
  const ratingMap = await pilotRatingsMap(pilotIds);

  return bookings.map((b) => {
    const flight = flightMap.get(b.flight_id);
    const dep = flight?.departure_airfield as { name: string; icao_code: string } | null;
    const arr = flight?.arrival_airfield as { name: string; icao_code: string } | null;
    const aircraft = flight?.aircraft as {
      model: string | null;
      registration: string | null;
    } | null;
    const pilot = flight ? pilotMap.get(flight.pilot_user_id) : null;
    const pilotUserId = flight?.pilot_user_id ?? "";

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
        departure_time: String(flight?.departure_time ?? "").slice(0, 5),
        price_per_passenger_eur: Number(flight?.price_per_passenger_eur ?? 0),
        pilot_user_id: pilotUserId,
        pilot: pilot
          ? {
              first_name: pilot.first_name,
              last_name: pilot.last_name,
              rating: ratingMap.get(pilotUserId) ?? null,
            }
          : null,
        departure: dep,
        arrival: arr,
        aircraft: aircraft
          ? { model: aircraft.model, registration: aircraft.registration }
          : null,
      },
    };
  });
}

export async function getPassengerOverviewData(userId: string) {
  const sidebar = await getPassengerSidebarContext(userId);
  const allBookings = await getPassengerBookingsV3(userId);
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = allBookings.filter(
    (b) =>
      ["pending", "accepted", "confirmed"].includes(b.status) &&
      b.flight.flight_date >= today,
  );

  const completed = allBookings.filter((b) => b.status === "completed");
  const amounts = completed
    .map((b) => Number(b.passenger_amount_eur ?? b.flight.price_per_passenger_eur))
    .filter((n) => n > 0);
  const avgCost =
    amounts.length > 0
      ? Math.round(amounts.reduce((s, n) => s + n, 0) / amounts.length)
      : 0;

  const next = upcoming[0];

  const supabase = await createClient();
  const { count: flightsAvailable } = await supabase
    .from("flights")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("flight_date", today);

  return {
    sidebar,
    upcoming: upcoming.slice(0, 3),
    upcomingCount: upcoming.length,
    nextDepartureLabel: next
      ? formatShortDate(next.flight.flight_date)
      : "—",
    stats: {
      upcoming: upcoming.length,
      completed: completed.length,
      avgCost,
    },
    flightsAvailable: flightsAvailable ?? 0,
  };
}

export async function getPassengerReviews(userId: string): Promise<{
  reviews: PassengerReviewRow[];
  pending: PendingReviewRow[];
}> {
  const supabase = await createClient();

  const { data: myReviews } = await supabase
    .from("pilot_reviews")
    .select("id, pilot_user_id, rating, comment, created_at")
    .eq("reviewer_user_id", userId)
    .order("created_at", { ascending: false });

  const pilotIds = [...new Set((myReviews ?? []).map((r) => r.pilot_user_id))];
  const { data: pilots } = await supabase
    .from("profiles_public")
    .select("id, first_name, last_name")
    .in(
      "id",
      pilotIds.length ? pilotIds : ["00000000-0000-0000-0000-000000000000"],
    );
  const pilotMap = new Map((pilots ?? []).map((p) => [p.id, p]));

  const { data: completedBookings } = await supabase
    .from("flight_booking_requests")
    .select("id, flight_id")
    .eq("passenger_user_id", userId)
    .eq("status", "completed");

  const flightIds = [...new Set((completedBookings ?? []).map((b) => b.flight_id))];
  const flightMeta = new Map<string, { route: string; date: string; pilotId: string }>();

  if (flightIds.length) {
    const { data: flights } = await supabase
      .from("flights")
      .select(
        `
        id, flight_date, pilot_user_id,
        departure_airfield:airfields!flights_departure_airfield_id_fkey ( icao_code ),
        arrival_airfield:airfields!flights_arrival_airfield_id_fkey ( icao_code )
      `,
      )
      .in("id", flightIds);

    for (const f of flights ?? []) {
      const dep = (f.departure_airfield as { icao_code: string } | null)?.icao_code ?? "—";
      const arr = (f.arrival_airfield as { icao_code: string } | null)?.icao_code ?? "—";
      flightMeta.set(f.id, {
        route: `${dep} → ${arr}`,
        date: f.flight_date,
        pilotId: f.pilot_user_id,
      });
    }
  }

  const reviewedPilotIds = new Set((myReviews ?? []).map((r) => r.pilot_user_id));

  const reviews: PassengerReviewRow[] = (myReviews ?? []).map((r) => {
    const pilot = pilotMap.get(r.pilot_user_id);
    const name =
      `${pilot?.first_name ?? ""} ${pilot?.last_name ?? ""}`.trim() || "Pilot";
    const booking = (completedBookings ?? []).find((b) => {
      const meta = flightMeta.get(b.flight_id);
      return meta?.pilotId === r.pilot_user_id;
    });
    const meta = booking ? flightMeta.get(booking.flight_id) : null;

    return {
      id: r.id,
      pilotName: name,
      routeLabel: meta?.route ?? "—",
      flightDate: meta?.date ? formatShortDate(meta.date) : "—",
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
    };
  });

  const pending: PendingReviewRow[] = [];
  for (const b of completedBookings ?? []) {
    const meta = flightMeta.get(b.flight_id);
    if (!meta || reviewedPilotIds.has(meta.pilotId)) continue;
    pending.push({
      bookingId: b.id,
      flightId: b.flight_id,
      pilot_user_id: meta.pilotId,
      routeLabel: meta.route,
      flight_date: meta.date,
    });
    reviewedPilotIds.add(meta.pilotId);
  }

  return { reviews, pending };
}

export async function getPassengerProfileData(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, status, phone_encrypted")
    .eq("id", userId)
    .single();

  const { data: settings } = await supabase
    .from("user_notification_settings")
    .select("email_enabled, push_enabled, in_app_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  const emailVerified = Boolean(user?.email_confirmed_at);
  const phoneVerified = Boolean(profile?.phone_encrypted);

  return {
    firstName: profile?.first_name ?? "",
    lastName: profile?.last_name ?? "",
    email: user?.email ?? "",
    idVerified: profile?.status === "verified",
    emailVerified,
    phoneVerified,
    notificationsLabel:
      settings?.email_enabled && settings?.push_enabled
        ? "Email + push"
        : settings?.email_enabled
          ? "Email"
          : settings?.push_enabled
            ? "Push"
            : "In-app only",
  };
}

export { formatFlightDateTime, formatShortDate, airfieldCityName };
