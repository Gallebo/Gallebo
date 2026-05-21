import Link from "next/link";

import { DestinationCard } from "@/components/marketing/destination-card";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { FlightListCard } from "@/components/flights/flight-list-card";
import { HeroSection } from "@/components/marketing/hero-section";
import { SectionHeader } from "@/components/marketing/section-header";
import { TrustBar } from "@/components/marketing/trust-bar";
import { buttonVariants } from "@/components/ui/button";
import { searchPublishedFlights } from "@/lib/flights/search";
import { PLACEHOLDER_DESTINATIONS } from "@/lib/marketing/data";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const featured = await searchPublishedFlights({ sort: "date" });
  const showFeatured = featured.slice(0, 4);

  return (
    <>
      <HeroSection />
      <TrustBar />
      <FeatureGrid />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          title="Popular cities to fly from"
          subtitle="Destinations to add to your bucket list"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
          {PLACEHOLDER_DESTINATIONS.map((city) => (
            <DestinationCard
              key={city.slug}
              name={city.name}
              description={city.description}
              image={city.image}
              badge={city.badge}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            title="Featured sightseeing flights"
            subtitle="Scenic experiences shared by verified pilots"
          />
          <Link
            href="/flights"
            className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
          >
            View all flights
          </Link>
        </div>
        {showFeatured.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {showFeatured.map((f) => (
              <FlightListCard key={f.id} flight={f} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No published flights yet.{" "}
            <Link href="/flights" className="text-primary hover:underline">
              Browse the map
            </Link>
          </p>
        )}
      </section>
    </>
  );
}
