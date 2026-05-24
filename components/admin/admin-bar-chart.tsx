interface BarChartData {
  label: string;
  value: number;
}

interface AdminBarChartProps {
  data: BarChartData[];
  title?: string;
  sub?: string;
  growthLabel?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  accent?: "coral" | "primary" | "turquoise";
  height?: number;
}

function formatBarValue(value: number, prefix: string) {
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}k`;
  return `${prefix}${value.toFixed(0)}`;
}

const ACCENT_COLORS = {
  coral: "var(--coral)",
  primary: "var(--primary-v2)",
  turquoise: "var(--turquoise)",
};

export function AdminBarChart({
  data,
  title,
  sub,
  growthLabel,
  valuePrefix = "€",
  valueSuffix = "",
  accent = "primary",
  height = 160,
}: AdminBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const lastIndex = data.length - 1;
  const barColor = ACCENT_COLORS[accent];

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        {title ? (
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--ink-3)" }}
            >
              {title}
            </p>
            {sub ? (
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
                {sub}
              </p>
            ) : null}
          </div>
        ) : null}
        {growthLabel ? (
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{
              background: "color-mix(in srgb, var(--success) 12%, transparent)",
              color: "var(--success)",
            }}
          >
            {growthLabel}
          </span>
        ) : null}
      </div>

      <div
        className="flex items-end justify-between gap-3"
        style={{ height }}
        role="img"
        aria-label={title}
      >
        {data.map((d, i) => {
          const pct = d.value === 0 ? 4 : Math.max((d.value / max) * 100, 8);
          const isLast = i === lastIndex;
          return (
            <div
              key={d.label}
              className="flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              <span
                className="mb-2 text-[11px] font-semibold"
                style={{ color: isLast ? "var(--primary-v2)" : "var(--ink-3)" }}
              >
                {formatBarValue(d.value, valuePrefix)}
                {valueSuffix}
              </span>
              <div
                className="w-full max-w-[72px] rounded-t-md transition-all duration-500"
                style={{
                  height: `${pct}%`,
                  background: isLast
                    ? barColor
                    : `color-mix(in srgb, ${barColor} 22%, transparent)`,
                  border: isLast ? "none" : `1px solid color-mix(in srgb, ${barColor} 35%, transparent)`,
                  minHeight: 8,
                }}
              />
              <span
                className="mt-2 text-[11px] font-medium"
                style={{ color: "var(--ink-3)" }}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
