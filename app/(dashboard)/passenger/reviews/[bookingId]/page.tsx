import Link from "next/link";
import { notFound } from "next/navigation";

import { PilotReviewForm } from "@/components/reviews/PilotReviewForm";
import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { createClient } from "@/lib/supabase/server";
import { requireVerifiedPassenger } from "@/lib/auth/rbac";
import { formatShortDate } from "@/lib/passenger/queries";

export const metadata = { title: "Leave a review — Gallebo" };

export default async function PassengerLeavePilotReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const { user } = await requireVerifiedPassenger();

  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("flight_booking_requests")
    .select("id, status, review_deadline_at, flight_id, passenger_user_id")
    .eq("id", bookingId)
    .eq("passenger_user_id", user.id)
    .maybeSingle();

  if (!booking || booking.status !== "completed") {
    notFound();
  }

  const isExpired =
    !booking.review_deadline_at ||
    new Date().toISOString() > booking.review_deadline_at;

  const { data: flight } = await supabase
    .from("flights")
    .select(
      "id, flight_date, pilot_user_id, departure_airfield:airfields!flights_departure_airfield_id_fkey (icao_code), arrival_airfield:airfields!flights_arrival_airfield_id_fkey (icao_code)",
    )
    .eq("id", booking.flight_id)
    .maybeSingle();

  if (!flight) notFound();

  const pilotId = flight.pilot_user_id as string;

  const { data: pilot } = await supabase
    .from("profiles_public")
    .select("first_name, last_name")
    .eq("id", pilotId)
    .maybeSingle();

  const pilotName =
    `${pilot?.first_name ?? ""} ${pilot?.last_name ?? ""}`.trim() || "Pilot";

  const routeLabel = `${
    (flight.departure_airfield as { icao_code: string } | null)?.icao_code ?? "—"
  } → ${
    (flight.arrival_airfield as { icao_code: string } | null)?.icao_code ?? "—"
  }`;

  const { data: existing } = await supabase
    .from("pilot_reviews")
    .select(
      "communication_rating, accuracy_rating, experience_rating, comment",
    )
    .eq("booking_id", bookingId)
    .eq("reviewer_user_id", user.id)
    .eq("is_visible", true)
    .maybeSingle();

  const existingForForm = existing
    ? {
        communicationRating: existing.communication_rating as number | null,
        accuracyRating: existing.accuracy_rating as number | null,
        experienceRating: existing.experience_rating as number | null,
        comment: existing.comment as string | null,
      }
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PilotPageHeader
        eyebrow="Reviews"
        title="Review your pilot"
        description={`How was your flight with ${pilotName}?`}
      />

      <div
        className="mb-6 rounded-xl border p-5 text-[13px]"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <p style={{ color: "var(--ink)" }}>
          {routeLabel} · {flight.flight_date ? formatShortDate(flight.flight_date) : "—"}
        </p>
      </div>

      <PilotReviewForm
        bookingId={bookingId}
        isExpired={isExpired}
        existing={existingForForm}
      />

      <div className="mt-6">
        <Link
          href="/dashboard/passenger/reviews"
          className="text-primary hover:underline"
          style={{ color: "var(--primary-v2)" }}
        >
          Back to My reviews
        </Link>
      </div>
    </div>
  );
}

