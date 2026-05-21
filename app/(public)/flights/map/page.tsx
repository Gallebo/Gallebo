import Link from "next/link";

import { FlightsRoutesMap } from "@/components/map/flights-routes-map";
import { searchPublishedFlights } from "@/lib/flights/search";
import type { FlightSearchParams } from "@/lib/flights/types";

export const metadata = {
  title: "Flights map — Gallebo",
  description: "Explore shared flight routes on the map.",
};

export default async function FlightsMapPage({
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
    locationQuery: get("location"),
  };

  const flights = await searchPublishedFlights(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight">
            Flights map
          </h1>
          <p className="mt-2 text-muted-foreground">
            Click a route to preview the listing.
          </p>
        </div>
        <Link href="/flights" className="text-sm text-primary hover:underline">
          List view
        </Link>
      </div>
      <FlightsRoutesMap flights={flights} />
    </div>
  );
}
