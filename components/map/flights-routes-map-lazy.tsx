"use client";

import dynamic from "next/dynamic";

import type { FlightListItem } from "@/lib/flights/types";

const FlightsRoutesMap = dynamic(
  () =>
    import("@/components/map/flights-routes-map").then((m) => m.FlightsRoutesMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[min(70vh,560px)] w-full animate-pulse rounded-xl bg-muted/30" />
    ),
  },
);

export function FlightsRoutesMapLazy({
  flights,
  className,
}: {
  flights: FlightListItem[];
  className?: string;
}) {
  return <FlightsRoutesMap flights={flights} className={className} />;
}
