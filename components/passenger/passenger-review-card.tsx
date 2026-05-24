import type { PassengerReviewRow } from "@/lib/passenger/queries";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="text-[15px]"
          style={{ color: i <= rating ? "var(--sun)" : "var(--line)" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function PassengerReviewCard({ review }: { review: PassengerReviewRow }) {
  return (
    <article
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            {review.pilotName}
          </p>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--ink-3)" }}>
            {review.routeLabel} · {review.flightDate}
          </p>
        </div>
        <Stars rating={review.rating} />
      </div>
      <p
        className="text-[15px] italic leading-relaxed"
        style={{ color: "var(--ink-2)", fontFamily: "var(--font-display)" }}
      >
        &ldquo;{review.comment}&rdquo;
      </p>
    </article>
  );
}
