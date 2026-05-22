"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { CancellationModal } from "@/components/bookings/cancellation-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  acceptBookingAction,
  rejectBookingAction,
} from "@/lib/bookings/actions";
import type { BookingStatus } from "@/lib/bookings/constants";
import { cn } from "@/lib/utils";

export type PilotBookingRow = {
  id: string;
  status: BookingStatus;
  created_at: string;
  pilot_payout_eur: number | null;
  passenger: {
    first_name: string | null;
    last_name: string | null;
    weight_kg: number | null;
  } | null;
  flight: {
    id: string;
    flight_date: string;
    price_per_passenger_eur: number;
    status: string;
  };
};

export function PilotBookingCard({
  booking,
  weightWarning,
}: {
  booking: PilotBookingRow;
  weightWarning?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const passengerName = booking.passenger
    ? `${booking.passenger.first_name ?? ""} ${booking.passenger.last_name ?? ""}`.trim()
    : "Passenger";

  const isPending = booking.status === "pending";
  const canCancel = ["pending", "accepted", "confirmed"].includes(booking.status);

  return (
    <li className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <BookingStatusBadge status={booking.status} />
          <p className="mt-2 font-medium">{passengerName}</p>
          <p className="text-sm text-muted-foreground">
            {booking.passenger?.weight_kg != null
              ? `Weight: ${booking.passenger.weight_kg} kg`
              : "Weight not set"}
            {" · "}
            Requested {new Date(booking.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link
          href={`/flights/${booking.flight.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View flight
        </Link>
      </div>

      {weightWarning ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">{weightWarning}</p>
      ) : null}

      {booking.pilot_payout_eur != null ? (
        <p className="text-sm">
          Your payout (after 4% fee):{" "}
          <strong>€{Number(booking.pilot_payout_eur).toFixed(2)}</strong>
        </p>
      ) : null}

      {isPending ? (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const res = await acceptBookingAction(booking.id);
                if (res.error) alert(res.error);
                router.refresh();
              });
            }}
          >
            Accept
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const res = await rejectBookingAction(booking.id);
                if (res.error) alert(res.error);
                router.refresh();
              });
            }}
          >
            Reject
          </Button>
        </div>
      ) : null}

      {canCancel && !isPending ? (
        <CancellationModal
          bookingId={booking.id}
          canRefund={booking.status === "confirmed"}
          refundNote="Pilot cancellation always refunds the passenger in full."
        />
      ) : null}
    </li>
  );
}
