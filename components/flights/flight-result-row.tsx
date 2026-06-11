import Image from "next/image";
import Link from "next/link";

import { FlightRouteMap } from "@/components/flights/flight-route-map";
import {
  flightTypeBadge,
  flightRouteMeta,
} from "@/lib/flights/route-meta";
import { availableSeats, pilotDisplayName } from "@/lib/flights/utils";
import type { FlightListItem } from "@/lib/flights/types";
import { publicStorageUrl } from "@/lib/storage/public-url";

function formatFlightDate(iso: string): { month: string; day: string } {
  const d = new Date(`${iso}T12:00:00`);
  return {
    month: d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
    day: d.getDate().toString().padStart(2, "0"),
  };
}

export function FlightResultRow({
  flight,
  revealPilotName = false,
}: {
  flight: FlightListItem;
  revealPilotName?: boolean;
}) {
  const { month, day } = formatFlightDate(flight.flight_date);
  const time = String(flight.departure_time).slice(0, 5);
  const route = flightRouteMeta(flight);
  const badge = flightTypeBadge(flight.flight_type);
  const seatsLeft = availableSeats(flight);
  const totalSeats = flight.passenger_seats;
  const pilotName = pilotDisplayName(flight.pilot, { revealFull: revealPilotName });
  const avatarUrl =
    flight.pilot?.avatar_path && flight.pilot.avatar_path.length > 0
      ? publicStorageUrl("profile-photos", flight.pilot.avatar_path)
      : null;
  const aircraft = flight.rented_model?.toUpperCase() ?? "AIRCRAFT TBD";

  const statsLine = [route.durationLabel, route.distanceNm !== null ? `${route.distanceNm} NM` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className="flex flex-col gap-4 rounded-xl border p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-5 sm:p-5"
      style={{
        borderColor: "var(--line)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Date / time */}
      <div className="flex shrink-0 items-center gap-4 sm:w-[100px] sm:flex-col sm:items-start sm:gap-1">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--ink-3)" }}
          >
            {month}
          </p>
          <p
            className="text-[2rem] font-medium leading-none tracking-[-0.03em]"
            style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
          >
            {day}
          </p>
        </div>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.08em] sm:mt-2"
          style={{ color: "var(--ink-3)" }}
        >
          {time} local
        </p>
      </div>

      <FlightRouteMap />

      {/* Details */}
      <div className="min-w-0 flex-1">
        <h2
          className="text-[1.35rem] font-medium leading-tight tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
        >
          {route.title}
        </h2>
        <p className="mt-0.5 text-[13px] font-medium" style={{ color: "var(--ink-3)" }}>
          {route.codes}
        </p>
        {statsLine ? (
          <p className="mt-1 text-[13px]" style={{ color: "var(--ink-2)" }}>
            {statsLine}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {avatarUrl ? (
              <div className="relative size-8 overflow-hidden rounded-full">
                <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div
                className="flex size-8 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ background: "var(--surface-alt)", color: "var(--ink-2)" }}
              >
                {pilotName.slice(0, 1)}
              </div>
            )}
            <div>
              <Link
                href={`/pilots/${flight.pilot_user_id}`}
                className="text-[14px] font-semibold hover:underline"
                style={{ color: "var(--ink)" }}
              >
                {pilotName}
              </Link>
              {flight.pilot_avg_rating !== null && flight.pilot_avg_rating !== undefined ? (
                <p className="flex items-center gap-1 text-[12px]" style={{ color: "var(--ink-3)" }}>
                  <StarIcon />
                  {flight.pilot_avg_rating}
                  {flight.pilot_review_count ? (
                    <span> / {flight.pilot_review_count}</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>

          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
            style={
              badge.variant === "scenic"
                ? { background: "var(--coral)", color: "#fff" }
                : { background: "var(--surface-alt)", color: "var(--ink-2)", border: "1px solid var(--line)" }
            }
          >
            {badge.label}
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
            style={{
              background: "var(--surface-alt)",
              color: "var(--ink-2)",
              border: "1px solid var(--line)",
            }}
          >
            {aircraft}
          </span>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t pt-4 sm:w-[148px] sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        <div className="text-right">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--ink-3)" }}
          >
            From
          </p>
          <p
            className="text-[2rem] font-semibold leading-none tracking-[-0.03em]"
            style={{ color: "var(--ink)" }}
          >
            €{Number(flight.price_per_passenger_eur).toFixed(0)}
          </p>
          <p
            className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--ink-3)" }}
          >
            {seatsLeft}/{totalSeats} seats left
          </p>
        </div>
        <Link
          href={`/flights/${flight.id}`}
          className="btn-v2-primary inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-[14px] font-semibold no-underline"
        >
          View flight
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function StarIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="var(--sun)" aria-hidden="true">
      <path d="M12 2l2.9 6.9 7.5.6-5.7 4.9 1.7 7.3L12 18.8 6.6 21.7l1.7-7.3L2.6 9.5l7.5-.6L12 2z" />
    </svg>
  );
}
