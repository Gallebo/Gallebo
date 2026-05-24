import Image from "next/image";
import Link from "next/link";
import { getAirfieldPhotoPublicUrl } from "@/lib/airfield/utils";

interface AirfieldHeroProps {
  airfield: {
    name: string;
    icao_code: string;
    country: string;
    region?: string | null;
    elevation_ft?: number | null;
    runway_length_m?: number | null;
    runway_surface?: string | null;
    has_fuel?: boolean;
    has_hangar?: boolean;
    has_rental?: boolean;
  };
  heroPhotoPath?: string | null;
  flightCount?: number;
}

export function AirfieldHero({ airfield, heroPhotoPath, flightCount = 0 }: AirfieldHeroProps) {
  const heroUrl = heroPhotoPath ? getAirfieldPhotoPublicUrl(heroPhotoPath) : null;

  const runwayLabel = airfield.runway_length_m
    ? `${airfield.runway_length_m.toLocaleString()}m ${airfield.runway_surface ?? ""}`.trim()
    : null;

  const breadcrumb = [airfield.region, airfield.country].filter(Boolean).join(", ");

  return (
    <section
      className="relative flex flex-col justify-end overflow-hidden"
      style={{ minHeight: "min(72vh, 600px)" }}
    >
      {/* Background */}
      {heroUrl ? (
        <Image
          src={heroUrl}
          alt={`${airfield.name} aerial view`}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #5B7A99 0%, #8FA7B8 40%, #B0976B 70%, #7A6A4F 100%)",
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* Top nav strip */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 py-5">
        <Link
          href="/airfields"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm transition-opacity hover:opacity-80"
          style={{ background: "rgba(255,255,255,.18)", letterSpacing: "0.12em" }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          All airfields
        </Link>

        {/* METAR widget placeholder */}
        <div
          className="hidden rounded-xl px-4 py-3 text-right sm:block"
          style={{
            background: "rgba(0,0,0,.55)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,.12)",
            color: "rgba(255,255,255,.85)",
            fontSize: 11,
            fontFamily: "var(--font-mono, monospace)",
            lineHeight: 1.7,
            minWidth: 160,
          }}
        >
          <div className="flex justify-between gap-6">
            <span style={{ color: "rgba(255,255,255,.5)" }}>METAR</span>
            <span>VFR · CALM</span>
          </div>
          <div className="flex justify-between gap-6">
            <span style={{ color: "rgba(255,255,255,.5)" }}>WIND</span>
            <span>—</span>
          </div>
          <div className="flex justify-between gap-6">
            <span style={{ color: "rgba(255,255,255,.5)" }}>VIS</span>
            <span>&gt;10 KM</span>
          </div>
          <div className="flex justify-between gap-6">
            <span style={{ color: "rgba(255,255,255,.5)" }}>QNH</span>
            <span>— hPa</span>
          </div>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 px-6 pb-8 sm:px-10">
        {/* Eyebrow */}
        <div className="mb-4 flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "var(--coral)", color: "#fff" }}
          >
            {airfield.icao_code}
          </span>
          {breadcrumb && (
            <span className="text-[12px] font-medium uppercase tracking-widest text-white/70">
              {breadcrumb}
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px, 7vw, 80px)",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            margin: "0 0 20px",
          }}
        >
          {airfield.name}
        </h1>

        {/* Stats row */}
        <div className="mb-6 flex flex-wrap items-end gap-8">
          {airfield.elevation_ft != null && (
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                Elevation
              </p>
              <p className="text-[17px] font-semibold text-white">
                {airfield.elevation_ft.toLocaleString()} ft AMSL
              </p>
            </div>
          )}
          {runwayLabel && (
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                Runway
              </p>
              <p className="text-[17px] font-semibold text-white capitalize">{runwayLabel}</p>
            </div>
          )}
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
              Flights / month
            </p>
            <p className="text-[17px] font-semibold text-white">{flightCount}</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/flights?origin=${airfield.icao_code}`}
            className="btn-v2 btn-coral inline-flex items-center gap-2"
          >
            Book a flight
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-[14px] font-medium text-white backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/10"
          >
            Share
          </button>
        </div>
      </div>

      {/* Bottom photo strip strip credit */}
      {heroPhotoPath && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10 px-6 py-2 text-[10px] uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,.35)" }}
        >
          {[
            "Hero photo",
            "Vrsar Airfield",
            "LDPV Runway/landscape",
          ].join(" · ")}
        </div>
      )}
    </section>
  );
}
