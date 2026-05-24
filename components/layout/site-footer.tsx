import Link from "next/link";

import { GalleboWordmark } from "@/components/marketing/seagull-wordmark";

function ShieldIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="9" r="6" />
      <path d="M9 14l-2 7 5-3 5 3-2-7" />
    </svg>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <p
        className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--ink-3)" }}
      >
        {title}
      </p>
      <ul className="flex flex-col gap-2.5" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="text-[14px] transition-colors hover:opacity-100"
              style={{ color: "var(--ink-2)", textDecoration: "none" }}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line)",
        background: "var(--surface)",
        padding: "64px 0 48px",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top row: 4-col grid */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div style={{ color: "var(--ink)" }}>
              <GalleboWordmark size={16} />
            </div>
            <p
              className="mt-4 text-[14px] leading-relaxed"
              style={{ color: "var(--ink-2)", maxWidth: 300 }}
            >
              Cost-shared private flights across the Adriatic. EASA-compliant.
              Pilot-first.
            </p>
            {/* Trust badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{
                  background: "var(--surface-alt)",
                  color: "var(--ink-2)",
                  border: "1px solid var(--line)",
                }}
              >
                <ShieldIcon /> EASA Regulated
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{
                  background: "var(--surface-alt)",
                  color: "var(--ink-2)",
                  border: "1px solid var(--line)",
                }}
              >
                <BadgeIcon /> KYC Verified
              </span>
            </div>
          </div>

          <FooterCol
            title="Product"
            items={[
              { label: "Find a flight", href: "/flights" },
              { label: "Become a pilot", href: "/onboarding/pilot" },
              { label: "How it works", href: "/#how" },
              { label: "Safety", href: "/safety" },
            ]}
          />
          <FooterCol
            title="Company"
            items={[
              { label: "About", href: "/about" },
              { label: "Press", href: "/press" },
              { label: "Careers", href: "/careers" },
              { label: "Contact", href: "/contact" },
            ]}
          />
          <FooterCol
            title="Legal"
            items={[
              { label: "Terms", href: "/terms" },
              { label: "Privacy", href: "/privacy" },
              { label: "Cookies", href: "/cookies" },
              { label: "Imprint", href: "/imprint" },
            ]}
          />
        </div>

        {/* Bottom bar */}
        <div
          className="mt-14 flex flex-col items-start justify-between gap-4 border-t pt-7 sm:flex-row sm:items-center"
          style={{ borderColor: "var(--line)" }}
        >
          <span
            className="text-[12px] font-medium"
            style={{
              color: "var(--ink-3)",
              fontFamily: "var(--font-mono-v2)",
              letterSpacing: "0.02em",
            }}
          >
            © {new Date().getFullYear()} Gallebo d.o.o. · Zagreb · Venezia ·
            Ljubljana
          </span>
          <span
            className="text-[12px]"
            style={{
              color: "var(--ink-3)",
              fontFamily: "var(--font-mono-v2)",
            }}
          >
            v2.0 · Built in the Adriatic
          </span>
        </div>
      </div>
    </footer>
  );
}
