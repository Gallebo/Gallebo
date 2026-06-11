import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Plane, Star } from "lucide-react";

import { BookingRequestButton } from "@/components/flights/booking-request-button";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FLIGHT_LANGUAGE_LABELS, FLIGHT_TYPE_LABELS } from "@/lib/flights/constants";
import { getPassengerWeightWarning } from "@/lib/flights/weight-check";
import { getFlightById } from "@/lib/flights/search";
import { hasConfirmedBookingForFlight } from "@/lib/flights/pilot-privacy";
import {
  availableSeats,
  flightPhotoUrl,
  formatFlightRoute,
  pilotDisplayName,
  shouldRevealPilotName,
} from "@/lib/flights/utils";
import { getProfile, getSessionUser } from "@/lib/auth/rbac";
import {
  flightMetadataDescription,
  flightMetadataImage,
  flightPageJsonLd,
} from "@/lib/seo/json-ld";
import { publicStorageUrl } from "@/lib/storage/public-url";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flight = await getFlightById(id);
  if (!flight) return { title: "Flight not found — Gallebo" };

  const title = `${formatFlightRoute(flight)} — Gallebo`;
  const description = flightMetadataDescription(flight);
  const image = flightMetadataImage(flight);
  const departureAt = new Date(
    `${flight.flight_date}T${String(flight.departure_time).slice(0, 8)}`,
  );
  const metadata = {
    title,
    description,
    alternates: { canonical: `/flights/${id}` },
    openGraph: {
      title,
      description,
      type: "website" as const,
      url: `/flights/${id}`,
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [image],
    },
  };

  if (departureAt.getTime() < Date.now()) {
    return { ...metadata, robots: { index: false } };
  }

  return metadata;
}

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flight = await getFlightById(id);
  if (!flight) notFound();

  const authUser = await getSessionUser();
  const profile = await getProfile();
  const seatsLeft = availableSeats(flight);
  const weightWarning =
    profile?.weight_encrypted && profile.role === "passenger"
      ? getPassengerWeightWarning(profile.weight_encrypted, seatsLeft)
      : null;

  const supabase = await createClient();
  let aircraftLabel = "Rented aircraft";
  if (flight.aircraft_id) {
    const { data: ac } = await supabase
      .from("aircraft")
      .select("model, registration, seats")
      .eq("id", flight.aircraft_id)
      .maybeSingle();
    if (ac) {
      aircraftLabel = `${ac.model} (${ac.registration}) — ${ac.seats} seats`;
    }
  } else if (flight.rented_model) {
    aircraftLabel = `${flight.rented_model} (${flight.rented_registration}) — ${flight.rented_seats} seats`;
  }

  const photos = [...(flight.flight_photos ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  const hasConfirmedBooking =
    authUser && profile?.role !== "admin"
      ? await hasConfirmedBookingForFlight(supabase, authUser.id, flight.id)
      : false;
  const revealPilotName = shouldRevealPilotName({
    viewerUserId: authUser?.id ?? null,
    viewerRole: profile?.role ?? null,
    flightPilotUserId: flight.pilot_user_id,
    hasConfirmedBooking,
  });
  const pilotName = pilotDisplayName(flight.pilot, { revealFull: revealPilotName });
  const avatarUrl =
    flight.pilot?.avatar_path && flight.pilot.avatar_path.length > 0
      ? publicStorageUrl("profile-photos", flight.pilot.avatar_path)
      : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-12 sm:px-6">
      <JsonLd data={flightPageJsonLd(flight)} />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4 max-sm:-mx-4 sm:mx-0">
          {photos.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {photos.map((p, i) => (
                <div
                  key={p.id}
                  className={`relative overflow-hidden bg-muted max-sm:rounded-none sm:rounded-lg ${i === 0 ? "aspect-[16/10] sm:col-span-2" : "aspect-[4/3]"}`}
                >
                  <Image
                    src={flightPhotoUrl(p.storage_path)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {formatFlightRoute(flight)}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {FLIGHT_TYPE_LABELS[flight.flight_type]}
            </p>
          </div>

          <p className="text-3xl font-bold text-primary">
            €{Number(flight.price_per_passenger_eur).toFixed(2)}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / passenger
            </span>
          </p>

          {flight.route_avg_price_eur !== null ? (
            <p className="text-sm text-muted-foreground">
              Average on this route: €{Number(flight.route_avg_price_eur).toFixed(2)} per
              passenger (cost-sharing reference)
            </p>
          ) : null}

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Calendar className="size-4" />
              {flight.flight_date} at {String(flight.departure_time).slice(0, 5)}
            </li>
            <li className="flex items-center gap-2">
              <Plane className="size-4" />
              {aircraftLabel}
            </li>
            <li>
              Language: {FLIGHT_LANGUAGE_LABELS[flight.communication_language]}
            </li>
            <li>
              {seatsLeft} of {flight.passenger_seats} passenger seats available
            </li>
          </ul>

          {flight.return_note ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Return note</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {flight.return_note}
                {flight.pilot_return_date
                  ? ` (pilot return: ${flight.pilot_return_date})`
                  : null}
              </CardContent>
            </Card>
          ) : null}

          {weightWarning ? (
            <p className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
              {weightWarning}
            </p>
          ) : null}

          <BookingRequestButton
            flightId={flight.id}
            canBook={seatsLeft > 0}
            isLoggedIn={Boolean(authUser)}
            isVerifiedPassenger={
              profile?.role === "passenger" && profile.status === "verified"
            }
          />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">About this flight</h2>
        <p className="whitespace-pre-wrap text-muted-foreground">{flight.description}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilot</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {avatarUrl ? (
            <div className="relative h-14 w-14 overflow-hidden rounded-full">
              <Image src={avatarUrl} alt="" fill className="object-cover" sizes="56px" />
            </div>
          ) : null}
          <div>
            <Link
              href={`/pilots/${flight.pilot_user_id}`}
              className="font-medium hover:underline"
            >
              {pilotName}
            </Link>
            {flight.pilot_avg_rating !== null ? (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {flight.pilot_avg_rating} · {flight.pilot_review_count} reviews
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            )}
            <Badge variant="secondary" className="mt-1">
              Verified pilot
            </Badge>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/flights" className="text-primary hover:underline">
          Back to search
        </Link>
      </p>
    </div>
  );
}
