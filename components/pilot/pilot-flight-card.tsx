import Link from "next/link";

import { MarkFlightCompleteButton } from "@/components/bookings/mark-flight-complete-button";
import type { PilotFlightRow } from "@/lib/pilot/queries";

function formatFlightDate(iso: string, time: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${date} ${time}`;
}

export function PilotFlightCard({
  flight,
  showViewAll,
}: {
  flight: PilotFlightRow;
  showViewAll?: boolean;
}) {
  const pct =
    flight.passenger_seats > 0
      ? Math.min(100, (flight.booked_seats / flight.passenger_seats) * 100)
      : 0;
  const isOpen = flight.booked_seats < flight.passenger_seats;
  const statusLabel = isOpen && flight.status === "published" ? "Open" : "Confirmed";
  const statusStyle =
    statusLabel === "Open"
      ? { color: "var(--primary-v2)", borderColor: "var(--primary-v2)" }
      : { color: "var(--success)", borderColor: "var(--success)" };

  return (
    <article
      className="flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <div className="min-w-0 flex-1">
        <p
          className="text-[1.1rem] font-semibold tracking-[-0.01em]"
          style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
        >
          {flight.departure_icao} — {flight.arrival_icao}
        </p>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--ink-3)" }}>
          {flight.departure_name} — {flight.arrival_name}
        </p>
        <p className="mt-1 text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>
          {formatFlightDate(flight.flight_date, flight.departure_time)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="min-w-[140px] flex-1">
            <div className="mb-1 flex justify-between text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ink-3)" }}>
              <span>
                {flight.booked_seats}/{flight.passenger_seats} seats
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full"
              style={{ background: "var(--surface-alt)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: "var(--success)" }}
              />
            </div>
          </div>
          <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
            €{flight.price_per_passenger_eur.toFixed(0)}
            <span className="text-[12px] font-normal" style={{ color: "var(--ink-3)" }}>
              /seat
            </span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
          style={statusStyle}
        >
          {statusLabel}
        </span>
        {flight.status === "published" ? (
          <MarkFlightCompleteButton flightId={flight.id} />
        ) : null}
        {showViewAll !== false && flight.status === "published" ? (
          <Link
            href={`/flights/${flight.id}`}
            className="text-[13px] font-medium no-underline"
            style={{ color: "var(--primary-v2)" }}
          >
            View
          </Link>
        ) : null}
      </div>
    </article>
  );
}
