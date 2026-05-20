"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  approveAirfieldRequestAction,
  rejectAirfieldRequestAction,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AirfieldActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setError(null);
          startTransition(async () => {
            const res = await approveAirfieldRequestAction(requestId, fd);
            if (res.error) setError(res.error);
            else router.push("/admin");
          });
        }}
        className="space-y-4 rounded-lg border p-4"
      >
        <h3 className="font-medium">Approve and create airfield</h3>
        <p className="text-sm text-muted-foreground">
          Enter coordinates and country before approving. The airfield will appear
          on the public map.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="latitude">
              Latitude
            </label>
            <Input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              placeholder="45.815"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="longitude">
              Longitude
            </label>
            <Input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              placeholder="15.9819"
              required
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="country">
            Country
          </label>
          <Input id="country" name="country" placeholder="Croatia" required />
        </div>
        <Button type="submit" disabled={pending}>
          Approve
        </Button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setError(null);
          startTransition(async () => {
            const res = await rejectAirfieldRequestAction(
              requestId,
              String(fd.get("reason") ?? "")
            );
            if (res.error) setError(res.error);
            else router.push("/admin");
          });
        }}
        className="flex gap-2"
      >
        <Input name="reason" placeholder="Rejection reason" required />
        <Button type="submit" variant="destructive" disabled={pending}>
          Reject
        </Button>
      </form>
    </div>
  );
}
