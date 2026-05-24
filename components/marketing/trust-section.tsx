import { Reveal } from "@/components/ui/reveal";

const ITEMS = [
  {
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: "EASA cost-sharing",
    desc: "Every flight follows EU Regulation 965/2012, Part-NCO. We lock the formula at posting time.",
  },
  {
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="9" r="6" />
        <path d="M9 14l-2 7 5-3 5 3-2-7" />
      </svg>
    ),
    title: "KYC verified pilots",
    desc: "Government ID + PPL/LAPL licence + medical certificate, verified by Didit before publishing.",
  },
  {
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 018 0v3" />
      </svg>
    ),
    title: "Escrowed payment",
    desc: "Stripe Connect holds the funds. Released to the pilot after the flight, refunded if weather cancels.",
  },
  {
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2 20c.8-3 3.8-5 7-5s6.2 2 7 5" />
        <circle cx="17" cy="7" r="3" />
        <path d="M22 17c-.5-2-2-3.2-4-3.7" />
      </svg>
    ),
    title: "Blind two-way reviews",
    desc: "Both sides review each other within 24 h. Results revealed only when both have submitted.",
  },
];

export function TrustSection() {
  return (
    <section
      className="dark:gallebo-sky-gradient"
      style={{ background: "var(--inverse)", color: "#fff", padding: "120px 0" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p
            className="mb-5 text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: "rgba(255,255,255,.48)" }}
          >
            Why Gallebo
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 4.8vw, 60px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "#fff",
              margin: 0,
              maxWidth: 680,
            }}
          >
            Aviation-grade trust,{" "}
            <em style={{ fontStyle: "italic" }}>in three taps.</em>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, i) => (
            <Reveal key={i} delay={i * 90}>
              <div>
                <div style={{ color: "var(--coral)", marginBottom: 20 }}>
                  {item.icon}
                </div>
                <h3
                  className="mb-3 text-[21px] font-semibold leading-snug"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#fff",
                    letterSpacing: "-0.015em",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,.62)" }}
                >
                  {item.desc}
                </p>
                <div
                  className="mt-6"
                  style={{ height: 1, width: 40, background: "var(--coral)" }}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
