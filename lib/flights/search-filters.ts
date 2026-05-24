import type { FlightType } from "@/lib/flights/types";

/** Map scenic/transfer toggles to flight_type filter for server search. */
export function flightTypesFromSearchParams(
  scenic: boolean,
  transfer: boolean,
): FlightType[] | undefined {
  if (scenic && transfer) return undefined;
  if (!scenic && !transfer) return [];
  if (scenic) return ["panoramic", "excursion"];
  return ["one_way"];
}

export function filterFlightsClient<
  T extends { flight_type: FlightType; pilot_avg_rating: number | null },
>(
  flights: T[],
  opts: {
    minRating?: number;
    scenic: boolean;
    transfer: boolean;
  },
): T[] {
  const types = flightTypesFromSearchParams(opts.scenic, opts.transfer);
  let result = flights;

  if (types !== undefined) {
    if (types.length === 0) return [];
    result = result.filter((f) => types.includes(f.flight_type));
  }

  if (opts.minRating !== undefined && opts.minRating > 0) {
    result = result.filter((f) => (f.pilot_avg_rating ?? 0) >= opts.minRating!);
  }

  return result;
}

export function parseBoolSearchParam(
  v: string | undefined,
  defaultValue: boolean,
): boolean {
  if (v === undefined) return defaultValue;
  return v === "1" || v === "true";
}
