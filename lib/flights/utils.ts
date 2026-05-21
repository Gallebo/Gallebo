import {
  FLIGHT_PHOTOS_BUCKET,
  FLIGHT_TYPE_LABELS,
} from "@/lib/flights/constants";
import { publicStorageUrl } from "@/lib/storage/public-url";
import type { FlightListItem } from "@/lib/flights/types";

export function flightPhotoUrl(path: string): string {
  return publicStorageUrl(FLIGHT_PHOTOS_BUCKET, path);
}

export function formatFlightRoute(flight: FlightListItem): string {
  const dep = flight.departure_airfield;
  const arr = flight.arrival_airfield;
  if (!dep || !arr) return "Route TBD";
  if (flight.flight_type === "panoramic") {
    return `${dep.icao_code} — ${FLIGHT_TYPE_LABELS.panoramic}`;
  }
  return `${dep.icao_code} → ${arr.icao_code}`;
}

export function availableSeats(flight: FlightListItem): number {
  return Math.max(0, flight.passenger_seats - (flight.pending_bookings ?? 0));
}

export function pilotDisplayName(
  pilot: FlightListItem["pilot"],
): string {
  if (!pilot) return "Pilot";
  if (pilot.first_name && pilot.last_name) {
    return `${pilot.first_name} ${pilot.last_name}`;
  }
  return "Verified pilot";
}
