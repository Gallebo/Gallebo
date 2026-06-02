import { CTASection } from "@/components/marketing/cta-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { FeaturedFlightsSection } from "@/components/marketing/featured-flights-section";
import { HeroCinematic } from "@/components/marketing/hero-cinematic";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { TrustSection } from "@/components/marketing/trust-section";
import { JsonLd } from "@/components/seo/json-ld";
import { homePageJsonLd } from "@/lib/seo/json-ld";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";
import { getFeaturedFlightsCached } from "@/lib/flights/cached-search";

export const revalidate = 60;

export const metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const featured = await getFeaturedFlightsCached();

  return (
    <div style={{ background: "var(--bg)" }}>
      <JsonLd data={homePageJsonLd()} />
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
