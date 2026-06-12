import { getKycPendingCount } from "@/lib/admin/queries";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PlatformMetrics {
  totalUsers: number;
  verifiedPilots: number;
  totalFlights: number;
  publishedFlights: number;
  totalBookings: number;
  gmvEur: number;
  platformFeeEur: number;
  pendingKyc: number;
}

export interface RevenueByMonth {
  month: string;
  gmv: number;
  fee: number;
}

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const admin = createAdminClient();

  const [
    { count: totalUsers },
    { count: verifiedPilots },
    { count: totalFlights },
    { count: publishedFlights },
    { count: totalBookings },
    { data: gmvData },
    pendingKyc,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "pilot"),
    admin.from("flights").select("id", { count: "exact", head: true }),
    admin
      .from("flights")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    admin.from("flight_booking_requests").select("id", { count: "exact", head: true }),
    admin
      .from("ledger")
      .select("type, amount_eur"),
    getKycPendingCount(),
  ]);

  let gmvEur = 0;
  let platformFeeEur = 0;
  if (gmvData) {
    for (const e of gmvData) {
      if (e.type === "booking_payment") gmvEur += Number(e.amount_eur);
      if (e.type === "platform_fee") platformFeeEur += Number(e.amount_eur);
    }
  }

  return {
    totalUsers: totalUsers ?? 0,
    verifiedPilots: verifiedPilots ?? 0,
    totalFlights: totalFlights ?? 0,
    publishedFlights: publishedFlights ?? 0,
    totalBookings: totalBookings ?? 0,
    gmvEur,
    platformFeeEur,
    pendingKyc,
  };
}

/** Last N calendar months of GMV (fills missing months with 0). */
export async function getRevenueByMonth(months = 6): Promise<RevenueByMonth[]> {
  const admin = createAdminClient();
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data } = await admin
    .from("ledger")
    .select("type, amount_eur, created_at")
    .gte("created_at", since.toISOString())
    .in("type", ["booking_payment", "platform_fee"]);

  const map: Record<string, { gmv: number; fee: number }> = {};

  for (const e of data ?? []) {
    const d = new Date(e.created_at);
    const month = d.toLocaleDateString("en-US", { month: "short" });
    if (!map[month]) map[month] = { gmv: 0, fee: 0 };
    if (e.type === "booking_payment") map[month].gmv += Number(e.amount_eur);
    if (e.type === "platform_fee") map[month].fee += Number(e.amount_eur);
  }

  const result: RevenueByMonth[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    result.push({ month: label, gmv: map[label]?.gmv ?? 0, fee: map[label]?.fee ?? 0 });
  }

  return result;
}

export function monthOverMonthGrowth(series: { gmv: number }[]): number | null {
  if (series.length < 2) return null;
  const prev = series[series.length - 2]?.gmv ?? 0;
  const curr = series[series.length - 1]?.gmv ?? 0;
  if (prev <= 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

export async function getCurrentMonthGmv(): Promise<{ gmv: number; fee: number }> {
  const admin = createAdminClient();
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const { data } = await admin
    .from("ledger")
    .select("type, amount_eur")
    .gte("created_at", start.toISOString())
    .in("type", ["booking_payment", "platform_fee"]);

  let gmv = 0;
  let fee = 0;
  for (const e of data ?? []) {
    if (e.type === "booking_payment") gmv += Number(e.amount_eur);
    if (e.type === "platform_fee") fee += Number(e.amount_eur);
  }
  return { gmv, fee };
}

export async function getFlightsCompletedThisMonth(): Promise<number> {
  const admin = createAdminClient();
  const start = new Date();
  start.setDate(1);
  const monthStart = start.toISOString().slice(0, 10);

  const { count } = await admin
    .from("flights")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("flight_date", monthStart);

  return count ?? 0;
}

export async function getVerifiedPilotsCount(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "pilot")
    .eq("status", "verified");

  return count ?? 0;
}

export async function getUsersJoinedThisWeek(): Promise<number> {
  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since.toISOString());

  return count ?? 0;
}

export async function getAveragePilotRating(): Promise<number | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("pilot_reviews").select("rating");

  if (!data?.length) return null;
  const sum = data.reduce((acc, r) => acc + Number(r.rating), 0);
  return Math.round((sum / data.length) * 100) / 100;
}
