"use client";



import Link from "next/link";

import { useRouter } from "next/navigation";

import { useTransition } from "react";



import { BookingAccordionBody } from "@/components/bookings/BookingConversationsAccordion";

import { BookingAccordionSummary } from "@/components/bookings/booking-accordion-summary";

import { BookingChatSection } from "@/components/bookings/BookingChatSection";

import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";

import { CancellationModal } from "@/components/bookings/cancellation-modal";

import { Button, buttonVariants } from "@/components/ui/button";

import { acceptBookingAction } from "@/lib/bookings/actions";

import { PilotBookingRejectForm } from "@/components/pilot/pilot-booking-reject-form";

import type { PilotManageableBookingRow } from "@/lib/pilot/queries";

import { cn } from "@/lib/utils";



type PilotBookingAccordionProps = {

  expanded: boolean;

  onToggle: () => void;

};



export function PilotBookingCard({

  booking,

  currentUserId,

  weightWarning,

  accordion,

}: {

  booking: PilotManageableBookingRow;

  currentUserId: string;

  weightWarning?: string | null;

  accordion?: PilotBookingAccordionProps;

}) {

  const router = useRouter();

  const [pending, startTransition] = useTransition();

  const passengerName = booking.passenger

    ? `${booking.passenger.first_name ?? ""} ${booking.passenger.last_name ?? ""}`.trim()

    : "Passenger";



  const isPending = booking.status === "pending";

  const canCancel = ["pending", "accepted", "confirmed"].includes(booking.status);



  const routeLabel = `${booking.flight.departure_icao} → ${booking.flight.arrival_icao}`;

  const flightDate = new Date(`${booking.flight.flight_date}T12:00:00`).toLocaleDateString(

    "en-GB",

    { day: "numeric", month: "short", year: "numeric" },

  );

  const expanded = accordion ? accordion.expanded : true;



  const details = (

    <>

      <div className="flex flex-wrap items-start justify-between gap-2">

        {!accordion ? (

          <div>

            <BookingStatusBadge status={booking.status} />

            <p className="mt-2 font-medium">{passengerName}</p>

            <p className="text-sm text-muted-foreground">

              {routeLabel} · {flightDate}

              {" · "}

              {booking.passenger?.weight_kg != null

                ? `Weight: ${booking.passenger.weight_kg} kg`

                : "Weight not set"}

              {" · "}

              Requested {new Date(booking.created_at).toLocaleDateString()}

            </p>

          </div>

        ) : (

          <p className="text-sm text-muted-foreground">

            {booking.passenger?.weight_kg != null

              ? `Weight: ${booking.passenger.weight_kg} kg`

              : "Weight not set"}

            {" · "}

            Requested {new Date(booking.created_at).toLocaleDateString()}

          </p>

        )}

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

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">

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

          <PilotBookingRejectForm

            bookingId={booking.id}

            buttonLabel="Reject"

            className="min-w-[min(100%,280px)] flex-1 sm:max-w-sm"

          />

        </div>

      ) : null}



      {canCancel && !isPending ? (

        <CancellationModal

          bookingId={booking.id}

          canRefund={booking.status === "confirmed"}

          refundNote="Pilot cancellation always refunds the passenger in full."

        />

      ) : null}



      {expanded ? (

        <BookingChatSection

          bookingId={booking.id}

          status={booking.status}

          currentUserId={currentUserId}

          viewerRole="pilot"

        />

      ) : null}

    </>

  );



  return (

    <article

      id={`booking-${booking.id}`}

      className="scroll-mt-24 rounded-xl border p-5"

      style={{ borderColor: "var(--line)", background: "var(--surface)" }}

    >

      {accordion ? (

        <>

          <BookingAccordionSummary

            expanded={accordion.expanded}

            onToggle={accordion.onToggle}

            routeLabel={routeLabel}

            nameLabel={passengerName}

            meta={flightDate}

            badge={<BookingStatusBadge status={booking.status} />}

          />

          <BookingAccordionBody expanded={accordion.expanded}>

            <div className="space-y-3 border-t pt-3" style={{ borderColor: "var(--line)" }}>

              {details}

            </div>

          </BookingAccordionBody>

        </>

      ) : (

        <div className="space-y-3">{details}</div>

      )}

    </article>

  );

}

