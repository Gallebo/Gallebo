import { AirfieldMiniMap } from "@/components/map/airfield-mini-map";

interface AirfieldLocationProps {
  airfieldName: string;
  latitude: number;
  longitude: number;
  country?: string | null;
  region?: string | null;
}

export function AirfieldLocation({
  airfieldName,
  latitude,
  longitude,
  country,
  region,
}: AirfieldLocationProps) {
  const locationLabel = [region, country].filter(Boolean).join(", ");

  const latStr = `${Math.abs(latitude).toFixed(3)}° ${latitude >= 0 ? "N" : "S"}`;
  const lngStr = `${Math.abs(longitude).toFixed(3)}° ${longitude >= 0 ? "E" : "W"}`;

  return (
    <section className="py-16" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--ink-3)" }}
          >
            Location
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--ink)",
              margin: "0 0 6px",
            }}
          >
            Where it is.
          </h2>
          <p className="text-[14px]" style={{ color: "var(--ink-3)" }}>
            {latStr} · {lngStr}
            {locationLabel ? ` · ${locationLabel}` : ""}
          </p>
        </div>

        <div
          className="overflow-hidden rounded-2xl"
          style={{ border: "1px solid var(--line)" }}
        >
          <AirfieldMiniMap
            latitude={latitude}
            longitude={longitude}
            name={airfieldName}
          />
        </div>
      </div>
    </section>
  );
}
