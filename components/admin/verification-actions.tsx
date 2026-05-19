"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  approveVerificationAction,
  rejectVerificationAction,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerificationActions({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await approveVerificationAction(requestId);
            if (res.error) setError(res.error);
            else router.push("/admin");
          });
        }}
      >
        Approve
      </Button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setError(null);
          startTransition(async () => {
            const res = await rejectVerificationAction(
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
