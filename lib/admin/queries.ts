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
  submittedLabel: string;
  risk: "low" | "medium";
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

const DOC_LABELS: Record<string, string> = {
  id_card: "ID",
  ppl_license: "PPL(A)",
  lapl_license: "LAPL",
  medical_certificate: "MEDICAL",
  airfield_operating_license: "INSURANCE",
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
    .select("id, user_id, requested_role, created_at, didit_status")
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
    const label = DOC_LABELS[doc.type] ?? doc.type.toUpperCase();
    const list = docsByUser.get(doc.user_id) ?? [];
    if (!list.includes(label)) list.push(label);
    docsByUser.set(doc.user_id, list);
  }

  return requests.map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: profileMap.get(r.user_id) ?? "Unknown",
    roleLabel: (r.requested_role ?? "pilot").toUpperCase(),
    submittedLabel: hoursAgo(r.created_at),
    risk: r.didit_status === "review" ? "medium" : "low",
    documents: docsByUser.get(r.user_id) ?? ["ID"],
  }));
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
