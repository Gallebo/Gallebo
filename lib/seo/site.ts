import { getAppUrl } from "@/lib/env";

export const SITE_NAME = "Gallebo";
export const SITE_TAGLINE = "Share the cost of private flights";
export const SITE_DESCRIPTION =
  "European platform connecting private pilots and passengers for legal EASA cost-sharing flights.";

export function getSiteUrl(): string {
  return getAppUrl();
}

export const DEFAULT_OG_IMAGE_PATH = "/hero-contrail.png";

export function getDefaultOgImageUrl(): string {
  return new URL(DEFAULT_OG_IMAGE_PATH, getSiteUrl()).toString();
}

/** Dashboard/admin pages: noindex but still show a tab title. */
export const privatePageRobots = {
  index: false,
  follow: false,
} as const;
