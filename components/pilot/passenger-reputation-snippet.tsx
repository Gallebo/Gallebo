export function PassengerReputationSnippet({
  avgRating,
  reviewCount,
}: {
  avgRating: number | null;
  reviewCount: number;
}) {
  if (reviewCount === 0) {
    return (
      <p className="mt-1 text-[12px]" style={{ color: "var(--ink-3)" }}>
        No passenger reviews yet
      </p>
    );
  }

  return (
    <p className="mt-1 text-[12px]" style={{ color: "var(--ink-3)" }}>
      <span style={{ color: "var(--sun)" }} aria-hidden="true">
        ★
      </span>{" "}
      <span className="font-semibold" style={{ color: "var(--ink-2)" }}>
        {avgRating ?? "—"}
      </span>{" "}
      · {reviewCount} review{reviewCount === 1 ? "" : "s"} from other pilots
    </p>
  );
}
