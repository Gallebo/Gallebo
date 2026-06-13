"use client";

// posthog-js is client-only: this module is never imported statically on the server
// (PostHogProvider loads it via dynamic import in useEffect).
import posthog from "posthog-js";

import { isPostHogConfigured } from "@/lib/env";

export type AnalyticsEvent =
  | "registration"
  | "verification_complete"
  | "booking_created"
  | "flight_completed";

export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null | undefined>,
) {
  if (typeof window === "undefined" || !isPostHogConfigured()) return;
  if (!(posthog as unknown as { __loaded?: boolean }).__loaded) return;
  posthog.capture(event, properties);
}

export function identifyUser(
  userId: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
) {
  if (typeof window === "undefined" || !isPostHogConfigured()) return;
  if (!(posthog as unknown as { __loaded?: boolean }).__loaded) return;
  posthog.identify(userId, properties);
}

export { posthog };
