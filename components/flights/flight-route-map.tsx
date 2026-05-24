/** Stylised route thumbnail for flight result rows. */
export function FlightRouteMap({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const h = variant === "compact" ? 72 : 88;
  const w = variant === "compact" ? 120 : 140;

  return (
    <div
      className="gallebo-map-grid relative overflow-hidden rounded-lg"
      style={{
        width: w,
        height: h,
        flexShrink: 0,
        border: "1px solid var(--line)",
        background: "var(--surface-alt)",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 140 88"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <path
          d="M 18 62 C 42 18, 98 18, 122 28"
          fill="none"
          stroke="var(--primary-v2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 3"
          opacity="0.85"
        />
        <circle cx="18" cy="62" r="5" fill="var(--surface)" stroke="var(--primary-v2)" strokeWidth="2" />
        <circle cx="122" cy="28" r="5" fill="var(--coral)" stroke="var(--surface)" strokeWidth="2" />
      </svg>
    </div>
  );
}
