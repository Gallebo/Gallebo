import { AnimatedNumber } from "@/components/ui/animated-number";
import type { MarketingStats } from "@/lib/marketing/stats";

type StatItem = {
  value: number;
  prefix: string;
  suffix: string;
  label: string;
};

function buildStats(stats: MarketingStats): StatItem[] {
  const items: StatItem[] = [
    { value: stats.pilots, prefix: "", suffix: "", label: "Verified pilots" },
    {
      value: stats.seatsBooked,
      prefix: "",
      suffix: "",
      label: "Seats booked",
    },
  ];

  if (stats.avgPerSeat != null) {
    items.push({
      value: stats.avgPerSeat,
      prefix: "€",
      suffix: "",
      label: "Average per seat",
    });
  }

  if (stats.avgRating != null) {
    items.push({
      value: stats.avgRating,
      prefix: "",
      suffix: " ★",
      label: "Pilot rating",
    });
  }

  return items;
}

export function StatsStrip({ stats }: { stats: MarketingStats }) {
  const items = buildStats(stats);
  const lastIndex = items.length - 1;

  return (
    <section
      style={{
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        background: "transparent",
      }}
    >
      <div
        className={`mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:px-8 ${
          items.length >= 4
            ? "sm:grid-cols-4"
            : items.length === 3
              ? "sm:grid-cols-3"
              : "sm:grid-cols-2"
        }`}
      >
        {items.map((stat, i) => (
          <div
            key={stat.label}
            className="py-10 sm:py-12"
            style={{
              paddingLeft: i === 0 ? 0 : "24px",
              paddingRight: i === lastIndex ? 0 : "24px",
              borderRight:
                i < lastIndex ? "1px solid var(--line)" : "none",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 4.5vw, 60px)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "var(--ink)",
              }}
            >
              <AnimatedNumber
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
              />
            </div>
            <div
              className="mt-2 text-xs font-medium uppercase tracking-[0.1em]"
              style={{ color: "var(--ink-3)" }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
