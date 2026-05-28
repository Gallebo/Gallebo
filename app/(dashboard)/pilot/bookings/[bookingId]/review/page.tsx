import Link from "next/link";
import { notFound } from "next/navigation";

import { PassengerReviewForm } from "@/components/reviews/PassengerReviewForm";
import { ReviewAwaitingRevealBanner } from "@/components/reviews/review-awaiting-reveal-banner";
import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { createClient } from "@/lib/supabase/server";
import { requirePilot } from "@/lib/auth/rbac";
import { formatShortDate } from "@/lib/passenger/queries";
import { getOwnPassengerReviewSubmission } from "@/lib/reviews/queries";

export const metadata = { title: "Review passenger — Gallebo" };

export default async function PilotReviewPassengerPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const { user } = await requirePilot();

  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("flight_booking_requests")
    .select("id, status, review_deadline_at, flight_id, passenger_user_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.status !== "completed") {
    notFound();
  }

  const { data: flight } = await supabase
    .from("flights")
    .select(
      "id, pilot_user_id, flight_date, departure_airfield:airfields!flights_departure_airfield_id_fkey (icao_code), arrival_airfield:airfields!flights_arrival_airfield_id_fkey (icao_code)",
    )
    .eq("id", booking.flight_id)
    .maybeSingle();

  if (!flight || flight.pilot_user_id !== user.id) {
    notFound();
  }

  const isExpired =
    !booking.review_deadline_at ||
    new Date().toISOString() > booking.review_deadline_at;

  const passengerId = booking.passenger_user_id as string;

  const { data: passenger } = await supabase
    .from("profiles_public")
    .select("first_name, last_name")
    .eq("id", passengerId)
    .maybeSingle();

  const passengerName =
    `${passenger?.first_name ?? ""} ${passenger?.last_name ?? ""}`.trim() ||
    "Passenger";

  const routeLabel = `${
    (flight.departure_airfield as { icao_code: string } | null)?.icao_code ?? "—"
  } → ${
    (flight.arrival_airfield as { icao_code: string } | null)?.icao_code ?? "—"
  }`;

  const { state, review } = await getOwnPassengerReviewSubmission(
    bookingId,
    user.id,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PilotPageHeader
        eyebrow="Reviews"
        title="Review your passenger"
        description={`How was the flight with ${passengerName}?`}
      />

      <div
        className="mb-6 rounded-xl border p-5 text-[13px]"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <p style={{ color: "var(--ink)" }}>
          {routeLabel} · {flight.flight_date ? formatShortDate(flight.flight_date) : "—"}
        </p>
      </div>

      {state === "awaiting_reveal" ? (
        <ReviewAwaitingRevealBanner />
      ) : (
        <PassengerReviewForm
          bookingId={bookingId}
          isExpired={isExpired}
          existing={state === "revealed" ? review : null}
        />
      )}

      <div className="mt-6">
        <Link
          href="/pilot/reviews"
          className="text-primary hover:underline"
          style={{ color: "var(--primary-v2)" }}
        >
          Back to Reviews
        </Link>
      </div>
    </div>
  );
}
