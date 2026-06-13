import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Plane, Star } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AircraftWithPhotos } from "@/lib/aircraft/types";
import { averageRating } from "@/lib/pilot/review-stats";
import { pilotPageJsonLd } from "@/lib/seo/json-ld";
import { publicStorageUrl } from "@/lib/storage/public-url";
import { createClient } from "@/lib/supabase/server";
import { PilotReviewCard } from "@/components/reviews/PilotReviewCard";

export const revalidate = 300;

const PROFILE_BUCKET = "profile-photos";
const AIRCRAFT_BUCKET = "aircraft-photos";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("profiles_public")
    .select("first_name, last_name, role, status")
    .eq("id", id)
    .maybeSingle();

  if (!row || row.role !== "pilot" || row.status !== "verified") {
    return { title: "Pilot not found — Gallebo" };
  }

  const name =
    row.first_name && row.last_name
      ? `${row.first_name} ${row.last_name}`
      : "Pilot";

  return {
    title: `${name} — Gallebo`,
    description: `View ${name}'s pilot profile, aircraft, and passenger reviews on Gallebo.`,
    alternates: { canonical: `/pilots/${id}` },
    openGraph: {
      title: `${name} — Gallebo`,
      description: `Cost-sharing flights with ${name}`,
      url: `/pilots/${id}`,
    },
  };
}

export default async function PublicPilotProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pub } = await supabase
    .from("profiles_public")
    .select(
      "id, first_name, last_name, status, role, created_at, avatar_path",
    )
    .eq("id", id)
    .maybeSingle();

  if (!pub || pub.role !== "pilot" || pub.status !== "verified" || !pub.id) {
    notFound();
  }

  const { data: reviews } = await supabase
    .from("pilot_reviews_public")
    .select(
      "id, rating, comment, created_at, communication_rating, accuracy_rating, experience_rating",
    )
    .eq("pilot_user_id", pub.id)
    .order("created_at", { ascending: false });

  const ratings =
    reviews
      ?.map((r) => r.rating)
      .filter((r): r is number => typeof r === "number") ?? [];
  const avg = averageRating(ratings);

  const [{ data: rawAircraft }, { count: completedFlightCount }] = await Promise.all([
    supabase
      .from("aircraft")
      .select(
        `
      id,
      model,
      registration,
      seats,
      aircraft_photos ( id, storage_path, position )
    `,
      )
      .eq("pilot_user_id", pub.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("flights")
      .select("*", { count: "exact", head: true })
      .eq("pilot_user_id", pub.id)
      .eq("status", "completed"),
  ]);

  const aircraftRows = (rawAircraft ?? []) as AircraftWithPhotos[];
  const flightsOnGallebo = completedFlightCount ?? 0;

  // TODO: Apply pilot name masking (first name + last initial) for users without a confirmed booking.
  const displayName =
    pub.first_name && pub.last_name
      ? `${pub.first_name} ${pub.last_name}`
      : "Verified pilot";

  const avatarUrl =
    pub.avatar_path && pub.avatar_path.length > 0
      ? publicStorageUrl(PROFILE_BUCKET, pub.avatar_path)
      : null;

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6">
      <JsonLd
        data={pilotPageJsonLd({
          id: pub.id,
          name: displayName,
          avgRating: avg,
          reviewCount: ratings.length,
          avatarUrl,
        })}
      />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="128px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-xs text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
            <Badge variant="secondary">Verified pilot</Badge>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Member since {pub.created_at?.slice(0, 10) ?? "—"}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            {flightsOnGallebo > 0 ? (
              <span className="flex items-center gap-1">
                <Plane className="h-4 w-4" />
                Flights on Gallebo: <strong>{flightsOnGallebo}</strong>
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              {avg !== null ? (
                <>
                  <strong>{avg}</strong> / 5 ({ratings.length} reviews)
                </>
              ) : (
                <>No reviews yet</>
              )}
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aircraft</CardTitle>
        </CardHeader>
        <CardContent>
          {aircraftRows && aircraftRows.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2">
              {aircraftRows.map((ac) => {
                const pics = [...(ac.aircraft_photos ?? [])].sort(
                  (a, b) => (a.position ?? 0) - (b.position ?? 0),
                );
                const cover = pics[0];
                const url = cover
                  ? publicStorageUrl(AIRCRAFT_BUCKET, cover.storage_path)
                  : null;
                return (
                  <li key={ac.id} className="overflow-hidden rounded-lg border">
                    <div className="relative aspect-[16/10] bg-muted">
                      {url ? (
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width:640px) 100vw, 50vw"
                        />
                      ) : null}
                    </div>
                    <div className="space-y-1 p-4">
                      <p className="font-medium">{ac.model}</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {ac.registration}
                      </p>
                      <p className="text-xs text-muted-foreground">{ac.seats} seats</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No registered aircraft listed yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Passenger reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {reviews && reviews.length > 0 ? (
            reviews.map((r) => (
              <PilotReviewCard
                key={r.id ?? ""}
                review={{
                  id: r.id ?? "",
                  rating: r.rating ?? null,
                  communicationRating: r.communication_rating ?? null,
                  accuracyRating: r.accuracy_rating ?? null,
                  experienceRating: r.experience_rating ?? null,
                  comment: r.comment ?? null,
                  created_at: r.created_at ?? null,
                }}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          Back home
        </Link>
      </p>
    </div>
  );
}
