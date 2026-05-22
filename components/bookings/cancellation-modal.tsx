"use client";

import { useState, useTransition } from "react";

import { cancelBookingAction } from "@/lib/bookings/actions";
import { Button } from "@/components/ui/button";

export function CancellationModal({
  bookingId,
  canRefund,
  refundNote,
}: {
  bookingId: string;
  canRefund: boolean;
  refundNote: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Cancel booking
      </Button>
    );
  }

  return (
    <div className="rounded-md border p-4 space-y-3">
      <p className="text-sm font-medium">Cancel this booking?</p>
      <p className="text-sm text-muted-foreground">{refundNote}</p>
      {canRefund ? (
        <p className="text-sm text-green-700 dark:text-green-300">
          You qualify for a full refund.
        </p>
      ) : (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          No refund (less than 48h before departure).
        </p>
      )}
      {message ? <p className="text-sm">{message}</p> : null}
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const res = await cancelBookingAction(bookingId);
              setMessage(res.error ?? res.success ?? null);
              if (!res.error) setOpen(false);
            });
          }}
        >
          {pending ? "Cancelling…" : "Confirm cancel"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Keep booking
        </Button>
      </div>
    </div>
  );
}
