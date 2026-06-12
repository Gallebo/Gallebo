import Link from "next/link";
import { Suspense } from "react";

import { BookingConversationsAccordion } from "@/components/bookings/BookingConversationsAccordion";
import { PassengerBookingCardV3 } from "@/components/passenger/passenger-booking-card-v3";
import { PassengerBookingTabs } from "@/components/passenger/passenger-booking-tabs";
import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { requireVerifiedPassenger } from "@/lib/auth/rbac";
import { getPassengerBookingsV3 } from "@/lib/passenger/queries";

export const metadata = { title: "My bookings — Gallebo" };

export default async function PassengerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; cancelled?: string }>;
}) {
  const { user } = await requireVerifiedPassenger();
  const params = await searchParams;
  const tab = params.tab === "past" ? "past" : "upcoming";
  const today = new Date().toISOString().slice(0, 10);

  const all = await getPassengerBookingsV3(user.id);
  const bookings =
    tab === "upcoming"
      ? all.filter(
          (b) =>
            ["pending", "accepted", "confirmed"].includes(b.status) &&
            b.flight.flight_date >= today,
        )
      : all.filter(
          (b) =>
            b.flight.flight_date < today ||
            ["completed", "cancelled", "rejected", "expired"].includes(b.status),
        );

  return (
    <div>
      {params.cancelled ? (
        <p
          className="mb-6 rounded-lg border px-4 py-3 text-[14px]"
          style={{
            borderColor: "color-mix(in srgb, var(--sun) 35%, transparent)",
            background: "color-mix(in srgb, var(--sun) 10%, transparent)",
            color: "var(--ink-2)",
          }}
        >
          Payment was cancelled. You can pay again from an accepted booking below.
        </p>
      ) : null}

      <PilotPageHeader
        eyebrow="Bookings"
        title="My bookings"
        action={{ href: "/flights", label: "Find new flight" }}
      />

      <Suspense fallback={null}>
        <PassengerBookingTabs />
      </Suspense>

      {bookings.length > 0 ? (
        <BookingConversationsAccordion items={bookings}>
          {(booking, accordion) => (
            <PassengerBookingCardV3
              booking={booking}
              currentUserId={user.id}
              accordion={accordion}
            />
          )}
        </BookingConversationsAccordion>
      ) : (
        <p className="text-[14px]" style={{ color: "var(--ink-3)" }}>
          No {tab} bookings.{" "}
          <Link href="/flights" className="underline" style={{ color: "var(--primary-v2)" }}>
            Browse flights
          </Link>
        </p>
      )}
    </div>
  );
}
