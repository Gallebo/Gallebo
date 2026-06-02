import { roundMoney } from "@/lib/bookings/pricing";
import { createClient } from "@/lib/supabase/server";

export type TransactionFlightRow = {
  flightId: string;
  dateLabel: string;
  flightDateIso: string;
  route: string;
  passengerCount: number;
  totalCostEur: number;
  pilotOwnShareEur: number;
  passengerShareEur: number;
  platformFeeEur: number;
  netReceivedEur: number;
  payoutStatusLabel: string;
  paidOutAt: string | null;
};

export type TransactionReportTotals = {
  totalFlightCostEur: number;
  totalPassengerShareEur: number;
  totalPlatformFeeEur: number;
  totalNetReceivedEur: number;
  totalPilotOwnShareEur: number;
};

export type TransactionReport = {
  pilotFullName: string;
  periodFrom: string;
  periodTo: string;
  generatedAt: string;
  flights: TransactionFlightRow[];
  totals: TransactionReportTotals;
};

type PaidBookingRow = {
  flight_id: string;
  paid_at: string | null;
  paid_out_at: string | null;
  payout_status: string;
  passenger_amount_eur: number | null;
  platform_fee_eur: number | null;
  pilot_payout_eur: number | null;
};

type FlightMeta = {
  id: string;
  flight_date: string;
  total_cost_eur: number;
  price_per_passenger_eur: number;
  dep: string;
  arr: string;
};

function formatFlightDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function aggregatePayoutStatus(
  bookings: Pick<PaidBookingRow, "payout_status" | "paid_out_at">[],
): { label: string; paidOutAt: string | null } {
  if (bookings.length === 0) {
    return { label: "—", paidOutAt: null };
  }
  if (bookings.every((b) => b.payout_status === "paid")) {
    const dates = bookings
      .map((b) => b.paid_out_at)
      .filter((d): d is string => Boolean(d))
      .sort()
      .reverse();
    return { label: "Paid", paidOutAt: dates[0] ?? null };
  }
  if (bookings.some((b) => b.payout_status === "failed")) {
    return { label: "Payout failed", paidOutAt: null };
  }
  if (bookings.some((b) => b.payout_status === "pending")) {
    return { label: "Pending payout", paidOutAt: null };
  }
  return { label: "—", paidOutAt: null };
}

const emptyTotals = (): TransactionReportTotals => ({
  totalFlightCostEur: 0,
  totalPassengerShareEur: 0,
  totalPlatformFeeEur: 0,
  totalNetReceivedEur: 0,
  totalPilotOwnShareEur: 0,
});

export async function getPilotTransactionYears(userId: string): Promise<number[]> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();

  const { data: earliestFlight } = await supabase
    .from("flights")
    .select("flight_date")
    .eq("pilot_user_id", userId)
    .order("flight_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const currentYear = new Date().getFullYear();
  const profileYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : currentYear;
  const flightYear = earliestFlight?.flight_date
    ? new Date(`${earliestFlight.flight_date}T12:00:00`).getFullYear()
    : currentYear;
  const startYear = Math.min(profileYear, flightYear, currentYear);

  const years: number[] = [];
  for (let y = currentYear; y >= startYear; y--) {
    years.push(y);
  }
  return years;
}

export async function getPilotTransactionReport(
  userId: string,
  period: { from: string; to: string },
): Promise<TransactionReport> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", userId)
    .single();

  const pilotFullName =
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Pilot";

  const { data: flights } = await supabase
    .from("flights")
    .select(
      `
      id,
      flight_date,
      total_cost_eur,
      price_per_passenger_eur,
      departure_airfield:airfields!flights_departure_airfield_id_fkey ( icao_code ),
      arrival_airfield:airfields!flights_arrival_airfield_id_fkey ( icao_code )
    `,
    )
    .eq("pilot_user_id", userId)
    .gte("flight_date", period.from)
    .lte("flight_date", period.to);

  const flightMap = new Map<string, FlightMeta>();
  for (const f of flights ?? []) {
    flightMap.set(f.id, {
      id: f.id,
      flight_date: f.flight_date,
      total_cost_eur: Number(f.total_cost_eur),
      price_per_passenger_eur: Number(f.price_per_passenger_eur),
      dep:
        (f.departure_airfield as { icao_code: string } | null)?.icao_code ?? "—",
      arr: (f.arrival_airfield as { icao_code: string } | null)?.icao_code ?? "—",
    });
  }

  const flightIds = [...flightMap.keys()];
  if (!flightIds.length) {
    return {
      pilotFullName,
      periodFrom: period.from,
      periodTo: period.to,
      generatedAt: new Date().toISOString(),
      flights: [],
      totals: emptyTotals(),
    };
  }

  const { data: bookings } = await supabase
    .from("flight_booking_requests")
    .select(
      "flight_id, paid_at, paid_out_at, payout_status, passenger_amount_eur, platform_fee_eur, pilot_payout_eur",
    )
    .in("flight_id", flightIds)
    .not("paid_at", "is", null);

  const byFlight = new Map<string, PaidBookingRow[]>();
  for (const b of bookings ?? []) {
    const row: PaidBookingRow = {
      flight_id: b.flight_id,
      paid_at: b.paid_at,
      paid_out_at: b.paid_out_at,
      payout_status: b.payout_status,
      passenger_amount_eur: b.passenger_amount_eur,
      platform_fee_eur: b.platform_fee_eur,
      pilot_payout_eur: b.pilot_payout_eur,
    };
    const list = byFlight.get(b.flight_id) ?? [];
    list.push(row);
    byFlight.set(b.flight_id, list);
  }

  const flightRows: TransactionFlightRow[] = [];

  for (const [flightId, paidBookings] of byFlight) {
    const meta = flightMap.get(flightId);
    if (!meta || paidBookings.length === 0) continue;

    const passengerCount = paidBookings.length;
    const passengerShareEur = roundMoney(
      paidBookings.reduce((s, b) => s + Number(b.passenger_amount_eur ?? 0), 0),
    );
    const platformFeeEur = roundMoney(
      paidBookings.reduce((s, b) => s + Number(b.platform_fee_eur ?? 0), 0),
    );
    const netReceivedEur = roundMoney(
      paidBookings.reduce((s, b) => s + Number(b.pilot_payout_eur ?? 0), 0),
    );
    const totalCostEur = roundMoney(meta.total_cost_eur);
    const pilotOwnShareEur = roundMoney(
      totalCostEur - passengerCount * meta.price_per_passenger_eur,
    );

    const payout = aggregatePayoutStatus(paidBookings);

    flightRows.push({
      flightId,
      dateLabel: formatFlightDate(meta.flight_date),
      flightDateIso: meta.flight_date,
      route: `${meta.dep} → ${meta.arr}`,
      passengerCount,
      totalCostEur,
      pilotOwnShareEur: Math.max(0, pilotOwnShareEur),
      passengerShareEur,
      platformFeeEur,
      netReceivedEur,
      payoutStatusLabel: payout.label,
      paidOutAt: payout.paidOutAt,
    });
  }

  flightRows.sort((a, b) => b.flightDateIso.localeCompare(a.flightDateIso));

  const totals = flightRows.reduce(
    (acc, row) => ({
      totalFlightCostEur: roundMoney(acc.totalFlightCostEur + row.totalCostEur),
      totalPassengerShareEur: roundMoney(
        acc.totalPassengerShareEur + row.passengerShareEur,
      ),
      totalPlatformFeeEur: roundMoney(acc.totalPlatformFeeEur + row.platformFeeEur),
      totalNetReceivedEur: roundMoney(acc.totalNetReceivedEur + row.netReceivedEur),
      totalPilotOwnShareEur: roundMoney(
        acc.totalPilotOwnShareEur + row.pilotOwnShareEur,
      ),
    }),
    emptyTotals(),
  );

  return {
    pilotFullName,
    periodFrom: period.from,
    periodTo: period.to,
    generatedAt: new Date().toISOString(),
    flights: flightRows,
    totals,
  };
}

export function formatEur(amount: number): string {
  return `€${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
