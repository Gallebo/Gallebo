import type { FlightListItem } from "@/lib/flights/types";
import { flightPhotoUrl, formatFlightRoute, pilotDisplayName } from "@/lib/flights/utils";
import { getDefaultOgImageUrl, getSiteUrl, SITE_NAME } from "@/lib/seo/site";

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

export function homePageJsonLd(): JsonLd {
  const url = getSiteUrl();
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${url}/flights?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url,
      logo: getDefaultOgImageUrl(),
    },
  ];
}

export function flightPageJsonLd(flight: FlightListItem): JsonLd {
  const url = `${getSiteUrl()}/flights/${flight.id}`;
  const route = formatFlightRoute(flight);
  const departure = flight.departure_airfield;
  const arrival = flight.arrival_airfield;
  const startDate = `${flight.flight_date}T${String(flight.departure_time).slice(0, 5)}:00`;
  const photo = flight.flight_photos?.[0]?.storage_path
    ? flightPhotoUrl(flight.flight_photos[0].storage_path)
    : getDefaultOgImageUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Trip",
    name: route,
    description: flight.description ?? `Cost-sharing flight ${route}`,
    url,
    image: photo,
    itinerary: {
      "@type": "ItemList",
      itemListElement: [
        departure
          ? {
              "@type": "ListItem",
              position: 1,
              item: {
                "@type": "Place",
                name: departure.name,
                identifier: departure.icao_code,
              },
            }
          : null,
        arrival
          ? {
              "@type": "ListItem",
              position: 2,
              item: {
                "@type": "Place",
                name: arrival.name,
                identifier: arrival.icao_code,
              },
            }
          : null,
      ].filter(Boolean),
    },
    offers: {
      "@type": "Offer",
      price: Number(flight.price_per_passenger_eur).toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url,
      validFrom: startDate,
    },
    provider: flight.pilot
      ? {
          "@type": "Person",
          // TODO: Apply pilot name masking for users without a confirmed booking.
          name: pilotDisplayName(flight.pilot),
          url: `${getSiteUrl()}/pilots/${flight.pilot.id}`,
        }
      : undefined,
  };
}

export function pilotPageJsonLd(input: {
  id: string;
  name: string;
  avgRating: number | null;
  reviewCount: number;
  avatarUrl?: string | null;
}): JsonLd {
  const url = `${getSiteUrl()}/pilots/${input.id}`;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url,
    jobTitle: "Private pilot",
    worksFor: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };

  if (input.avatarUrl) {
    data.image = input.avatarUrl;
  }

  if (input.reviewCount > 0 && input.avgRating !== null) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.avgRating.toFixed(1),
      reviewCount: input.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return data;
}

export function airfieldPageJsonLd(input: {
  name: string;
  icao: string;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): JsonLd {
  const url = `${getSiteUrl()}/airfields/${input.icao.toLowerCase()}`;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Airport",
    name: input.name,
    iataCode: input.icao,
    url,
  };

  if (input.country) {
    data.address = {
      "@type": "PostalAddress",
      addressCountry: input.country,
    };
  }

  if (input.latitude != null && input.longitude != null) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }

  return data;
}

export function flightMetadataDescription(flight: FlightListItem): string {
  const route = formatFlightRoute(flight);
  const date = flight.flight_date;
  const price = Number(flight.price_per_passenger_eur).toFixed(2);
  return `Join a cost-sharing flight ${route} on ${date}. €${price} per passenger seat on ${SITE_NAME}.`;
}

export function flightMetadataImage(flight: FlightListItem): string {
  const photo = flight.flight_photos?.[0]?.storage_path;
  return photo ? flightPhotoUrl(photo) : getDefaultOgImageUrl();
}
