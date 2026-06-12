"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { rejectBookingAction } from "@/lib/bookings/actions";
import { cn } from "@/lib/utils";

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

export function PilotBookingRejectForm({
  bookingId,
  buttonLabel = "Decline",
  className,
}: {
  bookingId: string;
  buttonLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const trimmed = reason.trim();
  const canSubmit =
    trimmed.length >= MIN_REASON_LENGTH && trimmed.length <= MAX_REASON_LENGTH;

  return (
    <form
      className={cn("flex flex-col gap-2", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError(null);
        startTransition(async () => {
          const res = await rejectBookingAction(bookingId, trimmed);
          if (res.error) setError(res.error);
          else router.refresh();
        });
      }}
    >
      <textarea
        name="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={MAX_REASON_LENGTH}
        required
        rows={2}
        placeholder="Rejection reason (required, min 10 characters)"
        className="min-h-[72px] w-full resize-y rounded-md border px-3 py-2 text-sm"
        style={{
          borderColor: "var(--line)",
          background: "var(--surface)",
          color: "var(--ink)",
        }}
        disabled={pending}
      />
      {error ? (
        <p className="text-[13px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="outline"
        disabled={pending || !canSubmit}
        className="self-start border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        {buttonLabel}
      </Button>
    </form>
  );
}
