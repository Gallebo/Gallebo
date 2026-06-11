"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SetupPayoutsButton({
  label,
  apiPath = "/api/pilot/setup-payouts",
}: {
  label: string;
  apiPath?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiPath, { method: "POST" });
      const data = (await res.json()) as { onboardingUrl?: string; error?: string };
      if (!res.ok || !data.onboardingUrl) {
        setError(data.error ?? "Failed to create onboarding link");
        return;
      }
      window.location.href = data.onboardingUrl;
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Redirecting to Stripe…" : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
