import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Star, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  availableSeats,
  flightPhotoUrl,
  formatFlightRoute,
  pilotDisplayName,
} from "@/lib/flights/utils";
import type { FlightListItem } from "@/lib/flights/types";
import { publicStorageUrl } from "@/lib/storage/public-url";

export function FlightListCard({ flight }: { flight: FlightListItem }) {
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
    <article className="overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/flights/${flight.id}`} className="relative block aspect-[16/10] bg-muted">
        {cover ? (
          <Image
            src={flightPhotoUrl(cover.storage_path)}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width:640px) 100vw, 400px"
            unoptimized
          />
        ) : null}
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/flights/${flight.id}`}
              className="font-semibold hover:underline"
            >
              {formatFlightRoute(flight)}
            </Link>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              {flight.flight_date} · {String(flight.departure_time).slice(0, 5)}
            </p>
          </div>
          <p className="text-lg font-semibold text-primary">
            €{Number(flight.price_per_passenger_eur).toFixed(0)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {seats} seat{seats === 1 ? "" : "s"} left
          </span>
          {flight.pilot_avg_rating !== null && flight.pilot_avg_rating !== undefined ? (
            <span className="flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {flight.pilot_avg_rating} ({flight.pilot_review_count ?? 0})
            </span>
          ) : null}
          {flight.route_avg_price_eur !== null ? (
            <Badge variant="secondary">
              Avg route €{Number(flight.route_avg_price_eur).toFixed(0)}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t pt-3">
          {avatarUrl ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">
              P
            </div>
          )}
          <Link
            href={`/pilots/${flight.pilot_user_id}`}
            className="text-sm font-medium hover:underline"
          >
            {pilotName}
          </Link>
          <MapPin className="ml-auto size-3.5 text-muted-foreground" />
        </div>
      </div>
    </article>
  );
}
