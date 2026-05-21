import { getPublicEnv, isMapTilerConfigured } from "@/lib/env";
import {
  flightRowsFromQuery,
  isFlightRowFromDb,
  toFlightListItem,
} from "@/lib/flights/list-item";
import type {
  FlightListItem,
  FlightPilotSummary,
  FlightSearchParams,
} from "@/lib/flights/types";
import { createClient } from "@/lib/supabase/server";

type SeatAvailabilityRow = {
  passenger_seats: number;
  available_seats: number;
};

function pendingBookingsFromSeatRow(row: SeatAvailabilityRow): number {
  return Math.max(0, row.passenger_seats - row.available_seats);
}

function pendingByFlightFromSeatRows(
  rows: Array<{ id: string } & SeatAvailabilityRow>,
): Map<string, number> {
  return new Map(rows.map((r) => [r.id, pendingBookingsFromSeatRow(r)]));
}

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
  const q = query.trim().replace(/[,()]/g, "");
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
            .select("id")
            .eq("status", "active")
            .gte("latitude", lat - 1.5)
            .lte("latitude", lat + 1.5)
            .gte("longitude", lng - 1.5)
            .lte("longitude", lng + 1.5)
            .limit(50);
          for (const af of nearby ?? []) {
            ids.add(af.id);
          }
        }
      }
    } catch {
      // geocoding optional
    }
  }

  return [...ids];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPublishedFlightFilters(query: any, params: FlightSearchParams, today: string) {
  let q = query.eq("status", "published").gte("flight_date", today);

  if (params.departureAirfieldId) {
    q = q.eq("departure_airfield_id", params.departureAirfieldId);
  }
  if (params.arrivalAirfieldId) {
    q = q.eq("arrival_airfield_id", params.arrivalAirfieldId);
  }
  if (params.dateFrom) {
    q = q.gte("flight_date", params.dateFrom);
  }
  if (params.dateTo) {
    q = q.lte("flight_date", params.dateTo);
  }
  if (params.flightType) {
    q = q.eq("flight_type", params.flightType);
  }
  if (params.maxPrice !== undefined && !Number.isNaN(params.maxPrice)) {
    q = q.lte("price_per_passenger_eur", params.maxPrice);
  }

  return q;
}

export async function searchPublishedFlights(
  params: FlightSearchParams,
): Promise<FlightListItem[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const useMinSeatsFilter =
    params.minSeats !== undefined && params.minSeats > 0;

  const locationAirfieldIds =
    params.locationQuery && !params.departureAirfieldId && !params.arrivalAirfieldId
      ? await resolveAirfieldIdsFromLocation(params.locationQuery)
      : null;

  if (locationAirfieldIds && locationAirfieldIds.length === 0) {
    return [];
  }

  let minSeatsFlightIds: string[] | null = null;
  let minSeatsSeatRows: Array<{ id: string } & SeatAvailabilityRow> | null = null;

  if (useMinSeatsFilter) {
    let seatQuery = applyPublishedFlightFilters(
      supabase
        .from("flights_with_available_seats")
        .select("id, passenger_seats, available_seats"),
      params,
      today,
    ).gte("available_seats", params.minSeats!);

    if (locationAirfieldIds) {
      seatQuery = seatQuery.or(
        `departure_airfield_id.in.(${locationAirfieldIds.join(",")}),arrival_airfield_id.in.(${locationAirfieldIds.join(",")})`,
      );
    }

    const sort = params.sort ?? "date";
    if (sort === "price") {
      seatQuery = seatQuery.order("price_per_passenger_eur", { ascending: true });
    } else {
      seatQuery = seatQuery.order("flight_date", { ascending: true });
    }

    const { data: seatRows, error: seatError } = await seatQuery.limit(100);
    if (seatError || !seatRows?.length) {
      return [];
    }
    minSeatsSeatRows = seatRows as Array<{ id: string } & SeatAvailabilityRow>;
    minSeatsFlightIds = minSeatsSeatRows.map((r) => r.id);
  }

  let query = applyPublishedFlightFilters(
    supabase.from("flights").select(FLIGHT_SELECT),
    params,
    today,
  );

  if (minSeatsFlightIds) {
    query = query.in("id", minSeatsFlightIds);
  }

  if (locationAirfieldIds) {
    query = query.or(
      `departure_airfield_id.in.(${locationAirfieldIds.join(",")}),arrival_airfield_id.in.(${locationAirfieldIds.join(",")})`,
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

  const rows = flightRowsFromQuery(data);
  const resultFlightIds = rows.map((f) => f.id);
  const pilotIds = [...new Set(rows.map((f) => f.pilot_user_id))];

  let pendingByFlight: Map<string, number>;

  if (minSeatsSeatRows) {
    pendingByFlight = pendingByFlightFromSeatRows(minSeatsSeatRows);
  } else {
    const placeholderId = "00000000-0000-0000-0000-000000000000";
    const { data: seatRows } = await supabase
      .from("flights_with_available_seats")
      .select("id, passenger_seats, available_seats")
      .in("id", resultFlightIds.length > 0 ? resultFlightIds : [placeholderId]);

    pendingByFlight = pendingByFlightFromSeatRows(seatRows ?? []);
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

  const pilotById = new Map<string, FlightPilotSummary>(
    (pilotRows ?? [])
      .filter((p): p is typeof p & { id: string } => Boolean(p.id))
      .map((p) => [
        p.id,
        {
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          avatar_path: p.avatar_path,
        },
      ]),
  );

  let items: FlightListItem[] = rows.map((row) => {
    const pending = pendingByFlight.get(row.id) ?? 0;
    const rating = ratingByPilot.get(row.pilot_user_id);
    return toFlightListItem(row, {
      pilot: pilotById.get(row.pilot_user_id) ?? null,
      pending_bookings: pending,
      pilot_avg_rating: rating
        ? Math.round((rating.sum / rating.count) * 10) / 10
        : null,
      pilot_review_count: rating?.count ?? 0,
    });
  });

  if (sort === "rating") {
    items.sort((a, b) => (b.pilot_avg_rating ?? 0) - (a.pilot_avg_rating ?? 0));
  }

  return items;
}

export async function getFlightById(id: string): Promise<FlightListItem | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: raw, error } = await supabase
    .from("flights")
    .select(FLIGHT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !raw || !isFlightRowFromDb(raw)) return null;

  const isPilot = user?.id === raw.pilot_user_id;
  if (!isPilot && (raw.status !== "published" || raw.flight_date < today)) {
    return null;
  }

  const row = raw;

  const { data: seatRow } = await supabase
    .from("flights_with_available_seats")
    .select("passenger_seats, available_seats")
    .eq("id", id)
    .maybeSingle();

  const pending = seatRow ? pendingBookingsFromSeatRow(seatRow) : 0;

  const { data: reviews } = await supabase
    .from("pilot_reviews_public")
    .select("rating")
    .eq("pilot_user_id", row.pilot_user_id);

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
    .eq("id", row.pilot_user_id)
    .maybeSingle();

  const pilot: FlightPilotSummary | null = pilotRow?.id
    ? {
        id: pilotRow.id,
        first_name: pilotRow.first_name,
        last_name: pilotRow.last_name,
        avatar_path: pilotRow.avatar_path,
      }
    : null;

  return toFlightListItem(row, {
    pilot,
    pending_bookings: pending,
    pilot_avg_rating: avg,
    pilot_review_count: ratings.length,
  });
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

    const flightIds = rows.map((r) => r.id);
    const pilotIds = [...new Set(rows.map((r) => r.pilot_user_id))];

    const [{ data: pilotRows }, { data: seatRows }] = await Promise.all([
      supabase
        .from("profiles_public")
        .select("id, first_name, last_name, avatar_path")
        .in("id", pilotIds),
      supabase
        .from("flights_with_available_seats")
        .select("id, passenger_seats, available_seats")
        .in("id", flightIds),
    ]);

    const pilotById = new Map<string, FlightPilotSummary>(
      (pilotRows ?? [])
        .filter((p): p is typeof p & { id: string } => Boolean(p.id))
        .map((p) => [
          p.id,
          {
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            avatar_path: p.avatar_path,
          },
        ]),
    );

    const pendingByFlight = pendingByFlightFromSeatRows(seatRows ?? []);

    return flightRowsFromQuery(rows).map((row) =>
      toFlightListItem(row, {
        pilot: pilotById.get(row.pilot_user_id) ?? null,
        pending_bookings: pendingByFlight.get(row.id) ?? 0,
        pilot_avg_rating: null,
        pilot_review_count: 0,
      }),
    );
  };

  return {
    departing: await enrich(departing),
    arriving: await enrich(arriving),
  };
}
