import Link from "next/link";

import { PassengerReviewCard } from "@/components/passenger/passenger-review-card";
import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { requireVerifiedPassenger } from "@/lib/auth/rbac";
import { formatShortDate, getPassengerReviews } from "@/lib/passenger/queries";

export const metadata = { title: "My reviews — Gallebo" };

export default async function PassengerReviewsPage() {
  const { user } = await requireVerifiedPassenger();
  const { reviews, pending } = await getPassengerReviews(user.id);

  return (
    <div>
      <PilotPageHeader
        eyebrow="Reviews"
        title="My reviews"
        description="Blind two-way reviews — revealed only once both sides have submitted within 24h of landing."
      />

      {reviews.length > 0 ? (
        <div className="mb-8 flex flex-col gap-4">
          {reviews.map((r) => (
            <PassengerReviewCard key={r.id} review={r} />
          ))}
        </div>
      ) : (
        <p className="mb-8 text-[14px]" style={{ color: "var(--ink-3)" }}>
          You have not submitted any pilot reviews yet.
        </p>
      )}

      {pending.length > 0 ? (
        <div
          className="rounded-xl border px-5 py-4 text-[14px]"
          style={{
            borderColor: "var(--line)",
            background: "color-mix(in srgb, var(--sun) 12%, var(--surface))",
            color: "var(--ink-2)",
          }}
        >
          <strong style={{ color: "var(--ink)" }}>
            {pending.length} flight{pending.length === 1 ? "" : "s"}
          </strong>{" "}
          {pending.length === 1 ? "is" : "are"} still awaiting your review —{" "}
          {pending.map((p, i) => (
            <span key={p.bookingId}>
              {i > 0 ? ", " : null}
              <Link
                href={`/flights/${p.flightId}`}
                className="font-medium underline"
                style={{ color: "var(--primary-v2)" }}
              >
                leave review for {p.routeLabel} ({formatShortDate(p.flight_date)})
              </Link>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
