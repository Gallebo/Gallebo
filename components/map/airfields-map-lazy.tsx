"use client";

import dynamic from "next/dynamic";

import type { AirfieldMapMarker } from "@/lib/airfield/types";

const AirfieldsMap = dynamic(
  () => import("@/components/map/airfields-map").then((m) => m.AirfieldsMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full animate-pulse rounded-lg bg-muted/30" />
    ),
  },
);

export function AirfieldsMapLazy({
  airfields,
  className,
}: {
  airfields: AirfieldMapMarker[];
  className?: string;
}) {
  return <AirfieldsMap airfields={airfields} className={className} />;
}
