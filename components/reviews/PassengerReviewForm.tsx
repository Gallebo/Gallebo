"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { submitPassengerReview } from "@/lib/reviews/actions";
import { Button } from "@/components/ui/button";
import { StarCategoryRow } from "@/components/reviews/StarCategoryRow";

type PassengerReviewFormProps = {
  bookingId: string;
  isExpired: boolean;
  existing?: {
    accuracyRating: number | null;
    behaviorRating: number | null;
    weightAccuracyRating: number | null;
    comment: string | null;
  } | null;
};

export function PassengerReviewForm({
  bookingId,
  isExpired,
  existing,
}: PassengerReviewFormProps) {
  const router = useRouter();

  const [accuracyRating, setAccuracyRating] = React.useState<number | null>(
    existing?.accuracyRating ?? null,
  );
  const [behaviorRating, setBehaviorRating] = React.useState<number | null>(
    existing?.behaviorRating ?? null,
  );
  const [weightAccuracyRating, setWeightAccuracyRating] = React.useState<number | null>(
    existing?.weightAccuracyRating ?? null,
  );
  const [comment, setComment] = React.useState(existing?.comment ?? "");
  const [pending, setPending] = React.useState(false);

  const canSubmit = !isExpired && !existing;

  async function onSubmit() {
    if (!canSubmit) return;
    if (!accuracyRating || !behaviorRating || !weightAccuracyRating) {
      alert("Please select all star ratings.");
      return;
    }

    const trimmed = comment.trim();
    const needsComment = [accuracyRating, behaviorRating, weightAccuracyRating].some(
      (r) => r <= 3,
    );
    if (needsComment && trimmed.length === 0) {
      alert("Comment is required when any category is rated 3 or below.");
      return;
    }

    setPending(true);
    try {
      const res = await submitPassengerReview(bookingId, {
        accuracyRating,
        behaviorRating,
        weightAccuracyRating,
        comment: trimmed.length ? trimmed : null,
      });
      if (res.error) alert(res.error);
      else alert(res.success ?? "Saved.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {existing ? (
        <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
          Review is already submitted and revealed.
        </p>
      ) : isExpired ? (
        <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
          Recenzije nisu dostupne jer je istekao rok (24h).
        </p>
      ) : (
        <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
          Blind review: pilot rating becomes visible after both sides submit (or after 24h).
        </p>
      )}

      <div
        className="space-y-4 rounded-xl border p-5"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <StarCategoryRow
          label="Točnost (pojavljivanje)"
          description="Pojavio se na dogovoreno mjesto i vrijeme"
          rating={accuracyRating}
          onChange={canSubmit ? setAccuracyRating : undefined}
        />
        <StarCategoryRow
          label="Ponašanje"
          description="Ponašanje za vrijeme leta"
          rating={behaviorRating}
          onChange={canSubmit ? setBehaviorRating : undefined}
        />
        <StarCategoryRow
          label="Točnost težine"
          description="Prijavljena tezina odgovarala stvarnoj"
          rating={weightAccuracyRating}
          onChange={canSubmit ? setWeightAccuracyRating : undefined}
        />

        <div>
          <p className="mb-2 text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
            Slobodni komentar
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional (required if any category is 3 or below)"
            disabled={!canSubmit}
            className="min-h-[110px] w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button size="sm" disabled={!canSubmit || pending} onClick={onSubmit}>
            {pending ? "Saving…" : "Submit review"}
          </Button>
        </div>
      </div>
    </div>
  );
}

