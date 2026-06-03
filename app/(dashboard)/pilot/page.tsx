import Link from "next/link";

import { PilotBookingRequestRow } from "@/components/pilot/pilot-booking-request-row";
import { PilotFlightCard } from "@/components/pilot/pilot-flight-card";
import { PilotGreeting } from "@/components/pilot/pilot-greeting";
import { PilotMetricCard } from "@/components/pilot/pilot-metric-card";
import { requirePilot } from "@/lib/auth/rbac";
import { getPilotOverviewData } from "@/lib/pilot/queries";

export const metadata = { title: "Pilot dashboard — Gallebo" };

export default async function PilotOverviewPage() {
  const { user } = await requirePilot();
  const data = await getPilotOverviewData(user.id);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--ink-3)" }}
          >
            Pilot dashboard
          </p>
          <h1
            className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.03em]"
            style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
          >
            <PilotGreeting name={data.sidebar.firstName} />
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: "var(--ink-2)" }}>
            {data.pendingCount > 0
              ? `${data.pendingCount} booking request${data.pendingCount === 1 ? "" : "s"} waiting`
              : "No pending requests"}
            {data.stats.upcoming > 0
              ? ` · ${data.stats.upcoming} flight${data.stats.upcoming === 1 ? "" : "s"} coming up this week`
              : ""}
            .
          </p>
        </div>
        <Link
          href="/pilot/flights/new"
          className="btn-v2-coral inline-flex items-center gap-2 whitespace-nowrap px-5 py-3 text-[14px] font-semibold no-underline"
        >
          <span aria-hidden="true">+</span>
          Post a flight
        </Link>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PilotMetricCard
          label="Upcoming"
          value={data.stats.upcoming}
          sub={`Next: ${data.stats.nextFlightLabel}`}
        />
        <PilotMetricCard
          label={`Recouped (${new Date().toLocaleString("en", { month: "long" })})`}
          value={`€${data.stats.recoupedMonth.toLocaleString()}`}
          sub={
            data.stats.recoupedPending > 0
              ? `+€${data.stats.recoupedPending} pending`
              : undefined
          }
          valueColor="var(--success)"
        />
        <PilotMetricCard
          label="Rating"
          value={data.stats.rating !== null ? data.stats.rating : "—"}
          sub={
            data.stats.rating !== null
              ? `${data.stats.reviewCount} review${data.stats.reviewCount === 1 ? "" : "s"}`
              : "No reviews yet"
          }
          valueColor="var(--sun)"
        />
        <PilotMetricCard
          label="Total pax"
          value={data.stats.totalPax}
          sub="Carried since joining"
          valueColor="var(--ink)"
        />
      </div>

      {data.topWaitingRoutes.length > 0 ? (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2
              className="text-[1.15rem] font-semibold"
              style={{ color: "var(--ink)" }}
            >
              Routes with waiting passengers
            </h2>
            <Link
              href="/pilot/flights/new"
              className="text-[13px] font-medium no-underline"
              style={{ color: "var(--primary-v2)" }}
            >
              Post a flight
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {data.topWaitingRoutes.map((route) => (
              <li
                key={`${route.departureLabel}-${route.arrivalLabel}-${route.waitingCount}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: "var(--line)", background: "var(--surface)" }}
              >
                <span style={{ color: "var(--ink)" }}>
                  {route.departureLabel} → {route.arrivalLabel}
                </span>
                <span className="font-semibold" style={{ color: "var(--primary-v2)" }}>
                  {route.waitingCount}{" "}
                  {route.waitingCount === 1 ? "passenger" : "passengers"} waiting
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-[1.15rem] font-semibold" style={{ color: "var(--ink)" }}>
            Upcoming flights
          </h2>
          <Link
            href="/pilot/flights"
            className="text-[13px] font-medium no-underline"
            style={{ color: "var(--primary-v2)" }}
          >
            View all
          </Link>
        </div>
        {data.upcomingFlights.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.upcomingFlights.map((f) => (
              <PilotFlightCard key={f.id} flight={f} />
            ))}
          </div>
        ) : (
          <p className="text-[14px]" style={{ color: "var(--ink-3)" }}>
            No upcoming flights. Post your first route to start receiving requests.
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-[1.15rem] font-semibold" style={{ color: "var(--ink)" }}>
            Booking requests
          </h2>
          {data.pendingCount > 0 ? (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white"
              style={{ background: "var(--coral)" }}
            >
              {data.pendingCount} pending
            </span>
          ) : null}
        </div>
        {data.pendingRequests.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.pendingRequests.map((b) => (
              <PilotBookingRequestRow key={b.id} booking={b} />
            ))}
          </div>
        ) : (
          <p className="text-[14px]" style={{ color: "var(--ink-3)" }}>
            No pending booking requests.
          </p>
        )}
        {data.pendingCount > 2 ? (
          <Link
            href="/pilot/bookings"
            className="mt-4 inline-block text-[13px] font-medium no-underline"
            style={{ color: "var(--primary-v2)" }}
          >
            View all requests →
          </Link>
        ) : null}
      </section>
    </div>
  );
}
