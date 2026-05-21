import Link from "next/link";
import { Suspense } from "react";

import { FlightListCard } from "@/components/flights/flight-list-card";
import { FlightSearchFilters } from "@/components/flights/flight-search-filters";
import { searchPublishedFlights } from "@/lib/flights/search";
import type { FlightSearchParams } from "@/lib/flights/types";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Find flights — Gallebo",
  description: "Search shared private flights across Europe.",
};

export default async function FlightsSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };

  const params: FlightSearchParams = {
    departureAirfieldId: get("from"),
    arrivalAirfieldId: get("to"),
    dateFrom: get("dateFrom"),
    dateTo: get("dateTo"),
    flightType: get("type") as FlightSearchParams["flightType"],
    minSeats: get("minSeats") ? Number(get("minSeats")) : undefined,
    maxPrice: get("maxPrice") ? Number(get("maxPrice")) : undefined,
    sort: (get("sort") as FlightSearchParams["sort"]) ?? "date",
    locationQuery: get("location"),
  };

  const flights = await searchPublishedFlights(params);

  const supabase = await createClient();
  const { data: airfields } = await supabase
    .from("airfields")
    .select("id, name, icao_code")
    .eq("status", "active")
    .order("name");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight">
            Find a flight
          </h1>
          <p className="mt-2 text-muted-foreground">
            Legal EASA cost-sharing — pilots share actual flight costs only.
          </p>
        </div>
        <Link href="/flights/map" className="text-sm text-primary hover:underline">
          Map view
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading filters…</p>}>
          <FlightSearchFilters airfields={airfields ?? []} />
        </Suspense>
        <div>
          {flights.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {flights.map((f) => (
                <FlightListCard key={f.id} flight={f} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No flights match your search. Try different dates or airfields.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
