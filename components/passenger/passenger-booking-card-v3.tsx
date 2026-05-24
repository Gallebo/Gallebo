"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { BookingChatSection } from "@/components/bookings/BookingChatSection";
import { CancellationModal } from "@/components/bookings/cancellation-modal";
import { startCheckoutAction } from "@/lib/bookings/actions";
import { passengerRefundEligible } from "@/lib/bookings/pricing";
import { airfieldCityName } from "@/lib/flights/route-meta";
import type { PassengerBookingV3 } from "@/lib/passenger/queries";

function formatFlightDateTime(iso: string, time: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${date}, ${time.slice(0, 5)} local`;
}

function pilotInitials(
  first: string | null,
  last: string | null,
): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "P";
}

function statusBadge(status: PassengerBookingV3["status"]): {
  label: string;
  color: string;
  border: string;
} {
  if (status === "confirmed") {
    return {
      label: "Confirmed",
      color: "var(--success)",
      border: "var(--success)",
    };
  }
  if (status === "pending" || status === "accepted") {
    return {
      label: status === "pending" ? "Pending" : "Accepted",
      color: "var(--sun)",
      border: "var(--sun)",
    };
  }
  if (status === "completed") {
    return {
      label: "Completed",
      color: "var(--ink-3)",
      border: "var(--line)",
    };
  }
  return {
    label: status,
    color: "var(--ink-3)",
    border: "var(--line)",
  };
}

function paymentFooter(booking: PassengerBookingV3): {
  text: string;
  tone: "muted" | "warn" | "ok";
} {
  const amount =
    booking.passenger_amount_eur ?? booking.flight.price_per_passenger_eur;
  const seatLine = `1 seat · €${Number(amount).toFixed(0)}`;

  if (booking.status === "confirmed" && booking.paid_at) {
    return { text: `${seatLine} · Escrow held ✓`, tone: "ok" };
  }
  if (booking.status === "accepted") {
    return { text: `${seatLine} · Pay to confirm`, tone: "warn" };
  }
  if (booking.status === "pending") {
    return { text: `${seatLine} · Awaiting pilot`, tone: "warn" };
  }
  return { text: seatLine, tone: "muted" };
}

export function PassengerBookingCardV3({
  booking,
  currentUserId,
  compact,
}: {
  booking: PassengerBookingV3;
  currentUserId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const f = booking.flight;
  const badge = statusBadge(booking.status);
  const footer = paymentFooter(booking);
  const pilotName = f.pilot
    ? `${f.pilot.first_name ?? ""} ${f.pilot.last_name ?? ""}`.trim()
    : "Pilot";
  const depCity = f.departure ? airfieldCityName(f.departure.name) : "—";
  const arrCity = f.arrival ? airfieldCityName(f.arrival.name) : "—";
  const aircraftLabel = f.aircraft
    ? `${f.aircraft.model ?? "Aircraft"}${f.aircraft.registration ? `, ${f.aircraft.registration}` : ""}`
    : "Aircraft TBD";

  const canCancel = ["pending", "accepted", "confirmed"].includes(booking.status);
  const canPay = booking.status === "accepted";
  const refundEligible =
    booking.status === "confirmed" &&
    passengerRefundEligible(f.flight_date);
  const showChat = !compact && ["accepted", "confirmed", "completed"].includes(booking.status);

  return (
    <article
      id={`booking-${booking.id}`}
      className="scroll-mt-24 rounded-xl border p-5"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className="text-[1.2rem] font-semibold tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
          >
            {f.departure?.icao_code ?? "—"} → {f.arrival?.icao_code ?? "—"}
          </p>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--ink-3)" }}>
            {depCity} to {arrCity}
          </p>
        </div>
        <span
          className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{ color: badge.color, borderColor: badge.border }}
        >
          {badge.label}
        </span>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--ink-3)" }}
          >
            Date & time
          </p>
          <p className="mt-1 text-[14px] font-medium" style={{ color: "var(--ink)" }}>
            {formatFlightDateTime(f.flight_date, f.departure_time)}
          </p>
        </div>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--ink-3)" }}
          >
            Pilot
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="flex size-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: "var(--primary-v2)" }}
            >
              {pilotInitials(f.pilot?.first_name ?? null, f.pilot?.last_name ?? null)}
            </span>
            <div>
              <p className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                {pilotName}
              </p>
              {f.pilot?.rating != null ? (
                <p className="text-[12px]" style={{ color: "var(--sun)" }}>
                  ★ {f.pilot.rating.toFixed(2)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--ink-3)" }}
          >
            Aircraft
          </p>
          <p className="mt-1 text-[14px] font-medium" style={{ color: "var(--ink)" }}>
            {aircraftLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <p
          className="text-[13px] font-medium"
          style={{
            color:
              footer.tone === "warn"
                ? "var(--sun)"
                : footer.tone === "ok"
                  ? "var(--ink-2)"
                  : "var(--ink-3)",
          }}
        >
          {footer.text}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {showChat ? (
            <a
              href={`#booking-${booking.id}-chat`}
              className="text-[13px] font-medium no-underline"
              style={{ color: "var(--primary-v2)" }}
            >
              Message pilot
            </a>
          ) : null}
          {canPay ? (
            <button
              type="button"
              disabled={pending}
              className="btn-v2-primary rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-50"
              style={{ border: "none", cursor: "pointer" }}
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
              Pay now
            </button>
          ) : null}
          <Link
            href={`/flights/${f.id}`}
            className="btn-v2-primary inline-flex rounded-lg px-4 py-2 text-[13px] font-semibold no-underline"
          >
            View details
          </Link>
          {canCancel && !compact ? (
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
      </div>

      {showChat ? (
        <div id={`booking-${booking.id}-chat`} className="mt-4 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          <BookingChatSection
            bookingId={booking.id}
            status={booking.status}
            currentUserId={currentUserId}
            viewerRole="passenger"
          />
        </div>
      ) : null}
    </article>
  );
}
