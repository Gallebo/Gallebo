import type { MetadataRoute } from "next";

import {
  getSitemapAirfieldIcaos,
  getSitemapFlightIds,
  getSitemapPilotIds,
} from "@/lib/seo/sitemap-data";
import { getSiteUrl } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/flights`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/airfields`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/flights/map`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/map`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  let flightRoutes: MetadataRoute.Sitemap = [];
  let pilotRoutes: MetadataRoute.Sitemap = [];
  let airfieldRoutes: MetadataRoute.Sitemap = [];

  try {
    const [flightIds, pilotIds, airfieldIcaos] = await Promise.all([
      getSitemapFlightIds(),
      getSitemapPilotIds(),
      getSitemapAirfieldIcaos(),
    ]);

    flightRoutes = flightIds.map((id) => ({
      url: `${base}/flights/${id}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    pilotRoutes = pilotIds.map((id) => ({
      url: `${base}/pilots/${id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    airfieldRoutes = airfieldIcaos.map((icao) => ({
      url: `${base}/airfields/${icao.toLowerCase()}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // Supabase may be unavailable at build time; static routes still ship.
  }

  return [...staticRoutes, ...flightRoutes, ...pilotRoutes, ...airfieldRoutes];
}
