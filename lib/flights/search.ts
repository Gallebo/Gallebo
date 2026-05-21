import { getPublicEnv, isMapTilerConfigured } from "@/lib/env";
import type { FlightSearchParams, FlightListItem } from "@/lib/flights/types";
import { createClient } from "@/lib/supabase/server";

const FLIGHT_SELECT = `
  *,
  departure_airfield:airfields!flights_departure_airfield_id_fkey (
    id, name, icao_code, latitude, longitude, country
  ),
  arrival_airfield:airfields!flights_arrival_airfield_id_fkey (
    id, name, icao_code, latitude, longitude, country
  ),
  flight_photos ( id, storage_path, position )
`;

async function resolveAirfieldIdsFromLocation(
  query: string,
): Promise<string[]> {
  const supabase = await createClient();
  const q = query.trim();
  if (!q) return [];

  const { data: direct } = await supabase
    .from("airfields")
    .select("id")
    .eq("status", "active")
    .or(`name.ilike.%${q}%,icao_code.ilike.%${q}%,country.ilike.%${q}%`)
    .limit(20);

  const ids = new Set((direct ?? []).map((a) => a.id));

  if (isMapTilerConfigured()) {
    const key = getPublicEnv().NEXT_PUBLIC_MAPTILER_API_KEY!;
    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${key}&limit=5`,
      );
      if (res.ok) {
        const json = (await res.json()) as {
          features?: { center?: [number, number] }[];
        };
        const feature = json.features?.[0];
        if (feature?.center) {
          const [lng, lat] = feature.center;
          const { data: nearby } = await supabase
            .from("airfields")
            .select("id, latitude, longitude")
            .eq("status", "active");
          for (const af of nearby ?? []) {
            const dLat = Math.abs(af.latitude - lat);
            const dLng = Math.abs(af.longitude - lng);
            if (dLat < 1.5 && dLng < 1.5) {
              ids.add(af.id);
            }
          }
        }
      }
    } catch {
      // geocoding optional
    }
  }

  return [...ids];
}

export async function searchPublishedFlights(
  params: FlightSearchParams,
): Promise<FlightListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("flights")
    .select(FLIGHT_SELECT)
    .eq("status", "published")
    .gte("flight_date", new Date().toISOString().slice(0, 10));

  if (params.departureAirfieldId) {
    query = query.eq("departure_airfield_id", params.departureAirfieldId);
  }
  if (params.arrivalAirfieldId) {
    query = query.eq("arrival_airfield_id", params.arrivalAirfieldId);
  }
  if (params.dateFrom) {
    query = query.gte("flight_date", params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte("flight_date", params.dateTo);
  }
  if (params.flightType) {
    query = query.eq("flight_type", params.flightType);
  }
  if (params.maxPrice !== undefined && !Number.isNaN(params.maxPrice)) {
    query = query.lte("price_per_passenger_eur", params.maxPrice);
  }

  if (params.locationQuery && !params.departureAirfieldId && !params.arrivalAirfieldId) {
    const ids = await resolveAirfieldIdsFromLocation(params.locationQuery);
    if (ids.length === 0) {
      return [];
    }
    query = query.or(
      `departure_airfield_id.in.(${ids.join(",")}),arrival_airfield_id.in.(${ids.join(",")})`,
    );
  }

  const sort = params.sort ?? "date";
  if (sort === "price") {
    query = query.order("price_per_passenger_eur", { ascending: true });
  } else if (sort === "date") {
    query = query.order("flight_date", { ascending: true });
  } else {
    query = query.order("flight_date", { ascending: true });
  }

  const { data, error } = await query.limit(100);

  if (error || !data) {
    return [];
  }

  const flightIds = data.map((f) => f.id);
  const pilotIds = [...new Set(data.map((f) => f.pilot_user_id))];

  const { data: bookings } = await supabase
    .from("flight_booking_requests")
    .select("flight_id")
    .in("flight_id", flightIds.length > 0 ? flightIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "pending");

  const pendingByFlight = new Map<string, number>();
  for (const b of bookings ?? []) {
    pendingByFlight.set(b.flight_id, (pendingByFlight.get(b.flight_id) ?? 0) + 1);
  }

  const { data: reviews } = await supabase
    .from("pilot_reviews_public")
    .select("pilot_user_id, rating")
    .in(
      "pilot_user_id",
      pilotIds.length > 0 ? pilotIds : ["00000000-0000-0000-0000-000000000000"],
    );

  const ratingByPilot = new Map<string, { sum: number; count: number }>();
  for (const r of reviews ?? []) {
    if (!r.pilot_user_id || r.rating === null) continue;
    const cur = ratingByPilot.get(r.pilot_user_id) ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    ratingByPilot.set(r.pilot_user_id, cur);
  }

  const { data: pilotRows } = await supabase
    .from("profiles_public")
    .select("id, first_name, last_name, avatar_path")
    .in(
      "id",
      pilotIds.length > 0 ? pilotIds : ["00000000-0000-0000-0000-000000000000"],
    );

  const pilotById = new Map(
    (pilotRows ?? []).map((p) => [
      p.id!,
      {
        id: p.id!,
        first_name: p.first_name,
        last_name: p.last_name,
        avatar_path: p.avatar_path,
      },
    ]),
  );

  let items: FlightListItem[] = data.map((row) => {
    const pending = pendingByFlight.get(row.id) ?? 0;
    const rating = ratingByPilot.get(row.pilot_user_id);
    return {
      ...(row as FlightListItem),
      pilot: pilotById.get(row.pilot_user_id) ?? null,
      pending_bookings: pending,
      pilot_avg_rating: rating
        ? Math.round((rating.sum / rating.count) * 10) / 10
        : null,
      pilot_review_count: rating?.count ?? 0,
    };
  });

  if (params.minSeats !== undefined && params.minSeats > 0) {
    items = items.filter((f) => {
      const available = f.passenger_seats - (f.pending_bookings ?? 0);
      return available >= params.minSeats!;
    });
  }

  if (sort === "rating") {
    items.sort((a, b) => (b.pilot_avg_rating ?? 0) - (a.pilot_avg_rating ?? 0));
  }

  return items;
}

export async function getFlightById(id: string): Promise<FlightListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("flights")
    .select(FLIGHT_SELECT)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;

  const { count } = await supabase
    .from("flight_booking_requests")
    .select("id", { count: "exact", head: true })
    .eq("flight_id", id)
    .eq("status", "pending");

  const { data: reviews } = await supabase
    .from("pilot_reviews_public")
    .select("rating")
    .eq("pilot_user_id", data.pilot_user_id);

  const ratings = (reviews ?? [])
    .map((r) => r.rating)
    .filter((r): r is number => typeof r === "number");

  const avg =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

  const { data: pilotRow } = await supabase
    .from("profiles_public")
    .select("id, first_name, last_name, avatar_path")
    .eq("id", data.pilot_user_id)
    .maybeSingle();

  return {
    ...(data as FlightListItem),
    pilot: pilotRow?.id
      ? {
          id: pilotRow.id,
          first_name: pilotRow.first_name,
          last_name: pilotRow.last_name,
          avatar_path: pilotRow.avatar_path,
        }
      : null,
    pending_bookings: count ?? 0,
    pilot_avg_rating: avg,
    pilot_review_count: ratings.length,
  };
}

export async function getFlightsForAirfield(airfieldId: string): Promise<{
  departing: FlightListItem[];
  arriving: FlightListItem[];
}> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: departing } = await supabase
    .from("flights")
    .select(FLIGHT_SELECT)
    .eq("status", "published")
    .eq("departure_airfield_id", airfieldId)
    .gte("flight_date", today)
    .order("flight_date", { ascending: true })
    .limit(20);

  const { data: arriving } = await supabase
    .from("flights")
    .select(FLIGHT_SELECT)
    .eq("status", "published")
    .eq("arrival_airfield_id", airfieldId)
    .gte("flight_date", today)
    .order("flight_date", { ascending: true })
    .limit(20);

  const enrich = async (rows: typeof departing) => {
    if (!rows?.length) return [] as FlightListItem[];
    const pilotIds = [...new Set(rows.map((r) => r.pilot_user_id))];
    const { data: pilotRows } = await supabase
      .from("profiles_public")
      .select("id, first_name, last_name, avatar_path")
      .in("id", pilotIds);

    const pilotById = new Map(
      (pilotRows ?? []).map((p) => [
        p.id!,
        {
          id: p.id!,
          first_name: p.first_name,
          last_name: p.last_name,
          avatar_path: p.avatar_path,
        },
      ]),
    );

    return rows.map((row) => ({
      ...(row as FlightListItem),
      pilot: pilotById.get(row.pilot_user_id) ?? null,
      pending_bookings: 0,
    }));
  };

  return {
    departing: await enrich(departing),
    arriving: await enrich(arriving),
  };
}
