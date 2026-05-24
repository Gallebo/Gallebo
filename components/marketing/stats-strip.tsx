import { AnimatedNumber } from "@/components/ui/animated-number";

const STATS = [
  { value: 312, prefix: "", suffix: "", label: "Verified pilots" },
  { value: 1847, prefix: "", suffix: "", label: "Flights this year" },
  { value: 64, prefix: "€", suffix: "", label: "Avg. per passenger" },
  { value: 4.86, prefix: "", suffix: "", label: "Avg. pilot rating" },
];

export function StatsStrip() {
  return (
    <section
      style={{
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        background: "transparent",
      }}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
        {STATS.map((stat, i) => (
          <div
            key={i}
            className="py-10 sm:py-12"
            style={{
              paddingLeft: i === 0 ? 0 : "24px",
              paddingRight: i === 3 ? 0 : "24px",
              borderRight:
                i < 3
                  ? "1px solid var(--line)"
                  : "none",
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
