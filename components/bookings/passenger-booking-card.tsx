"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { BookingChatSection } from "@/components/bookings/BookingChatSection";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { CancellationModal } from "@/components/bookings/cancellation-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import { startCheckoutAction } from "@/lib/bookings/actions";
import { passengerRefundEligible } from "@/lib/bookings/pricing";
import type { BookingStatus } from "@/lib/bookings/constants";
import { cn } from "@/lib/utils";

export type PassengerBookingRow = {
  id: string;
  status: BookingStatus;
  created_at: string;
  payment_expires_at: string | null;
  passenger_amount_eur: number | null;
  paid_at: string | null;
  refunded_at: string | null;
  flight: {
    id: string;
    flight_date: string;
    departure_time: string;
    price_per_passenger_eur: number;
    pilot: { first_name: string | null; last_name: string | null } | null;
    departure: { name: string; icao_code: string } | null;
    arrival: { name: string; icao_code: string } | null;
  };
};

export function PassengerBookingCard({
  booking,
  currentUserId,
}: {
  booking: PassengerBookingRow;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const f = booking.flight;
  const pilotName = f.pilot
    ? `${f.pilot.first_name ?? ""} ${f.pilot.last_name ?? ""}`.trim()
    : "Pilot";

  const canCancel = ["pending", "accepted", "confirmed"].includes(booking.status);
  const canPay = booking.status === "accepted";
  const refundEligible =
    booking.status === "confirmed" &&
    passengerRefundEligible(f.flight_date);

  return (
    <li
      id={`booking-${booking.id}`}
      className="rounded-lg border p-4 space-y-3 scroll-mt-24"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <BookingStatusBadge status={booking.status} />
          <p className="mt-2 font-medium">
            {f.departure?.icao_code} → {f.arrival?.icao_code}
          </p>
          <p className="text-sm text-muted-foreground">
            {f.flight_date} · {f.departure_time?.slice(0, 5)} · {pilotName}
          </p>
        </div>
        <Link
          href={`/flights/${f.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Flight details
        </Link>
      </div>

      {booking.passenger_amount_eur != null && booking.status !== "pending" ? (
        <p className="text-sm">
          Total (incl. 4% fee):{" "}
          <strong>€{Number(booking.passenger_amount_eur).toFixed(2)}</strong>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Seat price: €{Number(f.price_per_passenger_eur).toFixed(2)} (+ 4% fee when
          accepted)
        </p>
      )}

      {booking.status === "accepted" && booking.payment_expires_at ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Pay before {new Date(booking.payment_expires_at).toLocaleString()}
        </p>
      ) : null}

      {booking.refunded_at ? (
        <p className="text-sm text-green-700 dark:text-green-300">
          Refund processed
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canPay ? (
          <Button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const res = await startCheckoutAction(booking.id);
                if (res.checkoutUrl) {
                  window.location.href = res.checkoutUrl;
                } else if (res.error) {
                  alert(res.error);
                }
                router.refresh();
              });
            }}
          >
            {pending ? "Loading…" : "Pay now"}
          </Button>
        ) : null}
        {canCancel ? (
          <CancellationModal
            bookingId={booking.id}
            canRefund={refundEligible || booking.status !== "confirmed"}
            refundNote={
              booking.status === "confirmed"
                ? "Cancellation policy depends on time until departure."
                : "No charge yet — you can cancel freely."
            }
          />
        ) : null}
      </div>

      <BookingChatSection
        bookingId={booking.id}
        status={booking.status}
        currentUserId={currentUserId}
        viewerRole="passenger"
      />
    </li>
  );
}
