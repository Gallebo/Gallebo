import Link from "next/link";

interface FlightRow {
  id: string;
  origin_icao: string;
  destination_icao: string;
  departure_at: string;
  price_per_seat_eur: number;
  seats_available: number;
  seats_total: number;
  aircraft_type?: string | null;
  duration_min?: number | null;
  pilot?: {
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

interface AirfieldFlightsProps {
  icao: string;
  departing: FlightRow[];
  arriving: FlightRow[];
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function FlightRow({ flight, direction }: { flight: FlightRow; direction: "departing" | "arriving" }) {
  const date = new Date(flight.departure_at);
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "short" }).toUpperCase();
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const pilotName = flight.pilot
    ? [flight.pilot.first_name, flight.pilot.last_name].filter(Boolean).join(" ")
    : "Pilot";

  const initials = pilotName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const seatsLeft = flight.seats_available;
  const seatsTotal = flight.seats_total;
  const almostFull = seatsLeft <= 1;

  return (
    <div
      className="flex items-center gap-5 py-5 transition-colors hover:bg-[var(--surface)]"
      style={{ borderTop: "1px solid var(--line)", padding: "20px 0" }}
    >
      {/* Date */}
      <div className="w-12 flex-shrink-0 text-center">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--coral)" }}
        >
          {month}
        </p>
        <p
          className="text-[28px] font-bold leading-none"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--ink)",
            letterSpacing: "-0.03em",
          }}
        >
          {day}
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--ink-3)" }}>{time}</p>
      </div>

      {/* Route */}
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
          {direction === "departing"
            ? `${flight.origin_icao} → ${flight.destination_icao}`
            : `${flight.origin_icao} → ${flight.destination_icao}`}
        </p>
        <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
          {flight.origin_icao} · {flight.destination_icao}
          {flight.duration_min ? ` · ${formatDuration(flight.duration_min)}` : ""}
          {flight.aircraft_type ? ` · ${flight.aircraft_type}` : ""}
        </p>
      </div>

      {/* Pilot */}
      <div className="hidden items-center gap-3 sm:flex">
        <div
          className="flex items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{
            width: 34,
            height: 34,
            background: "var(--primary-v2)",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <p className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
            {pilotName}
          </p>
        </div>
      </div>

      {/* Price + seats */}
      <div className="flex-shrink-0 text-right">
        <p
          className="text-[19px] font-bold"
          style={{ color: almostFull ? "var(--coral)" : "var(--ink)" }}
        >
          €{flight.price_per_seat_eur}
        </p>
        <p
          className="text-[12px] font-medium uppercase tracking-wide"
          style={{ color: almostFull ? "var(--coral)" : "var(--ink-3)" }}
        >
          {seatsLeft}/{seatsTotal} seats
        </p>
      </div>

      {/* CTA */}
      <Link
        href={`/flights/${flight.id}`}
        className="btn-v2 btn-primary ml-1 flex-shrink-0"
      >
        View flight
      </Link>
    </div>
  );
}

export function AirfieldFlights({ icao, departing, arriving }: AirfieldFlightsProps) {
  if (departing.length === 0 && arriving.length === 0) {
    return (
      <section className="py-16" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p
              className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--ink-3)" }}
            >
              Departures
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
                margin: 0,
              }}
            >
              Flights leaving {icao}.
            </h2>
          </div>
          <p style={{ color: "var(--ink-3)", fontSize: 14 }}>No upcoming flights from this airfield.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {departing.length > 0 && (
        <section className="py-16" style={{ background: "var(--bg)" }}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p
                  className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "var(--ink-3)" }}
                >
                  Departures
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(28px, 4vw, 44px)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: "var(--ink)",
                    margin: 0,
                  }}
                >
                  Flights leaving {icao}.
                </h2>
                <p className="mt-1 text-[14px]" style={{ color: "var(--ink-3)" }}>
                  Most recent cost-shared seats. Hit View flight to see the route and pilot details.
                </p>
              </div>
              <Link
                href={`/flights?origin=${icao}`}
                className="hidden items-center gap-1.5 text-[13px] font-medium sm:flex"
                style={{ color: "var(--primary-v2)" }}
              >
                See all departures
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div>
              {departing.map((f) => (
                <FlightRow key={f.id} flight={f} direction="departing" />
              ))}
            </div>
          </div>
        </section>
      )}

      {arriving.length > 0 && (
        <section
          className="py-16"
          style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--ink-3)" }}
              >
                Arrivals
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(28px, 4vw, 44px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Flights arriving {icao}.
              </h2>
            </div>
            <div>
              {arriving.map((f) => (
                <FlightRow key={f.id} flight={f} direction="arriving" />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
