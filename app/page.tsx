import { CTASection } from "@/components/marketing/cta-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { FeaturedFlightsSection } from "@/components/marketing/featured-flights-section";
import { HeroCinematic } from "@/components/marketing/hero-cinematic";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { TrustSection } from "@/components/marketing/trust-section";
import { searchPublishedFlights } from "@/lib/flights/search";

export default async function HomePage() {
  const featured = await searchPublishedFlights({ sort: "date" });

  return (
    <div style={{ background: "var(--bg)" }}>
      <HeroCinematic />
      <StatsStrip />
      <HowItWorks />
      <TrustSection />
      <FeaturedFlightsSection flights={featured} />
      <FAQSection />
      <CTASection />
    </div>
  );
}
