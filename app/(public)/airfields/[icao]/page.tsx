import { notFound } from "next/navigation";

import { AirfieldAbout } from "@/components/airfield/public/airfield-about";
import { AirfieldEvents } from "@/components/airfield/public/airfield-events";
import { AirfieldFlights } from "@/components/airfield/public/airfield-flights";
import { AirfieldGallery } from "@/components/airfield/public/airfield-gallery";
import { AirfieldHero } from "@/components/airfield/public/airfield-hero";
import { AirfieldInfoGrid } from "@/components/airfield/public/airfield-info-grid";
import { AirfieldLocation } from "@/components/airfield/public/airfield-location";
import { AirfieldNearby } from "@/components/airfield/public/airfield-nearby";
import { AirfieldNotices } from "@/components/airfield/public/airfield-notices";
import { AirfieldReviews } from "@/components/airfield/public/airfield-reviews";
import { JsonLd } from "@/components/seo/json-ld";
import { getFlightsForAirfieldCached } from "@/lib/flights/cached-search";
import { airfieldPageJsonLd } from "@/lib/seo/json-ld";
import { createClient } from "@/lib/supabase/server";
import type { FlightListItem } from "@/lib/flights/types";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ icao: string }>;
}) {
  const { icao } = await params;
  const supabase = await createClient();
  const { data: airfield } = await supabase
    .from("airfields")
    .select("name, icao_code")
    .eq("icao_code", icao.toUpperCase())
    .eq("status", "active")
    .maybeSingle();

  if (!airfield) {
    return { title: "Airfield not found — Gallebo" };
  }

  return {
    title: `${airfield.name} (${airfield.icao_code}) — Gallebo`,
    description: `Explore flights, facilities and reviews at ${airfield.name}`,
    alternates: { canonical: `/airfields/${icao.toLowerCase()}` },
    openGraph: {
      title: `${airfield.name} (${airfield.icao_code})`,
      description: `Explore cost-shared flights at ${airfield.name}`,
      url: `/airfields/${icao.toLowerCase()}`,
    },
  };
}

function toFlightRow(f: FlightListItem) {
  const seatsTotal = f.passenger_seats;
  const seatsAvailable = Math.max(0, seatsTotal - f.pending_bookings);
  return {
    id: f.id,
    origin_icao: f.departure_airfield?.icao_code ?? "—",
    destination_icao: f.arrival_airfield?.icao_code ?? "—",
    departure_at: `${f.flight_date}T${f.departure_time}`,
    price_per_seat_eur: f.price_per_passenger_eur,
    seats_available: seatsAvailable,
    seats_total: seatsTotal,
    aircraft_type: f.rented_model ?? null,
    duration_min: null as number | null,
    pilot: f.pilot
      ? {
          first_name: f.pilot.first_name,
          last_name: f.pilot.last_name,
          avatar_url: null,
        }
      : null,
  };
}

export default async function AirfieldProfilePage({
  params,
}: {
  params: Promise<{ icao: string }>;
}) {
  const { icao } = await params;
  const supabase = await createClient();

  const { data: airfield } = await supabase
    .from("airfields")
    .select("*")
    .eq("icao_code", icao.toUpperCase())
    .eq("status", "active")
    .maybeSingle();

  if (!airfield) notFound();

  const [{ departing, arriving }, photos, notices, events] = await Promise.all([
    getFlightsForAirfieldCached(airfield.id),
    supabase
      .from("airfield_photos")
      .select("*")
      .eq("airfield_id", airfield.id)
      .order("sort_order"),
    supabase
      .from("airfield_notices")
      .select("*")
      .eq("airfield_id", airfield.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("airfield_events")
      .select("*")
      .eq("airfield_id", airfield.id)
      .order("event_date", { ascending: true }),
  ]);

  const heroPhoto = photos.data?.[0] ?? null;
  const galleryPhotos = (photos.data ?? []).slice(1);
  const flightCount = departing.length + arriving.length;

  return (
    <div style={{ background: "var(--bg)" }}>
      <JsonLd
        data={airfieldPageJsonLd({
          name: airfield.name,
          icao: airfield.icao_code,
          country: airfield.country,
          latitude: airfield.latitude,
          longitude: airfield.longitude,
        })}
      />
      {/* 1 — Hero */}
      <AirfieldHero
        airfield={{
          name: airfield.name,
          icao_code: airfield.icao_code,
          country: airfield.country,
          has_fuel: airfield.has_fuel,
          has_hangar: airfield.has_hangar,
          has_rental: airfield.has_rental,
        }}
        heroPhotoPath={heroPhoto?.storage_path ?? null}
        flightCount={flightCount}
      />

      {/* 2 — Info grid */}
      <AirfieldInfoGrid
        airfield={{
          has_fuel: airfield.has_fuel,
          has_hangar: airfield.has_hangar,
          has_rental: airfield.has_rental,
          contact_email: airfield.contact_email,
          contact_phone: airfield.contact_phone,
          working_hours: airfield.working_hours,
        }}
      />

      {/* 3 — Gallery */}
      {galleryPhotos.length > 0 && (
        <AirfieldGallery
          airfieldName={airfield.name}
          photos={galleryPhotos}
        />
      )}

      {/* 4 — About + blockquote */}
      <AirfieldAbout
        airfieldName={airfield.name}
        description={airfield.description ?? null}
        destinationInfo={airfield.destination_info ?? null}
      />

      {/* 5 — Nearby (static placeholder) */}
      <AirfieldNearby airfieldName={airfield.name} />

      {/* 6 — Events */}
      <AirfieldEvents events={events.data ?? []} />

      {/* 7 — Notices */}
      <AirfieldNotices notices={notices.data ?? []} />

      {/* 8 — Flights */}
      <AirfieldFlights
        icao={airfield.icao_code}
        departing={departing.map(toFlightRow)}
        arriving={arriving.map(toFlightRow)}
      />

      {/* 9 — Reviews (placeholder data until reviews table exists) */}
      <AirfieldReviews />

      {/* 10 — Location map */}
      <AirfieldLocation
        airfieldName={airfield.name}
        latitude={airfield.latitude}
        longitude={airfield.longitude}
        country={airfield.country}
      />
    </div>
  );
}
