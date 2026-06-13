"use client";

import dynamic from "next/dynamic";

import type { AirfieldSummary } from "@/lib/airfields/queries";

const AirfieldsListing = dynamic(
  () =>
    import("@/components/airfield/public/airfields-listing").then(
      (m) => m.AirfieldsListing,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full animate-pulse rounded-lg bg-muted/30 sm:h-[500px]" />
    ),
  },
);

export function AirfieldsListingLazy({
  airfields,
  className,
}: {
  airfields: AirfieldSummary[];
  className?: string;
}) {
  return <AirfieldsListing airfields={airfields} className={className} />;
}
