"use client";

import { useEffect } from "react";

import { getPublicEnv, isPostHogConfigured } from "@/lib/env";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isPostHogConfigured()) return;

    void import("@/lib/analytics/track").then(({ posthog }) => {
      const env = getPublicEnv();
      if (!env.NEXT_PUBLIC_POSTHOG_KEY) return;
      posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
        persistence: "localStorage+cookie",
      });
    });
  }, []);

  return <>{children}</>;
}
