import type {
  FlightListEnrichment,
  FlightListItem,
  FlightRowFromDb,
} from "@/lib/flights/types";

export function isFlightRowFromDb(row: unknown): row is FlightRowFromDb {
  if (typeof row !== "object" || row === null) return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.pilot_user_id === "string" &&
    "departure_airfield" in r &&
    "arrival_airfield" in r
  );
}

export function flightRowsFromQuery(data: unknown[] | null | undefined): FlightRowFromDb[] {
  return (data ?? []).filter(isFlightRowFromDb);
}

export function toFlightListItem(
  row: FlightRowFromDb,
  enrichment: FlightListEnrichment,
): FlightListItem {
  return {
    ...row,
    pilot: enrichment.pilot,
    pending_bookings: enrichment.pending_bookings,
    pilot_avg_rating: enrichment.pilot_avg_rating,
    pilot_review_count: enrichment.pilot_review_count,
  };
}
