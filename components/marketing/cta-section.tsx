import Link from "next/link";

export function CTASection() {
  return (
    <section
      className="gallebo-sea-gradient relative overflow-hidden"
      style={{ padding: "140px 0", color: "#fff" }}
    >
      {/* Animated SVG seagulls / horizon */}
      <svg
        viewBox="0 0 1400 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
      >
        <path
          d="M-50 380 C 300 340, 700 420, 1100 360 C 1300 330, 1400 360, 1450 360"
          stroke="rgba(255,255,255,.5)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-50 400 C 300 360, 700 440, 1100 380 C 1300 350, 1400 380, 1450 380"
          stroke="rgba(255,255,255,.3)"
          strokeWidth="1"
          fill="none"
        />
        {/* Seagull 1 */}
        <g style={{ animation: "drift 8s cubic-bezier(0.45,0,.55,1) infinite" }}>
          <path
            d="M 240 180 C 250 172, 256 162, 262 170 C 268 162, 274 172, 284 180"
            stroke="rgba(255,255,255,.7)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        {/* Seagull 2 */}
        <g style={{ animation: "drift2 10s cubic-bezier(0.45,0,.55,1) infinite" }}>
          <path
            d="M 1100 120 C 1106 116, 1110 110, 1114 114 C 1118 110, 1122 116, 1128 120"
            stroke="rgba(255,255,255,.5)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        {/* Seagull 3 */}
        <g style={{ animation: "drift 12s cubic-bezier(0.45,0,.55,1) infinite 1s" }}>
          <path
            d="M 800 240 C 808 234, 814 226, 820 232 C 826 226, 832 234, 840 240"
            stroke="rgba(255,255,255,.4)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </svg>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p
          className="mb-6 text-xs font-semibold uppercase tracking-[0.16em]"
          style={{ color: "rgba(255,255,255,.56)" }}
        >
          Ready to fly?
        </p>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(52px, 8vw, 112px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "#fff",
            margin: 0,
          }}
        >
          The coast is{" "}
          <em style={{ fontStyle: "italic" }}>waiting.</em>
        </h2>
        <p
          className="mx-auto mt-8 max-w-lg text-[18px] leading-relaxed"
          style={{ color: "rgba(255,255,255,.78)" }}
        >
          Join 312 pilots and thousands of passengers who already share the sky
          across the Adriatic.
        </p>
        <div className="mt-11 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-[15px] font-semibold transition-all hover:bg-opacity-90 active:scale-95"
            style={{ color: "var(--primary-v2)" }}
          >
            Get started free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/flights"
            className="inline-flex items-center gap-2 rounded-xl border px-8 py-4 text-[15px] font-semibold transition-all hover:bg-white/10 active:scale-95"
            style={{
              borderColor: "rgba(255,255,255,.38)",
              color: "#fff",
            }}
          >
            Browse flights
          </Link>
        </div>
      </div>
    </section>
  );
}
