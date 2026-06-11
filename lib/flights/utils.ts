import {
  FLIGHT_PHOTOS_BUCKET,
  FLIGHT_TYPE_LABELS,
} from "@/lib/flights/constants";
import { publicStorageUrl } from "@/lib/storage/public-url";
import type { UserRole } from "@/lib/types/profile";
import type { FlightListItem } from "@/lib/flights/types";

export type PilotNameVisibilityContext = {
  viewerUserId: string | null;
  viewerRole: UserRole | null;
  flightPilotUserId: string;
  hasConfirmedBooking: boolean;
};

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

export function formatMaskedPilotName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const first = firstName?.trim();
  const last = lastName?.trim();
  if (first && last) {
    return `${first} ${last.charAt(0).toUpperCase()}.`;
  }
  if (first) return first;
  return "Verified pilot";
}

export function shouldRevealPilotName(ctx: PilotNameVisibilityContext): boolean {
  if (!ctx.viewerUserId) return false;
  if (ctx.viewerRole === "admin") return true;
  if (ctx.viewerUserId === ctx.flightPilotUserId) return true;
  return ctx.hasConfirmedBooking;
}

export function pilotDisplayName(
  pilot: FlightListItem["pilot"],
  options?: { revealFull?: boolean },
): string {
  if (!pilot) return "Pilot";
  const revealFull = options?.revealFull ?? true;
  if (pilot.first_name && pilot.last_name) {
    return revealFull
      ? `${pilot.first_name} ${pilot.last_name}`
      : formatMaskedPilotName(pilot.first_name, pilot.last_name);
  }
  if (pilot.first_name) return pilot.first_name;
  return "Verified pilot";
}
