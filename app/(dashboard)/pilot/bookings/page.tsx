import { PilotBookingRequestRow } from "@/components/pilot/pilot-booking-request-row";
import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { requirePilot } from "@/lib/auth/rbac";
import { getPilotBookingRequests } from "@/lib/pilot/queries";

export const metadata = { title: "Booking requests — Gallebo" };

export default async function PilotBookingsPage() {
  const { user } = await requirePilot();
  const requests = await getPilotBookingRequests(user.id);

  return (
    <div>
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
    </div>
  );
}
