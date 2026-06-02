import { unstable_cache } from "next/cache";

import { searchPublishedFlights } from "@/lib/flights/search";
import type { FlightListItem, FlightSearchParams } from "@/lib/flights/types";
import { createAnonClient } from "@/lib/supabase/anon-server";

const DEFAULT_FEATURED_PARAMS: FlightSearchParams = { sort: "date" };

async function fetchFeaturedFlights(): Promise<FlightListItem[]> {
  return searchPublishedFlights(DEFAULT_FEATURED_PARAMS, {
    db: createAnonClient(),
  });
}

/** Cached published flight list for marketing/home surfaces (60s). */
export const getFeaturedFlightsCached = unstable_cache(
  fetchFeaturedFlights,
  ["featured-published-flights"],
  { revalidate: 60, tags: ["flights"] },
);

/** Cached airfield flight board (120s). */
export function getFlightsForAirfieldCached(airfieldId: string) {
  return unstable_cache(
    async () => {
      const { getFlightsForAirfield } = await import("@/lib/flights/search");
      return getFlightsForAirfield(airfieldId, { db: createAnonClient() });
    },
    ["airfield-flights", airfieldId],
    { revalidate: 120, tags: ["flights", `airfield:${airfieldId}`] },
  )();
}
