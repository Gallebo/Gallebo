"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DiditStartButton({ disabled = false }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDidit() {
    if (disabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/didit/session", { method: "POST" });
      const data = (await res.json()) as { redirectUrl?: string; error?: string };
      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? "Could not start verification");
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={startDidit} disabled={loading || disabled}>
        {loading ? "Starting…" : "Continue to Didit verification"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
