"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  acceptBookingAction,
  rejectBookingAction,
} from "@/lib/bookings/actions";
import type { PilotBookingRequestRow } from "@/lib/pilot/queries";

function passengerInitials(first: string | null, last: string | null): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

function formatRequestDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function PilotBookingRequestRow({
  booking,
}: {
  booking: PilotBookingRequestRow;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const name = `${booking.passenger_first_name ?? ""} ${booking.passenger_last_name ?? ""}`.trim() || "Passenger";

  return (
    <article
      className="flex flex-col gap-4 rounded-xl border p-5 lg:flex-row lg:items-center"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ background: "var(--primary-v2)" }}
        >
          {passengerInitials(booking.passenger_first_name, booking.passenger_last_name)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
              {name}
            </p>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
              style={{ background: "var(--primary-soft)", color: "var(--primary-v2)" }}
            >
              KYC ✓
            </span>
          </div>
          <p className="mt-1 text-[13px]" style={{ color: "var(--ink-3)" }}>
            {booking.departure_icao} → {booking.arrival_icao} · {formatRequestDate(booking.flight_date)} ·{" "}
            {booking.seats} seat
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 lg:justify-end">
        <div className="text-center lg:text-right">
          <p className="text-[1.35rem] font-semibold" style={{ color: "var(--ink)" }}>
            €{booking.amount_eur.toFixed(0)}
          </p>
          <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
            {booking.relative}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            className="rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-opacity disabled:opacity-50"
            style={{
              background: "color-mix(in srgb, var(--danger) 12%, transparent)",
              color: "var(--danger)",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => {
              startTransition(async () => {
                const res = await rejectBookingAction(booking.id);
                if (res.error) alert(res.error);
                router.refresh();
              });
            }}
          >
            Decline
          </button>
          <button
            type="button"
            disabled={pending}
            className="btn-v2-primary rounded-lg px-4 py-2.5 text-[13px] font-semibold disabled:opacity-50"
            style={{ border: "none", cursor: "pointer" }}
            onClick={() => {
              startTransition(async () => {
                const res = await acceptBookingAction(booking.id);
                if (res.error) alert(res.error);
                router.refresh();
              });
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </article>
  );
}
