"use client";

import dynamic from "next/dynamic";

export const AirfieldMiniMapLazy = dynamic(
  () =>
    import("@/components/map/airfield-mini-map").then((m) => m.AirfieldMiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[240px] w-full animate-pulse rounded-lg bg-muted/30" />
    ),
  },
);
