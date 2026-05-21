import {
  MIN_BENCHMARK_SAMPLES,
  PRICE_DEVIATION_PCT,
} from "@/lib/flights/constants";
import { createClient } from "@/lib/supabase/server";

export type PriceCheckResult = {
  avgPrice: number | null;
  sampleCount: number;
  deviationFlag: boolean;
  warningMessage: string | null;
};

export async function checkRoutePriceDeviation(
  departureAirfieldId: string,
  arrivalAirfieldId: string,
  flightType: "panoramic" | "excursion" | "one_way",
  pricePerPassenger: number,
): Promise<PriceCheckResult> {
  const supabase = await createClient();

  const { data: benchmark } = await supabase
    .from("route_price_benchmarks")
    .select("sample_count, avg_price_per_passenger_eur")
    .eq("departure_airfield_id", departureAirfieldId)
    .eq("arrival_airfield_id", arrivalAirfieldId)
    .eq("flight_type", flightType)
    .maybeSingle();

  const sampleCount = benchmark?.sample_count ?? 0;
  const avg = benchmark?.avg_price_per_passenger_eur
    ? Number(benchmark.avg_price_per_passenger_eur)
    : null;

  if (!avg || sampleCount < MIN_BENCHMARK_SAMPLES) {
    return {
      avgPrice: avg,
      sampleCount,
      deviationFlag: false,
      warningMessage: null,
    };
  }

  const lower = avg * (1 - PRICE_DEVIATION_PCT);
  const upper = avg * (1 + PRICE_DEVIATION_PCT);
  const deviationFlag = pricePerPassenger < lower || pricePerPassenger > upper;

  return {
    avgPrice: avg,
    sampleCount,
    deviationFlag,
    warningMessage: deviationFlag
      ? `Your price (€${pricePerPassenger.toFixed(2)}) differs significantly from the route average (€${avg.toFixed(2)}). Admin will be notified.`
      : null,
  };
}
