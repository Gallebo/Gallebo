import { createAdminClient } from "@/lib/supabase/admin";

export type FunnelMetrics = {
  registrations: number;
  verifiedUsers: number;
  bookingRequests: number;
  completedFlights: number;
  conversionToVerified: number;
  conversionToBooking: number;
  conversionToCompleted: number;
};

export type PopularRoute = {
  route: string;
  count: number;
};

export type PopularAirfield = {
  icao: string;
  name: string;
  flightCount: number;
};

export async function getFunnelMetrics(): Promise<FunnelMetrics> {
  const admin = createAdminClient();

  const [
    { count: registrations },
    { count: verifiedUsers },
    { count: bookingRequests },
    { count: completedFlights },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "verified"),
    admin.from("flight_booking_requests").select("id", { count: "exact", head: true }),
    admin
      .from("flights")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
  ]);

  const reg = registrations ?? 0;
  const verified = verifiedUsers ?? 0;
  const bookings = bookingRequests ?? 0;
  const completed = completedFlights ?? 0;

  return {
    registrations: reg,
    verifiedUsers: verified,
    bookingRequests: bookings,
    completedFlights: completed,
    conversionToVerified: reg > 0 ? Math.round((verified / reg) * 100) : 0,
    conversionToBooking: verified > 0 ? Math.round((bookings / verified) * 100) : 0,
    conversionToCompleted: bookings > 0 ? Math.round((completed / bookings) * 100) : 0,
  };
}

export async function getPopularRoutes(limit = 10): Promise<PopularRoute[]> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("flights")
    .select(
      `
      id,
      departure_airfield:airfields!flights_departure_airfield_id_fkey ( icao_code ),
      arrival_airfield:airfields!flights_arrival_airfield_id_fkey ( icao_code )
    `,
    )
    .in("status", ["published", "completed"])
    .limit(2000);

  const counts = new Map<string, number>();

  for (const row of data ?? []) {
    const dep = row.departure_airfield as { icao_code: string } | null;
    const arr = row.arrival_airfield as { icao_code: string } | null;
    if (!dep?.icao_code || !arr?.icao_code) continue;
    const route = `${dep.icao_code} → ${arr.icao_code}`;
    counts.set(route, (counts.get(route) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getPopularAirfields(limit = 10): Promise<PopularAirfield[]> {
  const admin = createAdminClient();

  const { data: flights } = await admin
    .from("flights")
    .select("departure_airfield_id, arrival_airfield_id")
    .in("status", ["published", "completed"])
    .limit(2000);

  const airfieldCounts = new Map<string, number>();
  for (const f of flights ?? []) {
    if (f.departure_airfield_id) {
      airfieldCounts.set(
        f.departure_airfield_id,
        (airfieldCounts.get(f.departure_airfield_id) ?? 0) + 1,
      );
    }
    if (f.arrival_airfield_id) {
      airfieldCounts.set(
        f.arrival_airfield_id,
        (airfieldCounts.get(f.arrival_airfield_id) ?? 0) + 1,
      );
    }
  }

  const topIds = [...airfieldCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topIds.length === 0) return [];

  const { data: airfields } = await admin
    .from("airfields")
    .select("id, name, icao_code")
    .in("id", topIds);

  return (airfields ?? [])
    .map((a) => ({
      icao: a.icao_code,
      name: a.name,
      flightCount: airfieldCounts.get(a.id) ?? 0,
    }))
    .sort((a, b) => b.flightCount - a.flightCount);
}
