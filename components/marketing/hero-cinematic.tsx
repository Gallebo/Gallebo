import Image from "next/image";
import Link from "next/link";

export function HeroCinematic() {
  return (
    <section
      className="relative overflow-hidden isolate"
      style={{ padding: "160px 0 180px" }}
    >
      {/* Light mode background */}
      <Image
        src="/hero-contrail.png"
        alt=""
        aria-hidden="true"
        fill
        priority
        className="object-cover object-center dark:opacity-0 transition-opacity duration-300"
        style={{ zIndex: -2 }}
        sizes="100vw"
      />

      {/* Dark mode background */}
      <Image
        src="/hero-contrail-dark.png"
        alt=""
        aria-hidden="true"
        fill
        className="object-cover object-center opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{ zIndex: -2 }}
        sizes="100vw"
      />

      {/* Readability overlay — lighter in light mode, heavier in dark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: -1,
          background:
            "radial-gradient(80% 60% at 50% 45%, rgba(8,18,38,.32), rgba(8,18,38,.14) 60%, transparent 90%)," +
            "linear-gradient(180deg, rgba(8,18,38,.22) 0%, rgba(8,18,38,.04) 35%, rgba(255,255,255,.0) 70%, rgba(255,255,255,.12) 100%)",
        }}
      />

      {/* Bottom fade to background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{
          zIndex: 1,
          height: 140,
          background:
            "linear-gradient(to bottom, transparent, var(--bg))",
        }}
      />

      <div
        className="container relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8"
        style={{ color: "#ffffff", position: "relative", zIndex: 2 }}
      >
        {/* Eyebrow badge */}
        <div
          className="gallebo-stagger-in mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2"
          style={{
            animationDelay: "0ms",
            borderColor: "rgba(255,255,255,.22)",
            background: "rgba(255,255,255,.08)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--coral)" }}
          />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "rgba(255,255,255,.82)" }}
          >
            Adriatic Flight-Sharing — Est. 2026
          </span>
        </div>

        {/* Display headline */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(64px, 11vw, 172px)",
            fontWeight: 700,
            lineHeight: 1,
            margin: 0,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            textShadow: "0 2px 30px rgba(8,18,38,.35)",
          }}
        >
          <span
            className="gallebo-stagger-word"
            style={{ animationDelay: "80ms" }}
          >
            Fly together.
          </span>{" "}
          <em
            className="gallebo-stagger-word"
            style={{ animationDelay: "260ms", fontStyle: "italic" }}
          >
            Share the cost.
          </em>
        </h1>

        {/* Subtitle */}
        <p
          className="gallebo-stagger-in mx-auto mt-8 max-w-xl text-[18px] leading-relaxed"
          style={{
            color: "rgba(255,255,255,.88)",
            animationDelay: "420ms",
            textShadow: "0 1px 12px rgba(8,18,38,.4)",
          }}
        >
          The Adriatic coastline at 1,400 ft. The price of a train ticket.
        </p>

        {/* CTAs */}
        <div
          className="gallebo-stagger-in mt-10 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "560ms" }}
        >
          {/* Coral primary CTA */}
          <Link
            href="/flights"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{
              background: "var(--coral)",
              color: "#fff",
              boxShadow: "var(--shadow-coral)",
            }}
          >
            Find a flight
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/register?role=pilot"
            className="inline-flex items-center gap-2 rounded-xl border px-7 py-3.5 text-[15px] font-semibold transition-all hover:bg-white/10 active:scale-95"
            style={{
              borderColor: "rgba(255,255,255,.75)",
              color: "#ffffff",
              backdropFilter: "blur(6px)",
              background: "rgba(255,255,255,.07)",
            }}
          >
            Sign up as pilot
          </Link>
        </div>

        {/* Telemetry hint */}
        <p
          className="gallebo-stagger-in mt-8 text-[11px] font-medium uppercase tracking-[0.12em]"
          style={{ color: "rgba(255,255,255,.45)", animationDelay: "700ms", fontFamily: "var(--font-mono-v2)" }}
        >
          N 45.07° · E 13.61° · Adriatic · 1,400 ft AGL
        </p>
      </div>
    </section>
  );
}
