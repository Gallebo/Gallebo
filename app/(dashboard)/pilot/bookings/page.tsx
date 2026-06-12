import { BookingConversationsAccordion } from "@/components/bookings/BookingConversationsAccordion";
import { PilotBookingCard } from "@/components/bookings/pilot-booking-card";
import { PilotBookingRequestRow } from "@/components/pilot/pilot-booking-request-row";
import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { requirePilot } from "@/lib/auth/rbac";
import {
  getPilotBookingRequests,
  getPilotManageableBookings,
} from "@/lib/pilot/queries";

export const metadata = { title: "Booking requests — Gallebo" };

export default async function PilotBookingsPage() {
  const { user } = await requirePilot();
  const [requests, activeBookings] = await Promise.all([
    getPilotBookingRequests(user.id),
    getPilotManageableBookings(user.id),
  ]);

  return (
    <div className="space-y-10">
      <PilotPageHeader
        eyebrow="Incoming"
        title="Booking requests"
        description="Passengers requesting seats on your posted flights. 48-hour response window."
      />

      {requests.length > 0 ? (
        <div className="flex flex-col gap-4">
          {requests.map((b) => (
            <PilotBookingRequestRow key={b.id} booking={b} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl border px-6 py-12 text-center"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          <p
            className="text-[1.15rem] font-medium"
            style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
          >
            No pending requests
          </p>
          <p className="mt-2 text-[14px]" style={{ color: "var(--ink-3)" }}>
            When passengers request a seat, they will appear here.
          </p>
        </div>
      )}

      <section>
        <PilotPageHeader
          eyebrow="Active bookings"
          title="Passenger conversations"
          description="Chat and contact details are available for accepted, confirmed, and completed bookings."
        />

        {activeBookings.length > 0 ? (
          <BookingConversationsAccordion items={activeBookings}>
            {(booking, accordion) => (
              <PilotBookingCard
                booking={booking}
                currentUserId={user.id}
                accordion={accordion}
              />
            )}
          </BookingConversationsAccordion>
        ) : (
          <p className="text-[14px]" style={{ color: "var(--ink-3)" }}>
            No active bookings with chat yet. Accept a request to start messaging.
          </p>
        )}
      </section>
    </div>
  );
}
