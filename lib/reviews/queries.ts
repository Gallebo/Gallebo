import { averageRating } from "@/lib/pilot/review-stats";
import { createClient } from "@/lib/supabase/server";

export type ReviewSubmissionState = "none" | "awaiting_reveal" | "revealed";

export type OwnPilotReviewForForm = {
  communicationRating: number | null;
  accuracyRating: number | null;
  experienceRating: number | null;
  comment: string | null;
};

export type OwnPassengerReviewForForm = {
  accuracyRating: number | null;
  behaviorRating: number | null;
  weightAccuracyRating: number | null;
  comment: string | null;
};

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

export type PilotReviewsPageData = {
  pending: PilotPendingReviewRow[];
  awaitingReveal: PilotPendingReviewRow[];
};

export type PassengerReceivedReviewRow = {
  id: string;
  pilotName: string;
  rating: number;
  comment: string | null;
  submitted_at: string | null;
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
    .from("passenger_reviews_public")
    .select(
      "id, pilot_user_id, rating, comment, submitted_at, accuracy_rating, behavior_rating, weight_accuracy_rating",
    )
    .eq("passenger_user_id", passengerId)
    .order("submitted_at", { ascending: false });

  const reviews = rawReviews ?? [];
  if (!reviews.length) {
    return { reviews: [] as PassengerReceivedReviewRow[], avgRating: null };
  }

  const pilotIds = [...new Set(reviews.map((r) => r.pilot_user_id as string))];
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

export async function getOwnPilotReviewSubmission(
  bookingId: string,
  reviewerUserId: string,
): Promise<{
  state: ReviewSubmissionState;
  review: OwnPilotReviewForForm | null;
}> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pilot_reviews")
    .select(
      "is_visible, communication_rating, accuracy_rating, experience_rating, comment",
    )
    .eq("booking_id", bookingId)
    .eq("reviewer_user_id", reviewerUserId)
    .maybeSingle();

  if (!data) {
    return { state: "none", review: null };
  }

  if (!data.is_visible) {
    return { state: "awaiting_reveal", review: null };
  }

  return {
    state: "revealed",
    review: {
      communicationRating: data.communication_rating as number | null,
      accuracyRating: data.accuracy_rating as number | null,
      experienceRating: data.experience_rating as number | null,
      comment: data.comment as string | null,
    },
  };
}

export async function getOwnPassengerReviewSubmission(
  bookingId: string,
  pilotUserId: string,
): Promise<{
  state: ReviewSubmissionState;
  review: OwnPassengerReviewForForm | null;
}> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("passenger_reviews")
    .select(
      "is_visible, accuracy_rating, behavior_rating, weight_accuracy_rating, comment",
    )
    .eq("booking_id", bookingId)
    .eq("pilot_user_id", pilotUserId)
    .maybeSingle();

  if (!data) {
    return { state: "none", review: null };
  }

  if (!data.is_visible) {
    return { state: "awaiting_reveal", review: null };
  }

  return {
    state: "revealed",
    review: {
      accuracyRating: data.accuracy_rating as number | null,
      behaviorRating: data.behavior_rating as number | null,
      weightAccuracyRating: data.weight_accuracy_rating as number | null,
      comment: data.comment as string | null,
    },
  };
}

type CompletedBookingForReview = {
  id: string;
  flight_id: string;
  passenger_user_id: string;
  review_deadline_at: string | null;
  flights: {
    pilot_user_id: string;
    flight_date: string;
    departure_airfield: { icao_code: string } | null;
    arrival_airfield: { icao_code: string } | null;
  };
};

async function mapBookingsToPilotReviewRows(
  bookings: CompletedBookingForReview[],
  passengerMap: Map<string, string>,
): Promise<PilotPendingReviewRow[]> {
  return bookings.map((b) => {
    const flight = b.flights;
    const dep = flight.departure_airfield?.icao_code ?? "—";
    const arr = flight.arrival_airfield?.icao_code ?? "—";

    return {
      bookingId: b.id,
      flightId: b.flight_id,
      passenger_user_id: b.passenger_user_id,
      passengerName: passengerMap.get(b.passenger_user_id) ?? "Passenger",
      routeLabel: `${dep} → ${arr}`,
      flight_date: formatShortDate(flight.flight_date),
      review_deadline_at: b.review_deadline_at,
    };
  });
}

async function fetchPilotEligibleCompletedBookings(pilotId: string) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: completedBookings } = await supabase
    .from("flight_booking_requests")
    .select(
      "id, flight_id, passenger_user_id, review_deadline_at, flights!inner(pilot_user_id, flight_date, departure_airfield:airfields!flights_departure_airfield_id_fkey (icao_code), arrival_airfield:airfields!flights_arrival_airfield_id_fkey (icao_code))",
    )
    .eq("status", "completed");

  return (completedBookings ?? []).filter((b) => {
    const flight = b.flights as { pilot_user_id: string } | null;
    if (!flight || flight.pilot_user_id !== pilotId) return false;
    if (!b.review_deadline_at) return false;
    return b.review_deadline_at > nowIso;
  }) as CompletedBookingForReview[];
}

export async function getPilotReviewsPageData(
  pilotId: string,
): Promise<PilotReviewsPageData> {
  const supabase = await createClient();
  const eligible = await fetchPilotEligibleCompletedBookings(pilotId);

  if (!eligible.length) {
    return { pending: [], awaitingReveal: [] };
  }

  const bookingIds = eligible.map((b) => b.id);

  const { data: submittedReviews } = await supabase
    .from("passenger_reviews")
    .select("booking_id, is_visible")
    .eq("pilot_user_id", pilotId)
    .in("booking_id", bookingIds);

  const reviewByBooking = new Map(
    (submittedReviews ?? []).map((r) => [
      r.booking_id as string,
      r.is_visible as boolean,
    ]),
  );

  const pendingBookings = eligible.filter((b) => !reviewByBooking.has(b.id));
  const awaitingBookings = eligible.filter(
    (b) => reviewByBooking.get(b.id) === false,
  );

  const passengerIds = [
    ...new Set(eligible.map((b) => b.passenger_user_id)),
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

  const [pending, awaitingReveal] = await Promise.all([
    mapBookingsToPilotReviewRows(pendingBookings, passengerMap),
    mapBookingsToPilotReviewRows(awaitingBookings, passengerMap),
  ]);

  return { pending, awaitingReveal };
}

