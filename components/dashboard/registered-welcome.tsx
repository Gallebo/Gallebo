import Link from "next/link";
import { Building2, Check, Plane, Shield, Users } from "lucide-react";

import type { ProfileSummary } from "@/lib/types/profile";

const ROLES = [
  {
    href: "/onboarding/passenger",
    icon: Users,
    title: "Passenger",
    description: "Book shared flights with verified pilots across Europe.",
  },
  {
    href: "/onboarding/pilot",
    icon: Plane,
    title: "Pilot",
    description: "Share flight costs and publish your available seats.",
  },
  {
    href: "/onboarding/airfield",
    icon: Building2,
    title: "Airfield operator",
    description: "Manage your airfield profile and operational approvals.",
  },
] as const;

const STEPS = [
  { label: "Account created", state: "complete" as const },
  { label: "Choose your role", state: "current" as const },
  { label: "Verify identity", state: "upcoming" as const },
];

function welcomeHeadline(profile: ProfileSummary): string {
  const first = profile.first_name?.trim();
  if (first) return `Welcome back, ${first}`;
  return "Welcome aboard";
}

export function RegisteredWelcome({
  profile,
  email,
}: {
  profile: ProfileSummary;
  email: string;
}) {
  return (
    <section
      className="relative space-y-10"
      aria-labelledby="registered-welcome-heading"
    >
      <div
        className="pointer-events-none absolute -left-6 -top-8 h-56 w-72 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--primary-v2) 18%, transparent) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <header className="relative max-w-2xl space-y-4">
        <span className="badge-v2 badge-v2-primary">Almost there</span>
        <h1
          id="registered-welcome-heading"
          className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.03em]"
          style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
        >
          {welcomeHeadline(profile)}
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          Choose how you&apos;ll use Gallebo, then complete a quick identity check to unlock
          booking and messaging.
        </p>
        {email ? (
          <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
            Signed in as {email}
          </p>
        ) : null}
      </header>

      <ol
        className="relative flex flex-wrap items-center gap-2 sm:gap-0"
        aria-label="Verification progress"
      >
        {STEPS.map((step, index) => (
          <li key={step.label} className="flex items-center">
            <div
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium sm:px-4 sm:text-[13px]"
              style={{
                borderColor:
                  step.state === "current"
                    ? "color-mix(in srgb, var(--sun) 45%, transparent)"
                    : step.state === "complete"
                      ? "color-mix(in srgb, var(--success) 35%, transparent)"
                      : "var(--line)",
                background:
                  step.state === "current"
                    ? "color-mix(in srgb, var(--sun) 12%, var(--surface))"
                    : step.state === "complete"
                      ? "color-mix(in srgb, var(--success) 8%, var(--surface))"
                      : "var(--surface)",
                color:
                  step.state === "upcoming" ? "var(--ink-3)" : "var(--ink)",
              }}
              aria-current={step.state === "current" ? "step" : undefined}
            >
              {step.state === "complete" ? (
                <Check
                  className="size-3.5 shrink-0"
                  style={{ color: "var(--success)" }}
                  aria-hidden
                />
              ) : (
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    background:
                      step.state === "current" ? "var(--sun)" : "var(--line)",
                  }}
                  aria-hidden
                />
              )}
              {step.label}
            </div>
            {index < STEPS.length - 1 ? (
              <span
                className="mx-2 hidden h-px w-6 sm:inline-block sm:w-10"
                style={{ background: "var(--line)" }}
                aria-hidden
              />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="grid gap-4 sm:grid-cols-3">
        {ROLES.map((role) => (
          <Link
            key={role.href}
            href={role.href}
            className="group flex h-full flex-col rounded-xl border p-5 no-underline transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              borderColor: "var(--line)",
              background: "var(--surface)",
              outlineColor: "var(--primary-v2)",
            }}
          >
            <role.icon
              className="size-8"
              style={{ color: "var(--primary-v2)" }}
              aria-hidden
            />
            <h2
              className="mt-4 text-[1.05rem] font-semibold tracking-[-0.02em]"
              style={{ color: "var(--ink)" }}
            >
              {role.title}
            </h2>
            <p className="mt-2 flex-1 text-[14px] leading-snug" style={{ color: "var(--ink-3)" }}>
              {role.description}
            </p>
            <span
              className="mt-4 text-[13px] font-semibold transition-colors group-hover:underline"
              style={{ color: "var(--primary-v2)" }}
            >
              Get verified →
            </span>
          </Link>
        ))}
      </div>

      <footer
        className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-start gap-3">
          <Shield
            className="mt-0.5 size-5 shrink-0"
            style={{ color: "var(--primary-v2)" }}
            aria-hidden
          />
          <div>
            <p className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
              Secure identity verification powered by Didit
            </p>
            <p className="mt-0.5 text-[13px]" style={{ color: "var(--ink-3)" }}>
              Most people finish in under 5 minutes.
            </p>
          </div>
        </div>
        <Link href="/flights" className="btn-v2 btn-v2-ghost btn-v2-sm shrink-0 self-start sm:self-center">
          Browse flights
        </Link>
      </footer>
    </section>
  );
}
