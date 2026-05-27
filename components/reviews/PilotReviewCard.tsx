import { Star } from "lucide-react";

import { StarCategoryRow } from "@/components/reviews/StarCategoryRow";

type PilotReviewCardProps = {
  review: {
    id: string;
    rating: number | null;
    communicationRating: number | null;
    accuracyRating: number | null;
    experienceRating: number | null;
    comment: string | null;
    created_at: string | null;
  };
};

function StarsDisplay({ rating }: { rating: number | null }) {
  const value = rating ?? 0;
  return (
    <div className="flex items-center gap-2" aria-label={`${value} out of 5 stars`}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="text-[15px]"
            style={{ color: i <= value ? "var(--sun)" : "var(--line)" }}
          >
            ★
          </span>
        ))}
      </div>
      {typeof rating === "number" ? (
        <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
          {rating} / 5
        </span>
      ) : null}
    </div>
  );
}

export function PilotReviewCard({ review }: PilotReviewCardProps) {
  const dateLabel = review.created_at ? review.created_at.slice(0, 10) : "";

  return (
    <article
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <StarsDisplay rating={review.rating} />
          {dateLabel ? (
            <p className="mt-1 text-[12px] text-muted-foreground">{dateLabel}</p>
          ) : null}
        </div>

        <Star className="hidden h-6 w-6 text-amber-500 sm:block" />
      </div>

      <div className="space-y-3">
        <StarCategoryRow
          label="Komunikacija"
          description="Brzina i kvaliteta odgovora u chatu"
          rating={review.communicationRating}
        />
        <StarCategoryRow
          label="Točnost"
          description="Pojavljivanje na dogovoreno mjesto i vrijeme"
          rating={review.accuracyRating}
        />
        <StarCategoryRow
          label="Iskustvo leta"
          description="Kvaliteta i ugodnost samog leta"
          rating={review.experienceRating}
        />
      </div>

      {review.comment ? (
        <p
          className="mt-4 text-[14px] italic leading-relaxed"
          style={{ color: "var(--ink-2)", fontFamily: "var(--font-display)" }}
        >
          &ldquo;{review.comment}&rdquo;
        </p>
      ) : null}
    </article>
  );
}

