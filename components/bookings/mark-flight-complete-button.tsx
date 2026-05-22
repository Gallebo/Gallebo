"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { markFlightCompletedAction } from "@/lib/bookings/actions";
import { Button } from "@/components/ui/button";

export function MarkFlightCompleteButton({ flightId }: { flightId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "Mark this flight as completed? Confirmed passengers will be notified and payouts scheduled.",
          )
        ) {
          return;
        }
        startTransition(async () => {
          const res = await markFlightCompletedAction(flightId);
          if (res.error) alert(res.error);
          else alert(res.success);
          router.refresh();
        });
      }}
    >
      {pending ? "Saving…" : "Complete"}
    </Button>
  );
}
