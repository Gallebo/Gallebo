import { DestinationCard } from "@/components/marketing/destination-card";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { FlightCard } from "@/components/marketing/flight-card";
import { HeroSection } from "@/components/marketing/hero-section";
import { SectionHeader } from "@/components/marketing/section-header";
import { TrustBar } from "@/components/marketing/trust-bar";
import {
  PLACEHOLDER_DESTINATIONS,
  PLACEHOLDER_FLIGHTS,
} from "@/lib/marketing/data";

export default function HomePage() {
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
        <SectionHeader
          title="Featured sightseeing flights"
          subtitle="Scenic experiences shared by verified pilots"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLACEHOLDER_FLIGHTS.map((flight) => (
            <FlightCard
              key={flight.slug}
              title={flight.title}
              location={flight.location}
              image={flight.image}
            />
          ))}
        </div>
      </section>
    </>
  );
}
