import { createAdminClient } from "@/lib/supabase/admin";

export type MarketingStats = {
  hasData: boolean;
  pilots: number;
  seatsBooked: number;
  avgPerSeat: number | null;
  avgRating: number | null;
};

const emptyStats: MarketingStats = {
  hasData: false,
  pilots: 0,
  seatsBooked: 0,
  avgPerSeat: null,
  avgRating: null,
};

export async function getMarketingStats(): Promise<MarketingStats> {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return emptyStats;
  }

  const [pilots, bookings, avgPrice, avgRating] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "verified")
      .eq("role", "pilot"),

    supabase
      .from("flight_booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),

    supabase
      .from("flights")
      .select("price_per_passenger_eur")
      .eq("status", "completed"),

    supabase
      .from("pilot_reviews")
      .select("rating")
      .eq("is_visible", true),
  ]);

  const pilotCount = pilots.count ?? 0;
  const bookingCount = bookings.count ?? 0;
  const avgPriceVal = avgPrice.data?.length
    ? Math.round(
        avgPrice.data.reduce((a, b) => a + b.price_per_passenger_eur, 0) /
          avgPrice.data.length,
      )
    : null;
  const avgRatingVal = avgRating.data?.length
    ? Math.round(
        (avgRating.data.reduce((a, b) => a + b.rating, 0) /
          avgRating.data.length) *
          100,
      ) / 100
    : null;

  const hasData = pilotCount > 0 && bookingCount > 0;

  return {
    hasData,
    pilots: pilotCount,
    seatsBooked: bookingCount,
    avgPerSeat: avgPriceVal,
    avgRating: avgRatingVal,
  };
}
