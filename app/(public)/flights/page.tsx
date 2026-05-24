import Link from "next/link";
import { Suspense } from "react";

import { FlightResultRow } from "@/components/flights/flight-result-row";
import { FlightSearchFilters } from "@/components/flights/flight-search-filters";
import {
  filterFlightsClient,
  flightTypesFromSearchParams,
  parseBoolSearchParam,
} from "@/lib/flights/search-filters";
import { FlightsResultsToolbar } from "@/components/flights/flights-results-toolbar";
import { FlightsSearchHero } from "@/components/flights/flights-search-hero";
import { searchPublishedFlights } from "@/lib/flights/search";
import type { FlightSearchParams, FlightType } from "@/lib/flights/types";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Find a flight",
  description: "Search shared private flights across the Adriatic.",
};

function buildMetaLine(params: {
  dateFrom?: string;
  dateTo?: string;
}): string {
  const parts: string[] = ["Adriatic"];
  if (params.dateFrom || params.dateTo) {
    const fmt = (iso: string) => {
      const d = new Date(`${iso}T12:00:00`);
      return d
        .toLocaleDateString("en-GB", { month: "short", day: "numeric" })
        .toUpperCase();
    };
    if (params.dateFrom && params.dateTo) {
      parts.push(`${fmt(params.dateFrom)} — ${fmt(params.dateTo)}`);
    } else if (params.dateFrom) {
      parts.push(`FROM ${fmt(params.dateFrom)}`);
    } else if (params.dateTo) {
      parts.push(`UNTIL ${fmt(params.dateTo)}`);
    }
  }
  parts.push("Updated just now");
  return parts.join(" · ");
}

function countByType(
  flights: { flight_type: FlightType }[],
): { scenic: number; transfer: number } {
  let scenic = 0;
  let transfer = 0;
  for (const f of flights) {
    if (f.flight_type === "one_way") transfer += 1;
    else scenic += 1;
  }
  return { scenic, transfer };
}

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

  const scenic = parseBoolSearchParam(get("scenic"), true);
  const transfer = parseBoolSearchParam(get("transfer"), true);
  const types = flightTypesFromSearchParams(scenic, transfer);
  const minRatingRaw = get("minRating");
  const minRating =
    minRatingRaw && minRatingRaw !== "any" ? Number(minRatingRaw) : undefined;

  const serverParams: FlightSearchParams = {
    departureAirfieldId: get("from"),
    arrivalAirfieldId: get("to"),
    dateFrom: get("dateFrom"),
    dateTo: get("dateTo"),
    minSeats: get("minSeats") ? Number(get("minSeats")) : undefined,
    maxPrice: get("maxPrice") ? Number(get("maxPrice")) : 150,
    sort: (get("sort") as FlightSearchParams["sort"]) ?? "date",
    locationQuery: get("location"),
  };

  if (types && types.length === 1) {
    serverParams.flightType = types[0];
  }

  const allFlights = await searchPublishedFlights(serverParams);

  const flights = filterFlightsClient(allFlights, {
    scenic,
    transfer,
    minRating: Number.isFinite(minRating) ? minRating : undefined,
  });

  const supabase = await createClient();
  const { data: airfields } = await supabase
    .from("airfields")
    .select("id, name, icao_code")
    .eq("status", "active")
    .order("name");

  const typeCounts = countByType(allFlights);
  const metaLine = buildMetaLine({
    dateFrom: serverParams.dateFrom,
    dateTo: serverParams.dateTo,
  });

  return (
    <div style={{ background: "var(--bg)" }}>
      <Suspense fallback={null}>
        <FlightsSearchHero airfields={airfields ?? []} />
      </Suspense>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-end">
          <Link
            href="/flights/map"
            className="text-[13px] font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--primary-v2)" }}
          >
            Map view →
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
          <Suspense fallback={<FiltersSkeleton />}>
            <FlightSearchFilters matchCount={flights.length} counts={typeCounts} />
          </Suspense>

          <div>
            <Suspense fallback={null}>
              <FlightsResultsToolbar count={flights.length} metaLine={metaLine} />
            </Suspense>

            {flights.length > 0 ? (
              <div className="flex flex-col gap-4">
                {flights.map((f) => (
                  <FlightResultRow key={f.id} flight={f} />
                ))}
              </div>
            ) : (
              <div
                className="rounded-xl border px-6 py-12 text-center"
                style={{ borderColor: "var(--line)", background: "var(--surface)" }}
              >
                <p
                  className="text-[1.25rem] font-medium"
                  style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
                >
                  No flights match your search
                </p>
                <p className="mt-2 text-[14px]" style={{ color: "var(--ink-2)" }}>
                  Try different dates, routes, or loosen your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FiltersSkeleton() {
  return (
    <div
      className="h-96 animate-pulse rounded-xl"
      style={{ background: "var(--surface-alt)" }}
      aria-hidden="true"
    />
  );
}
