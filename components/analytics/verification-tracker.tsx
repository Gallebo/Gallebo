"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics/track";

const STORAGE_KEY = "gallebo_verification_tracked";

export function VerificationTracker({ isVerified }: { isVerified: boolean }) {
  useEffect(() => {
    if (!isVerified) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    trackEvent("verification_complete");
    localStorage.setItem(STORAGE_KEY, "1");
  }, [isVerified]);

  return null;
}
