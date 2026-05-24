interface AirfieldReviewsProps {
  rating?: number;
  reviewCount?: number;
}

const SAMPLE_REVIEWS = [
  {
    id: "1",
    text: "Friendly tower, soft grass, easy parking. Café served espresso strong enough to fly back on. Will return.",
    author: "Maria K.",
    role: "Pilot",
    country: "Italy",
    stars: 5,
    ago: "2 weeks ago",
  },
  {
    id: "2",
    text: "Met the pilot on the apron, briefing was thorough, the view over the Lim fjord on climb-out is something else.",
    author: "Tomas P.",
    role: "Passenger",
    country: "Slovenia",
    stars: 5,
    ago: "1 month ago",
  },
  {
    id: "3",
    text: "Strip is short and the surface is uneven after rain. Otherwise charming and well-run. Crosswind from the sea can pick up after midday.",
    author: "Henrik J.",
    role: "Pilot",
    country: "Sweden",
    stars: 4,
    ago: "6 weeks ago",
  },
  {
    id: "4",
    text: "Cleared customs in ten minutes. The owner walked us through the fuel pump and refused payment for coffee.",
    author: "Elena R.",
    role: "Pilot",
    country: "Italy",
    stars: 5,
    ago: "2 months ago",
  },
];

function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill={i < count ? "#F5A623" : "none"}
          stroke={i < count ? "#F5A623" : "rgba(255,255,255,.25)"}
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function AirfieldReviews({ rating = 4.7, reviewCount = 43 }: AirfieldReviewsProps) {
  const ratingBreakdown = [
    { star: 5, count: 30, pct: 70 },
    { star: 4, count: 9, pct: 21 },
    { star: 3, count: 3, pct: 7 },
    { star: 2, count: 1, pct: 2 },
    { star: 1, count: 0, pct: 0 },
  ];

  return (
    <section
      className="py-20"
      style={{ background: "#0F172A" }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "rgba(255,255,255,.4)" }}
          >
            Reviews
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "#ffffff",
              margin: 0,
            }}
          >
            What pilots and passengers say.
          </h2>
        </div>

        <div className="grid gap-10 lg:grid-cols-[200px,1fr]">
          {/* Rating breakdown */}
          <div>
            <div className="mb-3 flex items-end gap-3">
              <span
                className="text-[60px] font-bold leading-none"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "#ffffff",
                  letterSpacing: "-0.04em",
                }}
              >
                {rating.toFixed(1)}
              </span>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="#F5A623" stroke="#F5A623" strokeWidth="1.5" aria-hidden="true" style={{ marginBottom: 8 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <p
              className="mb-5 text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,.4)" }}
            >
              FROM {reviewCount} REVIEWS
            </p>
            <div className="space-y-2">
              {ratingBreakdown.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <span
                    className="w-4 text-[12px] text-right"
                    style={{ color: "rgba(255,255,255,.5)" }}
                  >
                    {star}★
                  </span>
                  <div
                    className="relative flex-1 overflow-hidden rounded-full"
                    style={{ height: 6, background: "rgba(255,255,255,.1)" }}
                  >
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: star >= 4 ? "#F5A623" : star === 3 ? "#F5A623" : "rgba(255,255,255,.3)",
                      }}
                    />
                  </div>
                  <span
                    className="w-5 text-right text-[12px]"
                    style={{ color: "rgba(255,255,255,.4)" }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Review cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {SAMPLE_REVIEWS.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.1)",
                }}
              >
                <Stars count={review.stars} />
                <p
                  className="my-3 text-[14px] italic leading-relaxed"
                  style={{ color: "rgba(255,255,255,.82)" }}
                >
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-white">{review.author}</p>
                    <p
                      className="text-[11px] uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,.4)" }}
                    >
                      {review.role} · {review.country}
                    </p>
                  </div>
                  <p className="text-[12px]" style={{ color: "rgba(255,255,255,.35)" }}>
                    {review.ago}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
