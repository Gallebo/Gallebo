"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { BookingChatSection } from "@/components/bookings/BookingChatSection";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { CancellationModal } from "@/components/bookings/cancellation-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  acceptBookingAction,
  rejectBookingAction,
} from "@/lib/bookings/actions";
import type { BookingStatus } from "@/lib/bookings/constants";
import type { PilotManageableBookingRow } from "@/lib/pilot/queries";
import { cn } from "@/lib/utils";

export function PilotBookingCard({
  booking,
  currentUserId,
  weightWarning,
}: {
  booking: PilotManageableBookingRow;
  currentUserId: string;
  weightWarning?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const passengerName = booking.passenger
    ? `${booking.passenger.first_name ?? ""} ${booking.passenger.last_name ?? ""}`.trim()
    : "Passenger";

  const isPending = booking.status === "pending";
  const canCancel = ["pending", "accepted", "confirmed"].includes(booking.status);

  const routeLabel = `${booking.flight.departure_icao} → ${booking.flight.arrival_icao}`;

  return (
    <li
      id={`booking-${booking.id}`}
      className="rounded-xl border p-5 space-y-3 scroll-mt-24"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <BookingStatusBadge status={booking.status} />
          <p className="mt-2 font-medium">{passengerName}</p>
          <p className="text-sm text-muted-foreground">
            {routeLabel} · {new Date(`${booking.flight.flight_date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            {" · "}
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

      <BookingChatSection
        bookingId={booking.id}
        status={booking.status}
        currentUserId={currentUserId}
        viewerRole="pilot"
      />
    </li>
  );
}
