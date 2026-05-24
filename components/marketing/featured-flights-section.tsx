import Link from "next/link";
import Image from "next/image";

import { Reveal } from "@/components/ui/reveal";
import { availableSeats, flightPhotoUrl, pilotDisplayName } from "@/lib/flights/utils";
import type { FlightListItem } from "@/lib/flights/types";
import { publicStorageUrl } from "@/lib/storage/public-url";

function FlightCard({ flight }: { flight: FlightListItem }) {
  const photos = [...(flight.flight_photos ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  const cover = photos[0];
  const seats = availableSeats(flight);
  const pilotName = pilotDisplayName(flight.pilot);
  const avatarUrl =
    flight.pilot?.avatar_path && flight.pilot.avatar_path.length > 0
      ? publicStorageUrl("profile-photos", flight.pilot.avatar_path)
      : null;

  return (
    <Link
      href={`/flights/${flight.id}`}
      className="flight-card-v2 block no-underline"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {/* Map / photo area */}
      <div style={{ height: 200, position: "relative", background: "var(--surface-alt)" }}>
        {cover ? (
          <Image
            src={flightPhotoUrl(cover.storage_path)}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width:640px) 100vw, 400px"
            unoptimized
          />
        ) : (
          <div
            className="gallebo-photo-placeholder gallebo-map-grid absolute inset-0"
            aria-hidden="true"
          />
        )}
        {/* Type badge */}
        <div className="absolute left-3 top-3">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{
              background: "var(--coral)",
              color: "#fff",
            }}
          >
            {flight.flight_type === "panoramic" ? "Scenic" : flight.flight_type === "excursion" ? "Excursion" : "Transfer"}
          </span>
        </div>
        {/* Plane icon */}
        <div
          className="absolute right-3 top-3 flex items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            background: "var(--surface)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--ink)" }}>
            <path d="M21 11l-9.5 5.5L9 19l-1.5-1.5L9.5 13 4 13l-1.5-1.5L4 10l5 .5L11.5 6 13 4.5 14.5 6 13 11l8-1z" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
            lineHeight: 1.3,
          }}
        >
          {flight.departure_airfield?.name ?? "—"}{" "}
          <span style={{ color: "var(--coral)" }}>→</span>{" "}
          {flight.arrival_airfield?.name ?? "—"}
        </div>
        <div
          className="mt-1 text-[12px] font-medium uppercase tracking-[0.08em]"
          style={{
            color: "var(--ink-3)",
            fontFamily: "var(--font-mono-v2)",
          }}
        >
          {flight.departure_airfield?.icao_code ?? ""} ·{" "}
          {flight.arrival_airfield?.icao_code ?? ""}
        </div>

        {/* Bottom row */}
        <div
          className="mt-5 flex items-end justify-between"
          style={{ paddingTop: 18, borderTop: "1px solid var(--line)" }}
        >
          {/* Pilot */}
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              <div className="relative size-9 overflow-hidden rounded-full">
                <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div
                className="flex size-9 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #0a4d8c, #1e6fb8)" }}
              >
                {pilotName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                {pilotName}
              </div>
              {flight.pilot_avg_rating != null && (
                <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--sun)" }}>
                  ★ {Number(flight.pilot_avg_rating).toFixed(1)}
                </div>
              )}
            </div>
          </div>
          {/* Price */}
          <div className="text-right">
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 1,
                color: "var(--ink)",
              }}
            >
              €{Number(flight.price_per_passenger_eur).toFixed(0)}
            </div>
            <div
              className="mt-1 text-[11px] font-medium uppercase tracking-[0.06em]"
              style={{
                color: seats <= 1 ? "var(--coral)" : "var(--ink-3)",
                fontFamily: "var(--font-mono-v2)",
              }}
            >
              {seats} seat{seats === 1 ? "" : "s"} left
            </div>
          </div>
        </div>
        {/* Date/time */}
        <div
          className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em]"
          style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono-v2)" }}
        >
          {flight.flight_date} · {String(flight.departure_time).slice(0, 5)} Local
        </div>
      </div>
    </Link>
  );
}

export function FeaturedFlightsSection({
  flights,
}: {
  flights: FlightListItem[];
}) {
  if (flights.length === 0) return null;

  return (
    <section style={{ padding: "120px 0" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--coral)" }}
              >
                Popular this week
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(36px, 4.8vw, 60px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.08,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Routes flying soon.
              </h2>
            </div>
            <Link
              href="/flights"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-medium transition-colors hover:opacity-80"
              style={{
                background: "transparent",
                border: "1px solid var(--line)",
                color: "var(--ink-2)",
              }}
            >
              See all flights
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {flights.slice(0, 3).map((f, i) => (
            <Reveal key={f.id} delay={i * 110}>
              <FlightCard flight={f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
