import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/flights",
          "/flights/",
          "/pilots/",
          "/airfields",
          "/airfields/",
          "/map",
        ],
        disallow: [
          "/admin",
          "/admin/",
          "/pilot",
          "/pilot/",
          "/passenger",
          "/passenger/",
          "/dashboard",
          "/dashboard/",
          "/airfield",
          "/airfield/",
          "/onboarding",
          "/onboarding/",
          "/api",
          "/api/",
          "/dev",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
