import { createClient } from "@/lib/supabase/server";

export async function getSitemapFlightIds(): Promise<string[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("flights")
    .select("id")
    .eq("status", "published")
    .gte("flight_date", today)
    .order("updated_at", { ascending: false })
    .limit(5000);

  return (data ?? []).map((row) => row.id);
}

export async function getSitemapPilotIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles_public")
    .select("id")
    .eq("role", "pilot")
    .eq("status", "verified")
    .limit(5000);

  return (data ?? []).map((row) => row.id).filter(Boolean) as string[];
}

export async function getSitemapAirfieldIcaos(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("airfields")
    .select("icao_code")
    .eq("status", "active")
    .limit(5000);

  return (data ?? [])
    .map((row) => row.icao_code)
    .filter((icao): icao is string => Boolean(icao));
}
