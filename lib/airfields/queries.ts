import { unstable_cache } from "next/cache";

import { createAnonClient } from "@/lib/supabase/anon-server";

export type AirfieldSummary = {
  icao_code: string;
  name: string;
  city: string | null;
  country: string;
  latitude: number;
  longitude: number;
};

async function fetchAllAirfields(): Promise<AirfieldSummary[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("airfields")
    .select("icao_code, name, city, country, latitude, longitude")
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
