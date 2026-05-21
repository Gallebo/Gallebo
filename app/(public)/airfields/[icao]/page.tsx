import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Fuel, Mail, Phone, Plane, Warehouse } from "lucide-react";

import { AirfieldMiniMap } from "@/components/map/airfield-mini-map";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlightListCard } from "@/components/flights/flight-list-card";
import {
  formatServiceLabels,
  getAirfieldPhotoPublicUrl,
} from "@/lib/airfield/utils";
import { getFlightsForAirfield } from "@/lib/flights/search";
import { createClient } from "@/lib/supabase/server";

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
    description: `Airfield profile for ${airfield.name}`,
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

  const { departing, arriving } = await getFlightsForAirfield(airfield.id);

  const [{ data: photos }, { data: notices }, { data: events }] =
    await Promise.all([
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

  const services = formatServiceLabels(airfield);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight">
            {airfield.name}
          </h1>
          <Badge variant="secondary">{airfield.icao_code}</Badge>
          <Badge>{airfield.country}</Badge>
        </div>
        {services.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {airfield.has_fuel ? (
              <Badge variant="outline">
                <Fuel className="mr-1 size-3" /> Fuel
              </Badge>
            ) : null}
            {airfield.has_hangar ? (
              <Badge variant="outline">
                <Warehouse className="mr-1 size-3" /> Hangar
              </Badge>
            ) : null}
            {airfield.has_rental ? (
              <Badge variant="outline">
                <Plane className="mr-1 size-3" /> Aircraft rental
              </Badge>
            ) : null}
          </div>
        ) : null}
        {airfield.description ? (
          <p className="text-muted-foreground">{airfield.description}</p>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AirfieldMiniMap
            latitude={airfield.latitude}
            longitude={airfield.longitude}
            name={airfield.name}
          />

          {photos && photos.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Photos</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {photos.map((photo) => {
                  const url = getAirfieldPhotoPublicUrl(photo.storage_path);
                  if (!url) return null;
                  return (
                    <div
                      key={photo.id}
                      className="relative aspect-video overflow-hidden rounded-lg border"
                    >
                      <Image
                        src={url}
                        alt={`${airfield.name} photo`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {airfield.destination_info ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Destination</h2>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {airfield.destination_info}
              </p>
            </section>
          ) : null}

          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Flights</h2>
            {departing.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Departing
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {departing.map((f) => (
                    <FlightListCard key={f.id} flight={f} />
                  ))}
                </div>
              </div>
            ) : null}
            {arriving.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Arriving
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {arriving.map((f) => (
                    <FlightListCard key={f.id} flight={f} />
                  ))}
                </div>
              </div>
            ) : null}
            {departing.length === 0 && arriving.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  No upcoming flights at this airfield.
                </CardContent>
              </Card>
            ) : null}
          </section>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {airfield.contact_email ? (
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <a
                    href={`mailto:${airfield.contact_email}`}
                    className="hover:underline"
                  >
                    {airfield.contact_email}
                  </a>
                </p>
              ) : null}
              {airfield.contact_phone ? (
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  {airfield.contact_phone}
                </p>
              ) : null}
              {airfield.working_hours ? (
                <p className="text-muted-foreground">{airfield.working_hours}</p>
              ) : null}
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Notices</h2>
            {notices && notices.length > 0 ? (
              <div className="space-y-3">
                {notices.map((notice) => (
                  <Card key={notice.id}>
                    <CardContent className="py-4 text-sm">
                      <p className="whitespace-pre-wrap">{notice.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(notice.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notices posted.</p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Events</h2>
            {events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="py-4 text-sm">
                      <p className="flex items-center gap-2 font-medium">
                        <Calendar className="size-4 text-muted-foreground" />
                        {event.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString()}
                      </p>
                      {event.description ? (
                        <p className="mt-2 text-muted-foreground">
                          {event.description}
                        </p>
                      ) : null}
                      {event.link ? (
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-primary hover:underline"
                        >
                          More info
                        </a>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            )}
          </section>
        </div>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        <Link href="/map" className="text-primary hover:underline">
          ← Back to map
        </Link>
      </p>
    </div>
  );
}
