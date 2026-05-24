import Link from "next/link";

import { PassengerBookingCardV3 } from "@/components/passenger/passenger-booking-card-v3";
import { PilotMetricCard } from "@/components/pilot/pilot-metric-card";
import { requireVerifiedPassenger } from "@/lib/auth/rbac";
import { getPassengerOverviewData } from "@/lib/passenger/queries";

export const metadata = { title: "Passenger dashboard — Gallebo" };

export default async function PassengerOverviewPage() {
  const { user } = await requireVerifiedPassenger();
  const data = await getPassengerOverviewData(user.id);
  const greeting = getGreeting(data.sidebar.firstName);

  return (
    <div>
      <div className="mb-8">
        <p
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--ink-3)" }}
        >
          Passenger dashboard
        </p>
        <h1
          className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.03em]"
          style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
        >
          {greeting}
        </h1>
        <p className="mt-2 text-[15px]" style={{ color: "var(--ink-2)" }}>
          {data.upcomingCount > 0
            ? `${data.upcomingCount} upcoming flight${data.upcomingCount === 1 ? "" : "s"} this month.`
            : "No upcoming flights yet."}{" "}
          {data.nextDepartureLabel !== "—"
            ? `Your next departure is ${data.nextDepartureLabel}.`
            : ""}
        </p>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <PilotMetricCard
          label="Upcoming"
          value={data.stats.upcoming}
          sub={data.nextDepartureLabel !== "—" ? `Next: ${data.nextDepartureLabel}` : undefined}
        />
        <PilotMetricCard
          label="Flights taken"
          value={data.stats.completed}
          sub="Since joining"
          valueColor="var(--ink)"
        />
        <PilotMetricCard
          label="Avg. cost / flight"
          value={data.stats.avgCost > 0 ? `€${data.stats.avgCost}` : "—"}
          sub="vs. commercial: ~€198"
          valueColor="var(--success)"
        />
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-[1.15rem] font-semibold" style={{ color: "var(--ink)" }}>
            Upcoming bookings
          </h2>
          <Link
            href="/passenger/bookings"
            className="text-[13px] font-medium no-underline"
            style={{ color: "var(--primary-v2)" }}
          >
            View all
          </Link>
        </div>
        {data.upcoming.length > 0 ? (
          <div className="flex flex-col gap-4">
            {data.upcoming.map((b) => (
              <PassengerBookingCardV3
                key={b.id}
                booking={b}
                currentUserId={user.id}
                compact
              />
            ))}
          </div>
        ) : (
          <p className="text-[14px]" style={{ color: "var(--ink-3)" }}>
            No upcoming bookings.{" "}
            <Link href="/flights" className="underline" style={{ color: "var(--primary-v2)" }}>
              Find a flight
            </Link>
          </p>
        )}
      </section>

      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border px-6 py-5"
        style={{
          borderColor: "var(--line)",
          background: "color-mix(in srgb, var(--coral) 8%, var(--surface))",
        }}
      >
        <p className="text-[14px]" style={{ color: "var(--ink-2)" }}>
          Ready for the next flight?{" "}
          <strong style={{ color: "var(--ink)" }}>
            {data.flightsAvailable} flights available
          </strong>{" "}
          across the Adriatic this week.
        </p>
        <Link
          href="/flights"
          className="btn-v2-primary inline-flex items-center gap-2 whitespace-nowrap px-5 py-2.5 text-[14px] font-semibold no-underline"
        >
          Find a flight →
        </Link>
      </div>
    </div>
  );
}

function getGreeting(firstName: string): string {
  return `Welcome back, ${firstName}.`;
}
