export function ReviewAwaitingRevealBanner() {
  return (
    <div
      className="rounded-xl border px-5 py-4 text-[14px]"
      style={{
        borderColor: "var(--line)",
        background: "color-mix(in srgb, var(--sun) 12%, var(--surface))",
        color: "var(--ink-2)",
      }}
    >
      Recenzija je poslana — čeka se otkrivanje (do 24h nakon sletanja, ili čim
      obje strane pošalju recenziju).
    </div>
  );
}
