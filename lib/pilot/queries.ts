import { averageRating } from "@/lib/pilot/review-stats";
import { airfieldCityName } from "@/lib/flights/route-meta";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/lib/bookings/constants";
import type { Enums } from "@/types/database";

export type PilotSidebarContext = {
  firstName: string;
  lastName: string;
  initials: string;
  licenseLabel: string;
  status: Enums<"user_status">;
  kycVerified: boolean;
  pendingRequests: number;
  stripeOnboardingComplete: boolean;
};

export type PilotFlightRow = {
  id: string;
  flight_date: string;
  departure_time: string;
  status: string;
  cancellation_locked_at: string | null;
  passenger_seats: number;
  booked_seats: number;
  confirmed_bookings: number;
  price_per_passenger_eur: number;
  departure_icao: string;
  arrival_icao: string;
  departure_name: string;
  arrival_name: string;
};

export type PilotManageableBookingRow = {
  id: string;
  status: BookingStatus;
  created_at: string;
  pilot_payout_eur: number | null;
  passenger: {
    first_name: string | null;
    last_name: string | null;
    weight_kg: number | null;
  } | null;
  flight: {
    id: string;
    flight_date: string;
    price_per_passenger_eur: number;
    status: string;
    departure_icao: string;
    arrival_icao: string;
  };
};

export type PilotBookingRequestRow = {
  id: string;
  status: BookingStatus;
  created_at: string;
  relative: string;
  passenger_first_name: string | null;
  passenger_last_name: string | null;
  passenger_user_id: string;
  flight_id: string;
  flight_date: string;
  departure_icao: string;
  arrival_icao: string;
  seats: number;
  amount_eur: number;
  passenger_avg_rating: number | null;
  passenger_review_count: number;
};

function aggregatePassengerReputation(
  rows: { passenger_user_id: string | null; rating: number | null }[],
): Map<string, { avgRating: number | null; reviewCount: number }> {
  const byPassenger = new Map<string, number[]>();

  for (const row of rows) {
    const passengerId = row.passenger_user_id;
    const rating = row.rating;
    if (!passengerId || typeof rating !== "number") continue;
    const list = byPassenger.get(passengerId) ?? [];
    list.push(rating);
    byPassenger.set(passengerId, list);
  }

  const result = new Map<string, { avgRating: number | null; reviewCount: number }>();
  for (const [passengerId, ratings] of byPassenger) {
    result.set(passengerId, {
      avgRating: averageRating(ratings),
      reviewCount: ratings.length,
    });
  }

  return result;
}

export type PilotDocumentRow = {
  id: string;
  title: string;
  subtext: string;
  status: "verified" | "expiring" | "pending" | "rejected";
};

function initials(first: string | null, last: string | null): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "P";
}

function formatExpiry(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export async function getPilotSidebarContext(
  userId: string,
): Promise<PilotSidebarContext> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, status")
    .eq("id", userId)
    .single();

  const { data: pilotProfile } = await supabase
    .from("pilot_profiles")
    .select("stripe_onboarding_complete")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: docs } = await supabase
    .from("documents")
    .select("type")
    .eq("user_id", userId)
    .in("type", ["ppl_license", "lapl_license"])
    .order("uploaded_at", { ascending: false })
    .limit(1);

  const licenseType = docs?.[0]?.type;
  const licenseLabel =
    licenseType === "lapl_license" ? "LAPL" : "PPL(A)";

  const { data: flights } = await supabase
    .from("flights")
    .select("id")
    .eq("pilot_user_id", userId);

  const flightIds = (flights ?? []).map((f) => f.id);
  let pendingRequests = 0;
  if (flightIds.length > 0) {
    const { count } = await supabase
      .from("flight_booking_requests")
      .select("id", { count: "exact", head: true })
      .in("flight_id", flightIds)
      .eq("status", "pending");
    pendingRequests = count ?? 0;
  }

  return {
    firstName: profile?.first_name ?? "Pilot",
    lastName: profile?.last_name ?? "",
    initials: initials(profile?.first_name ?? null, profile?.last_name ?? null),
    licenseLabel,
    status: profile?.status ?? "registered",
    kycVerified: profile?.status === "verified",
    pendingRequests,
    stripeOnboardingComplete: Boolean(pilotProfile?.stripe_onboarding_complete),
  };
}

async function fetchPilotFlights(userId: string): Promise<PilotFlightRow[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: flights } = await supabase
    .from("flights")
    .select(
      `
      id, flight_date, departure_time, status, cancellation_locked_at, passenger_seats, price_per_passenger_eur,
      departure_airfield:airfields!flights_departure_airfield_id_fkey ( icao_code, name ),
      arrival_airfield:airfields!flights_arrival_airfield_id_fkey ( icao_code, name )
    `,
    )
    .eq("pilot_user_id", userId)
    .gte("flight_date", today)
    .in("status", ["published", "draft"])
    .order("flight_date", { ascending: true });

  const flightIds = (flights ?? []).map((f) => f.id);
  const bookingCounts = await bookingCountsByFlight(supabase, flightIds);

  return (flights ?? []).map((f) => {
    const dep = f.departure_airfield as { icao_code: string; name: string } | null;
    const arr = f.arrival_airfield as { icao_code: string; name: string } | null;
    const counts = bookingCounts.get(f.id) ?? { booked: 0, confirmed: 0 };
    return {
      id: f.id,
      flight_date: f.flight_date,
      departure_time: String(f.departure_time).slice(0, 5),
      status: f.status,
      cancellation_locked_at: f.cancellation_locked_at,
      passenger_seats: f.passenger_seats,
      booked_seats: counts.booked,
      confirmed_bookings: counts.confirmed,
      price_per_passenger_eur: Number(f.price_per_passenger_eur),
      departure_icao: dep?.icao_code ?? "—",
      arrival_icao: arr?.icao_code ?? "—",
      departure_name: dep ? airfieldCityName(dep.name) : "—",
      arrival_name: arr ? airfieldCityName(arr.name) : "—",
    };
  });
}

async function bookingCountsByFlight(
  supabase: Awaited<ReturnType<typeof createClient>>,
  flightIds: string[],
): Promise<Map<string, { booked: number; confirmed: number }>> {
  const out = new Map<string, { booked: number; confirmed: number }>();
  if (!flightIds.length) return out;

  const { data: bookings } = await supabase
    .from("flight_booking_requests")
    .select("flight_id, status")
    .in("flight_id", flightIds)
    .in("status", ["pending", "accepted", "confirmed", "completed"]);

  for (const b of bookings ?? []) {
    const current = out.get(b.flight_id) ?? { booked: 0, confirmed: 0 };
    current.booked += 1;
    if (b.status === "confirmed" || b.status === "completed") {
      current.confirmed += 1;
    }
    out.set(b.flight_id, current);
  }

  return out;
}

export async function getPilotFlightsLog(
  userId: string,
  tab: "upcoming" | "past" | "cancelled",
): Promise<PilotFlightRow[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("flights")
    .select(
      `
      id, flight_date, departure_time, status, cancellation_locked_at, passenger_seats, price_per_passenger_eur,
      departure_airfield:airfields!flights_departure_airfield_id_fkey ( icao_code, name ),
      arrival_airfield:airfields!flights_arrival_airfield_id_fkey ( icao_code, name )
    `,
    )
    .eq("pilot_user_id", userId);

  if (tab === "upcoming") {
    query = query
      .gte("flight_date", today)
      .neq("status", "cancelled")
      .order("flight_date", { ascending: true });
  } else if (tab === "past") {
    query = query
      .lt("flight_date", today)
      .neq("status", "cancelled")
      .order("flight_date", { ascending: false });
  } else {
    query = query.eq("status", "cancelled").order("flight_date", { ascending: false });
  }

  const { data: flights } = await query;
  const flightIds = (flights ?? []).map((f) => f.id);
  const bookingCounts = await bookingCountsByFlight(supabase, flightIds);

  return (flights ?? []).map((f) => {
    const dep = f.departure_airfield as { icao_code: string; name: string } | null;
    const arr = f.arrival_airfield as { icao_code: string; name: string } | null;
    const counts = bookingCounts.get(f.id) ?? { booked: 0, confirmed: 0 };
    return {
      id: f.id,
      flight_date: f.flight_date,
      departure_time: String(f.departure_time).slice(0, 5),
      status: f.status,
      cancellation_locked_at: f.cancellation_locked_at,
      passenger_seats: f.passenger_seats,
      booked_seats: counts.booked,
      confirmed_bookings: counts.confirmed,
      price_per_passenger_eur: Number(f.price_per_passenger_eur),
      departure_icao: dep?.icao_code ?? "—",
      arrival_icao: arr?.icao_code ?? "—",
      departure_name: dep ? airfieldCityName(dep.name) : "—",
      arrival_name: arr ? airfieldCityName(arr.name) : "—",
    };
  });
}

export async function getPilotBookingRequests(
  userId: string,
): Promise<PilotBookingRequestRow[]> {
  const supabase = await createClient();

  const { data: flights } = await supabase
    .from("flights")
    .select(
      `
      id, flight_date,
      departure_airfield:airfields!flights_departure_airfield_id_fkey ( icao_code ),
      arrival_airfield:airfields!flights_arrival_airfield_id_fkey ( icao_code )
    `,
    )
    .eq("pilot_user_id", userId);

  const flightMap = new Map(
    (flights ?? []).map((f) => [
      f.id,
      {
        flight_date: f.flight_date,
        dep: (f.departure_airfield as { icao_code: string } | null)?.icao_code ?? "—",
        arr: (f.arrival_airfield as { icao_code: string } | null)?.icao_code ?? "—",
      },
    ]),
  );

  const flightIds = [...flightMap.keys()];
  if (!flightIds.length) return [];

  const { data: bookings } = await supabase
    .from("flight_booking_requests")
    .select(
      "id, status, created_at, passenger_user_id, flight_id, passenger_amount_eur",
    )
    .in("flight_id", flightIds)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!bookings?.length) return [];

  const passengerIds = [...new Set(bookings.map((b) => b.passenger_user_id))];
  const { data: passengers } = await supabase
    .from("profiles_public")
    .select("id, first_name, last_name")
    .in("id", passengerIds);

  const passengerMap = new Map((passengers ?? []).map((p) => [p.id, p]));

  const reputationByPassenger = new Map<
    string,
    { avgRating: number | null; reviewCount: number }
  >();

  if (passengerIds.length > 0) {
    const { data: reputationRows } = await supabase
      .from("passenger_reviews_public")
      .select("passenger_user_id, rating")
      .in("passenger_user_id", passengerIds);

    const aggregated = aggregatePassengerReputation(reputationRows ?? []);
    for (const [id, stats] of aggregated) {
      reputationByPassenger.set(id, stats);
    }
  }

  return bookings.map((b) => {
    const flight = flightMap.get(b.flight_id);
    const p = passengerMap.get(b.passenger_user_id);
    const reputation = reputationByPassenger.get(b.passenger_user_id) ?? {
      avgRating: null,
      reviewCount: 0,
    };

    return {
      id: b.id,
      status: b.status as BookingStatus,
      created_at: b.created_at,
      relative: relativeTime(b.created_at),
      passenger_first_name: p?.first_name ?? null,
      passenger_last_name: p?.last_name ?? null,
      passenger_user_id: b.passenger_user_id,
      flight_id: b.flight_id,
      flight_date: flight?.flight_date ?? "",
      departure_icao: flight?.dep ?? "—",
      arrival_icao: flight?.arr ?? "—",
      seats: 1,
      amount_eur: Number(b.passenger_amount_eur ?? 0),
      passenger_avg_rating: reputation.avgRating,
      passenger_review_count: reputation.reviewCount,
    };
  });
}

export async function getPilotManageableBookings(
  userId: string,
): Promise<PilotManageableBookingRow[]> {
  const supabase = await createClient();

  const { data: flights } = await supabase
    .from("flights")
    .select(
      `
      id, flight_date, status, price_per_passenger_eur,
      departure_airfield:airfields!flights_departure_airfield_id_fkey ( icao_code ),
      arrival_airfield:airfields!flights_arrival_airfield_id_fkey ( icao_code )
    `,
    )
    .eq("pilot_user_id", userId);

  const flightMap = new Map(
    (flights ?? []).map((f) => [
      f.id,
      {
        flight_date: f.flight_date,
        status: f.status,
        price_per_passenger_eur: Number(f.price_per_passenger_eur),
        dep: (f.departure_airfield as { icao_code: string } | null)?.icao_code ?? "—",
        arr: (f.arrival_airfield as { icao_code: string } | null)?.icao_code ?? "—",
      },
    ]),
  );

  const flightIds = [...flightMap.keys()];
  if (!flightIds.length) return [];

  const { data: bookings } = await supabase
    .from("flight_booking_requests")
    .select(
      "id, status, created_at, passenger_user_id, flight_id, pilot_payout_eur",
    )
    .in("flight_id", flightIds)
    .in("status", ["accepted", "confirmed", "completed"])
    .order("created_at", { ascending: false });

  if (!bookings?.length) return [];

  const passengerIds = [...new Set(bookings.map((b) => b.passenger_user_id))];
  const { data: passengers } = await supabase
    .from("profiles_public")
    .select("id, first_name, last_name")
    .in("id", passengerIds);

  const passengerMap = new Map((passengers ?? []).map((p) => [p.id, p]));

  return bookings.map((b) => {
    const flight = flightMap.get(b.flight_id);
    const p = passengerMap.get(b.passenger_user_id);

    return {
      id: b.id,
      status: b.status as BookingStatus,
      created_at: b.created_at,
      pilot_payout_eur: b.pilot_payout_eur,
      passenger: p
        ? {
            first_name: p.first_name,
            last_name: p.last_name,
            weight_kg: null,
          }
        : null,
      flight: {
        id: b.flight_id,
        flight_date: flight?.flight_date ?? "",
        price_per_passenger_eur: flight?.price_per_passenger_eur ?? 0,
        status: flight?.status ?? "published",
        departure_icao: flight?.dep ?? "—",
        arrival_icao: flight?.arr ?? "—",
      },
    };
  });
}

export type TopWaitingAlertRoute = {
  departureLabel: string;
  arrivalLabel: string;
  waitingCount: number;
};

export async function getTopWaitingAlertRoutes(
  limit = 5,
): Promise<TopWaitingAlertRoute[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase.rpc("top_waiting_alert_routes", {
    p_limit: limit,
  });

  if (error) {
    console.error("[getTopWaitingAlertRoutes]", error.message);
    return [];
  }

  const routeRows = rows ?? [];
  const airfieldIds = [
    ...new Set(
      routeRows
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

  return routeRows.map((row) => ({
    departureLabel: row.departure_airfield_id
      ? (labelById.get(row.departure_airfield_id) ?? "Airfield")
      : (row.departure_country ?? "Country"),
    arrivalLabel: row.arrival_airfield_id
      ? (labelById.get(row.arrival_airfield_id) ?? "Airfield")
      : (row.arrival_country ?? "Country"),
    waitingCount: Number(row.waiting_count ?? 0),
  }));
}

export async function getPilotOverviewData(userId: string) {
  const supabase = await createClient();
  const sidebar = await getPilotSidebarContext(userId);
  const upcomingFlights = await fetchPilotFlights(userId);
  const topWaitingRoutes = await getTopWaitingAlertRoutes(5);

  const pendingRequests = await getPilotBookingRequests(userId);

  const { data: reviews } = await supabase
    .from("pilot_reviews_public")
    .select("rating")
    .eq("pilot_user_id", userId);

  const ratings =
    reviews
      ?.map((r) => r.rating)
      .filter((r): r is number => typeof r === "number") ?? [];
  const avgRating = averageRating(ratings);

  const { data: allFlights } = await supabase
    .from("flights")
    .select("id")
    .eq("pilot_user_id", userId);
  const allFlightIds = (allFlights ?? []).map((f) => f.id);

  let totalPax = 0;
  if (allFlightIds.length > 0) {
    const { count } = await supabase
      .from("flight_booking_requests")
      .select("id", { count: "exact", head: true })
      .in("flight_id", allFlightIds)
      .in("status", ["confirmed", "completed"]);
    totalPax = count ?? 0;
  }

  const earnings = await getPilotEarningsSummary(userId);

  const nextFlight = upcomingFlights[0];

  return {
    sidebar,
    upcomingFlights: upcomingFlights.slice(0, 3),
    pendingRequests: pendingRequests.slice(0, 2),
    pendingCount: sidebar.pendingRequests,
    topWaitingRoutes,
    stats: {
      upcoming: upcomingFlights.length,
      nextFlightLabel: nextFlight
        ? `${formatShortDate(nextFlight.flight_date)} · ${nextFlight.departure_time}`
        : "—",
      recoupedMonth: earnings.thisMonth,
      recoupedPending: earnings.pendingMonth,
      rating: avgRating,
      reviewCount: ratings.length,
      totalPax,
    },
  };
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export async function getPilotEarningsSummary(userId: string) {
  const supabase = await createClient();

  const { data: flights } = await supabase
    .from("flights")
    .select("id")
    .eq("pilot_user_id", userId);

  const flightIds = (flights ?? []).map((f) => f.id);
  if (!flightIds.length) {
    return {
      totalRecouped: 0,
      thisMonth: 0,
      thisMonthFlights: 0,
      avgPerFlight: 0,
      completedFlights: 0,
      pendingMonth: 0,
      monthly: [] as { label: string; value: number }[],
    };
  }

  const { data: bookings } = await supabase
    .from("flight_booking_requests")
    .select("pilot_payout_eur, status, created_at, flight_id")
    .in("flight_id", flightIds)
    .in("status", ["confirmed", "completed"]);

  const payouts = (bookings ?? [])
    .map((b) => ({
      amount: Number(b.pilot_payout_eur ?? 0),
      status: b.status,
      created_at: b.created_at,
    }))
    .filter((b) => b.amount > 0);

  const totalRecouped = payouts
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthPayouts = payouts.filter(
    (p) => new Date(p.created_at) >= monthStart,
  );
  const thisMonth = thisMonthPayouts
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);
  const pendingMonth = thisMonthPayouts
    .filter((p) => p.status === "confirmed")
    .reduce((s, p) => s + p.amount, 0);

  const completedFlights = new Set(
    payouts.filter((p) => p.status === "completed").map((_, i) => i),
  ).size;

  const { count: completedCount } = await supabase
    .from("flights")
    .select("id", { count: "exact", head: true })
    .eq("pilot_user_id", userId)
    .eq("status", "published")
    .lt("flight_date", now.toISOString().slice(0, 10));

  const flightCount = completedCount ?? payouts.length;
  const avgPerFlight =
    flightCount > 0 ? Math.round(totalRecouped / flightCount) : 0;

  const monthly: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const label = d.toLocaleDateString("en-GB", { month: "short" });
    const sum = payouts
      .filter((p) => {
        const t = new Date(p.created_at);
        return t >= d && t <= end && p.status === "completed";
      })
      .reduce((s, p) => s + p.amount, 0);
    monthly.push({ label, value: Math.round(sum) });
  }

  const thisMonthFlights = new Set(
    thisMonthPayouts.map((p) => p.created_at.slice(0, 7)),
  ).size;

  return {
    totalRecouped: Math.round(totalRecouped),
    thisMonth: Math.round(thisMonth),
    thisMonthFlights: Math.min(thisMonthPayouts.length, 99),
    avgPerFlight,
    completedFlights: flightCount,
    pendingMonth: Math.round(pendingMonth),
    monthly,
  };
}

export async function getPilotDocuments(userId: string): Promise<PilotDocumentRow[]> {
  const supabase = await createClient();

  const { data: pilotProfile } = await supabase
    .from("pilot_profiles")
    .select("license_expires_at, medical_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: docs } = await supabase
    .from("documents")
    .select("id, type, review_status, expires_at, uploaded_at")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });

  const { data: aircraft } = await supabase
    .from("aircraft")
    .select("registration, model")
    .eq("pilot_user_id", userId)
    .limit(1)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .single();

  const docStatus = (
    review: string | null,
    expires: string | null,
  ): PilotDocumentRow["status"] => {
    if (review === "rejected") return "rejected";
    if (review === "pending") return "pending";
    if (expires) {
      const days =
        (new Date(expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (days < 60) return "expiring";
    }
    return "verified";
  };

  const rows: PilotDocumentRow[] = [
    {
      id: "ppl",
      title: "PPL(A) Licence",
      subtext: `Valid · Expires ${formatExpiry(pilotProfile?.license_expires_at ?? null)}`,
      status: docStatus("approved", pilotProfile?.license_expires_at ?? null),
    },
    {
      id: "medical",
      title: "LAPL Medical",
      subtext: `Class 2 · Expires ${formatExpiry(pilotProfile?.medical_expires_at ?? null)}`,
      status: docStatus("approved", pilotProfile?.medical_expires_at ?? null),
    },
    {
      id: "id",
      title: "Government ID",
      subtext: "Verified via Didit",
      status: profile?.status === "verified" ? "verified" : "pending",
    },
  ];

  if (aircraft) {
    rows.push({
      id: "aircraft",
      title: "Aircraft registration",
      subtext: `${aircraft.registration ?? "—"} · ${aircraft.model ?? "Aircraft"}`,
      status: "verified",
    });
  }

  const insurance = (docs ?? []).find((d) => d.type === "airfield_operating_license");
  {
    rows.push({
      id: "insurance",
      title: "Third-party insurance",
      subtext: insurance?.expires_at
        ? `Expires ${formatExpiry(insurance.expires_at)}`
        : "On file · review annually",
      status: docStatus(
        insurance?.review_status ?? "approved",
        insurance?.expires_at ?? null,
      ),
    });
  }

  return rows;
}

export { relativeTime };
