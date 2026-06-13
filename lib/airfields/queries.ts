import { unstable_cache } from "next/cache";

import { createAnonClient } from "@/lib/supabase/anon-server";

export type AirfieldSummary = {
  id: string;
  icao_code: string;
  name: string;
  city: string | null;
  country: string;
  latitude: number;
  longitude: number;
  has_fuel: boolean;
  has_hangar: boolean;
  has_rental: boolean;
};

async function fetchAllAirfields(): Promise<AirfieldSummary[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("airfields")
    .select(
      "id, icao_code, name, city, country, latitude, longitude, has_fuel, has_hangar, has_rental",
    )
    .eq("status", "active")
    .order("name");

  if (error || !data) {
    return [];
  }

  return data;
}

/** Cached airfield directory for listing/map (1h). */
export const getAllAirfields = unstable_cache(
  fetchAllAirfields,
  ["all-airfields-listing"],
  { revalidate: 3600, tags: ["airfields"] },
);
