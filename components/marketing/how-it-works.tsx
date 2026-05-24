import { Reveal } from "@/components/ui/reveal";

const STEPS = [
  {
    n: "01",
    title: "Pilot posts the flight",
    desc: "Route, date, aircraft, seats. The platform calculates each passenger's fair share at posting time.",
  },
  {
    n: "02",
    title: "You request a seat",
    desc: 'Tap "Book now" — the pilot has 48 hours to accept. No money moves yet.',
  },
  {
    n: "03",
    title: "Pay your share",
    desc: "Once accepted, you pay via Stripe. Contact details unlock instantly.",
  },
  {
    n: "04",
    title: "Show up and fly",
    desc: "Meet at the airfield. Watch the coast unroll. Land. Leave a review.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" style={{ padding: "120px 0" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.6fr] lg:gap-20 lg:items-start">
          {/* Left — heading */}
          <Reveal>
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--coral)" }}
            >
              How it works
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(40px, 5.2vw, 68px)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.08,
                color: "var(--ink)",
                margin: 0,
              }}
            >
              Four steps
              <br />
              <em style={{ fontStyle: "italic" }}>from screen to sky.</em>
            </h2>
            <p
              className="mt-6 text-[15px] leading-relaxed"
              style={{ color: "var(--ink-2)", maxWidth: 380 }}
            >
              A booking takes about three minutes. The platform handles the rest
              — payment, contact reveal, the paperwork.
            </p>
          </Reveal>

          {/* Right — 2×2 step grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 110}>
                <div
                  className="h-full rounded-2xl p-7 transition-all hover:shadow-lg hover:-translate-y-1"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <p
                    className="mb-8 text-[13px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "var(--coral)" }}
                  >
                    {s.n}
                  </p>
                  <h3
                    className="text-[20px] font-semibold leading-snug"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--ink)",
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="mt-2.5 text-[14px] leading-relaxed"
                    style={{ color: "var(--ink-2)" }}
                  >
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
