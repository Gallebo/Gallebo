"use client";

import { useState } from "react";

const FAQ = [
  {
    q: "Is this legal?",
    a: "Yes. Gallebo operates under EU Regulation 965/2012 (Part-NCO), which allows private pilots to share the direct costs of a flight with passengers — as long as the pilot covers their own share. No commercial licence is needed.",
  },
  {
    q: "How is the price calculated?",
    a: "The pilot enters aircraft operating costs (fuel, landing fees, etc.). Gallebo divides these equally between pilot and all passengers. The pilot never profits — they pay their own share too.",
  },
  {
    q: "What aircraft are allowed?",
    a: "Any EASA-certified non-commercial aircraft with a valid Certificate of Airworthiness: SEP/MEP pistons, touring motor gliders, and light sport aircraft under Part-NCO.",
  },
  {
    q: "What if the flight is cancelled?",
    a: "If the pilot cancels, you receive a full refund within 5 business days. If you cancel within 48 hours of departure, the platform's cancellation policy applies (see Terms).",
  },
  {
    q: "How are pilots verified?",
    a: "Every pilot must complete Didit KYC: government-issued photo ID + valid PPL/LAPL licence + current medical certificate. Verification is mandatory before the first flight is published.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      style={{ padding: "120px 0", background: "var(--surface)" }}
    >
      <div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        style={{ maxWidth: 920 }}
      >
        <p
          className="mb-4 text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--ink-3)" }}
        >
          Frequently asked
        </p>
        <h2
          className="mb-12"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 4.8vw, 60px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            color: "var(--ink)",
            margin: 0,
            marginBottom: 48,
          }}
        >
          Common questions.
        </h2>
        <div style={{ borderTop: "1px solid var(--line)" }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: "1px solid var(--line)" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-7 text-left transition-colors"
                style={{ background: "transparent", border: 0, cursor: "pointer" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 21,
                    fontWeight: 500,
                    letterSpacing: "-0.012em",
                    color: "var(--ink)",
                  }}
                >
                  {item.q}
                </span>
                {/* Chevron */}
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    color: "var(--ink-3)",
                    transform: open === i ? "rotate(180deg)" : "none",
                    transition: "transform 200ms",
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {open === i && (
                <div
                  className="gallebo-faq-answer pb-7"
                  style={{
                    fontSize: 15.5,
                    lineHeight: 1.7,
                    color: "var(--ink-2)",
                    maxWidth: 760,
                  }}
                >
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
