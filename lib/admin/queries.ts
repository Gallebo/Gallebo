import { formatDiditStatus, isDiditApproved, isPilotProfessionalDocument } from "@/lib/admin/didit";
import type { BookingStatus } from "@/lib/bookings/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export interface RecentFlightRow {
  id: string;
  route: string;
  dateLabel: string;
  pilotName: string;
  pax: number;
  revenueEur: number;
  statusLabel: string;
  statusVariant: "completed" | "active" | "scheduled";
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  flightsCount: number;
  joinedLabel: string;
  status: string;
  statusVariant: "active" | "kyc" | "scheduled";
}

export interface KycQueueItem {
  id: string;
  userId: string;
  name: string;
  roleLabel: string;
  requestedRole: string;
  submittedLabel: string;
  risk: "low" | "medium";
  diditStatus: string | null;
  diditStatusLabel: string;
  autoApproved: boolean;
  documents: string[];
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatJoined(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function hoursAgo(iso: string) {
  const h = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000));
  return `${h}h ago`;
}

function mapFlightStatus(status: string, flightDate: string): {
  label: string;
  variant: RecentFlightRow["statusVariant"];
} {
  if (status === "completed") return { label: "COMPLETED", variant: "completed" };
  const today = new Date().toISOString().slice(0, 10);
  if (status === "published" && flightDate <= today)
    return { label: "ACTIVE", variant: "active" };
  if (status === "published") return { label: "SCHEDULED", variant: "scheduled" };
  return { label: "SCHEDULED", variant: "scheduled" };
}

const PILOT_DOC_LABELS: Record<string, string> = {
  ppl_license: "PPL",
  lapl_license: "LAPL",
  medical_certificate: "MEDICAL",
};

export async function getRecentFlights(limit = 5): Promise<RecentFlightRow[]> {
  const admin = createAdminClient();

  const { data: flights } = await admin
    .from("flights")
    .select(`
      id,
      status,
      flight_date,
      passenger_seats,
      price_per_passenger_eur,
      pilot_user_id,
      departure_airfield:airfields!flights_departure_airfield_id_fkey(icao_code),
      arrival_airfield:airfields!flights_arrival_airfield_id_fkey(icao_code)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!flights?.length) return [];

  const pilotIds = [...new Set(flights.map((f) => f.pilot_user_id))];
  const { data: pilots } = await admin
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", pilotIds);

  const pilotMap = new Map(
    (pilots ?? []).map((p) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown pilot",
    ])
  );

  const flightIds = flights.map((f) => f.id);
  const { data: bookings } = await admin
    .from("flight_booking_requests")
    .select("flight_id, status")
    .in("flight_id", flightIds)
    .in("status", ["confirmed", "completed", "accepted"]);

  const paxByFlight = new Map<string, number>();
  for (const b of bookings ?? []) {
    paxByFlight.set(b.flight_id, (paxByFlight.get(b.flight_id) ?? 0) + 1);
  }

  return flights.map((f) => {
    const dep = (f.departure_airfield as { icao_code?: string } | null)?.icao_code ?? "?";
    const arr = (f.arrival_airfield as { icao_code?: string } | null)?.icao_code ?? "?";
    const pax = paxByFlight.get(f.id) ?? 0;
    const price = Number(f.price_per_passenger_eur) || 0;
    const mapped = mapFlightStatus(f.status ?? "draft", f.flight_date);

    return {
      id: f.id,
      route: `${dep} — ${arr}`,
      dateLabel: formatShortDate(f.flight_date),
      pilotName: pilotMap.get(f.pilot_user_id) ?? "—",
      pax,
      revenueEur: Math.round(pax * price),
      statusLabel: mapped.label,
      statusVariant: mapped.variant,
    };
  });
}

export async function getAdminUsers(limit = 200): Promise<AdminUserRow[]> {
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name, role, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!profiles?.length) return [];

  const ids = profiles.map((p) => p.id);
  const emailMap = new Map<string, string>();

  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of authList?.users ?? []) {
    if (ids.includes(u.id) && u.email) emailMap.set(u.id, u.email);
  }

  const { data: flightCounts } = await admin
    .from("flights")
    .select("pilot_user_id");

  const flightsByPilot = new Map<string, number>();
  for (const f of flightCounts ?? []) {
    flightsByPilot.set(f.pilot_user_id, (flightsByPilot.get(f.pilot_user_id) ?? 0) + 1);
  }

  return profiles.map((p) => {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "—";
    const status = p.status ?? "registered";
    const statusVariant: AdminUserRow["statusVariant"] =
      status === "pending" ? "kyc" : "active";

    return {
      id: p.id,
      name,
      email: emailMap.get(p.id) ?? "—",
      role: (p.role ?? "passenger").toUpperCase(),
      flightsCount: flightsByPilot.get(p.id) ?? 0,
      joinedLabel: formatJoined(p.created_at),
      status: status === "pending" ? "KYC PENDING" : "ACTIVE",
      statusVariant,
    };
  });
}

export async function getKycQueue(): Promise<KycQueueItem[]> {
  const admin = createAdminClient();

  const { data: requests } = await admin
    .from("verification_requests")
    .select("id, user_id, requested_role, created_at, didit_status, auto_approved")
    .is("reviewed_at", null)
    .order("created_at", { ascending: false });

  if (!requests?.length) return [];

  const userIds = requests.map((r) => r.user_id);
  const [{ data: profiles }, { data: documents }] = await Promise.all([
    admin.from("profiles").select("id, first_name, last_name").in("id", userIds),
    admin.from("documents").select("user_id, type").in("user_id", userIds),
  ]);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
    ])
  );

  const docsByUser = new Map<string, string[]>();
  for (const doc of documents ?? []) {
    if (!isPilotProfessionalDocument(doc.type)) continue;
    const label = PILOT_DOC_LABELS[doc.type] ?? doc.type.toUpperCase();
    const list = docsByUser.get(doc.user_id) ?? [];
    if (!list.includes(label)) list.push(label);
    docsByUser.set(doc.user_id, list);
  }

  return requests.map((r) => {
    const requestedRole = r.requested_role ?? "pilot";
    const isPassenger = requestedRole === "passenger";
    const diditApproved = isDiditApproved(r.didit_status);

    return {
      id: r.id,
      userId: r.user_id,
      name: profileMap.get(r.user_id) ?? "Unknown",
      roleLabel: requestedRole.toUpperCase(),
      requestedRole,
      submittedLabel: hoursAgo(r.created_at),
      risk: r.didit_status === "review" ? "medium" : "low",
      diditStatus: r.didit_status,
      diditStatusLabel: formatDiditStatus(r.didit_status),
      autoApproved: Boolean(r.auto_approved) || diditApproved,
      documents: isPassenger ? [] : (docsByUser.get(r.user_id) ?? []),
    };
  });
}

export type AdminBookingRow = {
  id: string;
  status: string;
  statusLabel: string;
  statusVariant: "active" | "scheduled" | "completed" | "kyc";
  createdLabel: string;
  route: string;
  flightDateLabel: string;
  passengerName: string;
  pilotName: string;
  amountEur: string;
};

const BOOKING_STATUS_VARIANT: Record<
  string,
  AdminBookingRow["statusVariant"]
> = {
  pending: "kyc",
  accepted: "scheduled",
  confirmed: "active",
  completed: "completed",
  cancelled: "scheduled",
  rejected: "scheduled",
  expired: "scheduled",
};

const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
  expired: "Expired",
};

export async function getAdminBookings(
  statusFilter?: string,
  limit = 200,
): Promise<AdminBookingRow[]> {
  const admin = createAdminClient();

  let query = admin
    .from("flight_booking_requests")
    .select(
      `
      id, status, created_at, passenger_amount_eur, passenger_user_id,
      flight:flights!flight_booking_requests_flight_id_fkey (
        flight_date,
        pilot_user_id,
        departure_airfield:airfields!flights_departure_airfield_id_fkey ( icao_code ),
        arrival_airfield:airfields!flights_arrival_airfield_id_fkey ( icao_code )
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (
    statusFilter &&
    statusFilter !== "all" &&
    statusFilter in BOOKING_STATUS_LABEL
  ) {
    query = query.eq("status", statusFilter as BookingStatus);
  }

  const { data: bookings, error } = await query;
  if (error) {
    console.error("[getAdminBookings]", error.message);
    return [];
  }

  if (!bookings?.length) return [];

  const profileIds = new Set<string>();
  for (const b of bookings) {
    profileIds.add(b.passenger_user_id);
    const flight = b.flight as {
      pilot_user_id?: string;
    } | null;
    if (flight?.pilot_user_id) profileIds.add(flight.pilot_user_id);
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", [...profileIds]);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(" ") || "—",
    ]),
  );

  return bookings.map((b) => {
    const flight = b.flight as {
      flight_date: string;
      pilot_user_id: string;
      departure_airfield: { icao_code: string } | null;
      arrival_airfield: { icao_code: string } | null;
    } | null;

    const dep = flight?.departure_airfield?.icao_code ?? "?";
    const arr = flight?.arrival_airfield?.icao_code ?? "?";
    const status = b.status ?? "pending";

    return {
      id: b.id,
      status,
      statusLabel: BOOKING_STATUS_LABEL[status] ?? status,
      statusVariant: BOOKING_STATUS_VARIANT[status] ?? "scheduled",
      createdLabel: formatJoined(b.created_at),
      route: `${dep} — ${arr}`,
      flightDateLabel: flight?.flight_date
        ? formatShortDate(flight.flight_date)
        : "—",
      passengerName: profileMap.get(b.passenger_user_id) ?? "—",
      pilotName: flight?.pilot_user_id
        ? (profileMap.get(flight.pilot_user_id) ?? "—")
        : "—",
      amountEur: `€${Math.round(Number(b.passenger_amount_eur ?? 0))}`,
    };
  });
}

export async function getFlightModerationStats() {
  const admin = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const today = now.toISOString().slice(0, 10);

  const [{ count: active }, { count: scheduled }, { count: completedMonth }, { count: flagged }] =
    await Promise.all([
      admin
        .from("flights")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .lte("flight_date", today),
      admin
        .from("flights")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .gt("flight_date", today),
      admin
        .from("flights")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("flight_date", monthStart),
      admin
        .from("flights")
        .select("id", { count: "exact", head: true })
        .eq("price_deviation_flag", true),
    ]);

  return {
    active: active ?? 0,
    scheduled: scheduled ?? 0,
    completedMonth: completedMonth ?? 0,
    flagged: flagged ?? 0,
  };
}
