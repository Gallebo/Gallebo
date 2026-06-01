import { createClient } from "@/lib/supabase/server";

export type FlightAlertRow = {
  id: string;
  departure_airfield_id: string | null;
  departure_country: string | null;
  arrival_airfield_id: string | null;
  arrival_country: string | null;
  date_from: string;
  date_to: string;
  flight_type: "panoramic" | "excursion" | "one_way" | null;
  is_active: boolean;
  expires_at: string;
  created_at: string;
};

export type FlightAlertWithLabels = FlightAlertRow & {
  departureLabel: string;
  arrivalLabel: string;
};

export async function getAlertCountries(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("airfields")
    .select("country")
    .eq("status", "active");

  if (error) {
    console.error("[getAlertCountries]", error.message);
    return [];
  }

  const countries = [...new Set((data ?? []).map((r) => r.country).filter(Boolean))];
  return countries.sort((a, b) => a.localeCompare(b));
}

export async function getMyActiveAlerts(
  passengerUserId: string,
): Promise<FlightAlertWithLabels[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("flight_alerts")
    .select(
      `
      id,
      departure_airfield_id,
      departure_country,
      arrival_airfield_id,
      arrival_country,
      date_from,
      date_to,
      flight_type,
      is_active,
      expires_at,
      created_at
    `,
    )
    .eq("passenger_user_id", passengerUserId)
    .eq("is_active", true)
    .order("expires_at", { ascending: true });

  if (error) {
    console.error("[getMyActiveAlerts]", error.message);
    return [];
  }

  const rows = (data ?? []) as FlightAlertRow[];
  const airfieldIds = [
    ...new Set(
      rows
        .flatMap((r) => [r.departure_airfield_id, r.arrival_airfield_id])
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const labelById = new Map<string, string>();
  if (airfieldIds.length > 0) {
    const { data: airfields } = await supabase
      .from("airfields")
      .select("id, name, icao_code")
      .in("id", airfieldIds);
    for (const a of airfields ?? []) {
      labelById.set(a.id, `${a.name} (${a.icao_code})`);
    }
  }

  return rows.map((row) => ({
    ...row,
    departureLabel: row.departure_airfield_id
      ? (labelById.get(row.departure_airfield_id) ?? "Airfield")
      : (row.departure_country ?? "Region"),
    arrivalLabel: row.arrival_airfield_id
      ? (labelById.get(row.arrival_airfield_id) ?? "Airfield")
      : (row.arrival_country ?? "Region"),
  }));
}
