"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitBookingRequestAction } from "@/lib/flights/actions";

type BookingFeedback =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function BookingRequestButton({
  flightId,
  canBook,
  isLoggedIn,
  isVerifiedPassenger,
}: {
  flightId: string;
  canBook: boolean;
  isLoggedIn: boolean;
  isVerifiedPassenger: boolean;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<BookingFeedback>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?next=/flights/${flightId}`}
        className={cn(buttonVariants(), "w-full sm:w-auto")}
      >
        Log in to request booking
      </Link>
    );
  }

  if (!isVerifiedPassenger) {
    return (
      <p className="text-sm text-muted-foreground">
        Only verified passengers can request bookings. Complete verification in your
        dashboard.
      </p>
    );
  }

  if (!canBook) {
    return (
      <p className="text-sm text-muted-foreground">No passenger seats available.</p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full sm:w-auto"
        disabled={pending}
        onClick={() => {
          setFeedback({ status: "idle" });
          startTransition(async () => {
            const res = await submitBookingRequestAction(flightId);
            if (res.error) {
              setFeedback({ status: "error", message: res.error });
            } else {
              setFeedback({
                status: "success",
                message: res.success ?? "Booking request sent",
              });
              router.refresh();
            }
          });
        }}
      >
        {pending ? "Sending…" : "Request booking"}
      </Button>
      {feedback.status !== "idle" ? (
        <p
          className={
            feedback.status === "success"
              ? "text-sm text-green-600"
              : "text-sm text-destructive"
          }
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
