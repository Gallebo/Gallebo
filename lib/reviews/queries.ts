import { averageRating } from "@/lib/pilot/review-stats";
import { createClient } from "@/lib/supabase/server";

export type PublicPilotReviewRow = {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  communication_rating: number | null;
  accuracy_rating: number | null;
  experience_rating: number | null;
};

export type PilotPendingReviewRow = {
  bookingId: string;
  flightId: string;
  passenger_user_id: string;
  passengerName: string;
  routeLabel: string;
  flight_date: string;
  review_deadline_at: string | null;
};

export type PassengerReceivedReviewRow = {
  id: string;
  pilotName: string;
  rating: number;
  comment: string | null;
  submitted_at: string | null;
  bookingId: string;
  accuracy_rating: number;
  behavior_rating: number;
  weight_accuracy_rating: number;
};

export async function getPilotReviews(pilotId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pilot_reviews_public")
    .select(
      "id, rating, comment, created_at, communication_rating, accuracy_rating, experience_rating",
    )
    .eq("pilot_user_id", pilotId)
    .order("created_at", { ascending: false });

  return (data ?? []) as PublicPilotReviewRow[];
}

export async function getPassengerReviews(passengerId: string) {
  const supabase = await createClient();

  const { data: rawReviews } = await supabase
    .from("passenger_reviews")
    .select(
      "id, booking_id, pilot_user_id, rating, comment, submitted_at, accuracy_rating, behavior_rating, weight_accuracy_rating",
    )
    .eq("passenger_user_id", passengerId)
    .eq("is_visible", true)
    .order("submitted_at", { ascending: false });

  const reviews = rawReviews ?? [];
  if (!reviews.length) {
    return { reviews: [] as PassengerReceivedReviewRow[], avgRating: null };
  }

  const pilotIds = [...new Set(reviews.map((r) => r.pilot_user_id))];
  const { data: pilots } = await supabase
    .from("profiles_public")
    .select("id, first_name, last_name")
    .in("id", pilotIds);

  const pilotMap = new Map(
    (pilots ?? []).map((p) => [
      p.id as string,
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Pilot",
    ]),
  );

  const mapped: PassengerReceivedReviewRow[] = reviews.map((r) => ({
    id: r.id as string,
    bookingId: r.booking_id as string,
    pilotName: pilotMap.get(r.pilot_user_id as string) ?? "Pilot",
    rating: r.rating as number,
    comment: r.comment as string | null,
    submitted_at: r.submitted_at as string | null,
    accuracy_rating: r.accuracy_rating as number,
    behavior_rating: r.behavior_rating as number,
    weight_accuracy_rating: r.weight_accuracy_rating as number,
  }));

  const ratings = mapped.map((r) => r.rating);
  const avg = averageRating(ratings);

  return { reviews: mapped, avgRating: avg };
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export async function getPilotPendingReviews(
  pilotId: string,
): Promise<PilotPendingReviewRow[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: completedBookings } = await supabase
    .from("flight_booking_requests")
    .select(
      "id, flight_id, passenger_user_id, review_deadline_at, flights!inner(pilot_user_id, flight_date, departure_airfield:airfields!flights_departure_airfield_id_fkey (icao_code), arrival_airfield:airfields!flights_arrival_airfield_id_fkey (icao_code))",
    )
    .eq("status", "completed");

  const eligible = (completedBookings ?? []).filter((b) => {
    const flight = b.flights as {
      pilot_user_id: string;
    } | null;
    if (!flight || flight.pilot_user_id !== pilotId) return false;
    if (!b.review_deadline_at) return false;
    return b.review_deadline_at > nowIso;
  });

  if (!eligible.length) return [];

  const bookingIds = eligible.map((b) => b.id);

  const { data: submittedReviews } = await supabase
    .from("passenger_reviews")
    .select("booking_id")
    .eq("pilot_user_id", pilotId)
    .in("booking_id", bookingIds);

  const doneBookingIds = new Set(
    (submittedReviews ?? []).map((r) => r.booking_id as string),
  );

  const pending = eligible.filter((b) => !doneBookingIds.has(b.id));
  if (!pending.length) return [];

  const passengerIds = [
    ...new Set(pending.map((b) => b.passenger_user_id as string)),
  ];
  const { data: passengers } = await supabase
    .from("profiles_public")
    .select("id, first_name, last_name")
    .in("id", passengerIds);

  const passengerMap = new Map(
    (passengers ?? []).map((p) => [
      p.id as string,
      `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Passenger",
    ]),
  );

  return pending.map((b) => {
    const flight = b.flights as {
      flight_date: string;
      departure_airfield: { icao_code: string } | null;
      arrival_airfield: { icao_code: string } | null;
    };
    const dep = flight.departure_airfield?.icao_code ?? "—";
    const arr = flight.arrival_airfield?.icao_code ?? "—";

    return {
      bookingId: b.id,
      flightId: b.flight_id,
      passenger_user_id: b.passenger_user_id as string,
      passengerName:
        passengerMap.get(b.passenger_user_id as string) ?? "Passenger",
      routeLabel: `${dep} → ${arr}`,
      flight_date: formatShortDate(flight.flight_date),
      review_deadline_at: b.review_deadline_at,
    };
  });
}

