interface AdminStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  accent?: "coral" | "primary" | "turquoise" | "success";
  icon?: React.ReactNode;
}

const ACCENT_COLORS = {
  coral: { bg: "var(--coral-soft)", color: "var(--coral)" },
  primary: { bg: "var(--primary-soft)", color: "var(--primary-v2)" },
  turquoise: { bg: "var(--turquoise-soft)", color: "var(--turquoise)" },
  success: {
    bg: "color-mix(in srgb, var(--success) 12%, transparent)",
    color: "var(--success)",
  },
};

export function AdminStatCard({
  label,
  value,
  sub,
  trend,
  accent = "primary",
  icon,
}: AdminStatCardProps) {
  const colors = ACCENT_COLORS[accent];
  const trendUp = trend !== undefined && trend >= 0;

  return (
    <div
      className="rounded-2xl p-6 transition-shadow hover:shadow-md"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
      }}
    >
      {icon && (
        <div
          className="mb-4 inline-flex items-center justify-center rounded-xl p-2.5"
          style={{ background: colors.bg, color: colors.color }}
        >
          {icon}
        </div>
      )}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(28px, 3vw, 44px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          color: "var(--ink)",
        }}
      >
        {value}
      </div>
      <div
        className="mt-1.5 text-[13px] font-medium"
        style={{ color: "var(--ink-2)" }}
      >
        {label}
      </div>
      {(sub !== undefined || trend !== undefined) && (
        <div className="mt-3 flex items-center gap-2">
          {trend !== undefined && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                background: trendUp
                  ? "color-mix(in srgb, var(--success) 12%, transparent)"
                  : "color-mix(in srgb, var(--danger) 12%, transparent)",
                color: trendUp ? "var(--success)" : "var(--danger)",
              }}
            >
              {trendUp ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
          {sub && (
            <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
              {sub}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
