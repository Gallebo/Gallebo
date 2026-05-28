import Link from "next/link";

import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { requirePilot } from "@/lib/auth/rbac";
import { getPilotReviewsPageData } from "@/lib/reviews/queries";

export const metadata = { title: "Reviews — Gallebo" };

function formatCountdown(deadlineIso: string | null): string {
  if (!deadlineIso) return "";
  const ms = new Date(deadlineIso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return "now";
  const mins = Math.ceil(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default async function PilotReviewsPage() {
  const { user } = await requirePilot();
  const { pending, awaitingReveal } = await getPilotReviewsPageData(user.id);

  return (
    <div>
      <PilotPageHeader
        eyebrow="Reviews"
        title="Passenger reviews"
        description="Blind two-way reviews — leave a rating within 24h of landing."
      />

      {pending.length > 0 ? (
        <section className="mb-8">
          <h2
            className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--ink-3)" }}
          >
            Awaiting your review
          </h2>
          <ul
            className="flex flex-col gap-3"
            style={{ listStyle: "none", margin: 0, padding: 0 }}
          >
            {pending.map((row) => (
              <li key={row.bookingId}>
                <Link
                  href={`/pilot/bookings/${row.bookingId}/review`}
                  className="block rounded-xl border p-4 no-underline transition-colors hover:bg-[var(--surface-alt)]"
                  style={{ borderColor: "var(--line)", background: "var(--surface)" }}
                >
                  <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                    {row.passengerName}
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: "var(--ink-3)" }}>
                    {row.routeLabel} · {row.flight_date}
                    {row.review_deadline_at
                      ? ` · deadline in ${formatCountdown(row.review_deadline_at)}`
                      : null}
                  </p>
                  <p
                    className="mt-2 text-[13px] font-medium"
                    style={{ color: "var(--primary-v2)" }}
                  >
                    Leave review →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {awaitingReveal.length > 0 ? (
        <section className="mb-8">
          <h2
            className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--ink-3)" }}
          >
            Awaiting reveal
          </h2>
          <ul
            className="flex flex-col gap-3"
            style={{ listStyle: "none", margin: 0, padding: 0 }}
          >
            {awaitingReveal.map((row) => (
              <li
                key={row.bookingId}
                className="rounded-xl border p-4 text-[13px]"
                style={{
                  borderColor: "var(--line)",
                  background: "color-mix(in srgb, var(--sun) 8%, var(--surface))",
                  color: "var(--ink-2)",
                }}
              >
                <p className="font-semibold" style={{ color: "var(--ink)" }}>
                  {row.passengerName}
                </p>
                <p className="mt-1">
                  {row.routeLabel} · {row.flight_date} — recenzija poslana, čeka
                  otkrivanje.
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pending.length === 0 && awaitingReveal.length === 0 ? (
        <p className="text-[14px]" style={{ color: "var(--ink-3)" }}>
          No flights are waiting for your review right now.
        </p>
      ) : null}
    </div>
  );
}
