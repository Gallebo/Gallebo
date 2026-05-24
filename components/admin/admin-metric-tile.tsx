interface AdminMetricTileProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "green" | "blue" | "orange";
}

const TONE_COLORS = {
  default: "var(--ink)",
  green: "var(--success)",
  blue: "var(--primary-v2)",
  orange: "var(--coral)",
} as const;

export function AdminMetricTile({
  label,
  value,
  hint,
  tone = "default",
}: AdminMetricTileProps) {
  return (
    <div
      className="rounded-2xl px-6 py-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: "var(--ink-3)" }}
      >
        {label}
      </p>
      <div
        className="mt-2"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px, 4vw, 44px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          color: TONE_COLORS[tone],
        }}
      >
        {value}
      </div>
      {hint ? (
        <p className="mt-2 text-[12px]" style={{ color: "var(--ink-3)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
