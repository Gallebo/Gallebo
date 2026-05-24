import Link from "next/link";

import { Seagull } from "@/components/marketing/seagull-wordmark";

interface AuthSplitLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  panelTag?: string;
  quote: string;
  attribution: string;
  backHref?: string;
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{
        color: "var(--ink-3)",
        border: "1px solid var(--line)",
        background: "var(--surface)",
      }}
    >
      {icon}
      {label}
    </span>
  );
}

export function AuthSplitLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  panelTag = "GALLEBO / EASA / PASSENGER",
  quote,
  attribution,
  backHref = "/",
}: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-2">
      {/* Form panel */}
      <div
        className="flex flex-col px-6 py-10 sm:px-10 lg:px-16 lg:py-14"
        style={{ background: "var(--bg)" }}
      >
        <Link
          href={backHref}
          className="mb-10 inline-flex w-fit items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--ink-2)" }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--ink-3)" }}
          >
            {eyebrow}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: "var(--ink)",
              margin: "0 0 12px",
            }}
          >
            {title}
          </h1>
          <p
            className="mb-8 text-[15px] leading-relaxed"
            style={{ color: "var(--ink-2)" }}
          >
            {subtitle}
          </p>

          {children}

          {footer ? <div className="mt-6">{footer}</div> : null}

          <div className="mt-10 flex flex-wrap gap-2.5">
            <TrustBadge
              icon={
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
              label="EASA regulated"
            />
            <TrustBadge
              icon={
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
                </svg>
              }
              label="KYC via Didit"
            />
          </div>
        </div>
      </div>

      {/* Visual panel */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:p-14"
        style={{
          background:
            "linear-gradient(180deg, #B8D4E8 0%, #D4C4A8 55%, #C9A882 100%)",
        }}
      >
        <p
          className="self-end text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "rgba(13,19,24,.45)" }}
        >
          {panelTag}
        </p>

        <div className="flex flex-1 items-center justify-center py-8">
          <Seagull size={120} color="var(--ink)" />
        </div>

        <div>
          <blockquote
            className="mb-4 text-[22px] font-semibold leading-snug tracking-[-0.02em]"
            style={{ color: "var(--ink)", maxWidth: 420 }}
          >
            &ldquo;{quote}&rdquo;
          </blockquote>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "rgba(13,19,24,.5)" }}
          >
            {attribution}
          </p>
        </div>
      </div>
    </div>
  );
}
