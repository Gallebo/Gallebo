import Link from "next/link";

import { PilotBookingCard } from "@/components/bookings/pilot-booking-card";
import { getPilotBookings } from "@/lib/bookings/queries";
import { requirePilot } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkFlightCompleteButton } from "@/components/bookings/mark-flight-complete-button";

export const metadata = { title: "Bookings — Pilot — Gallebo" };

export default async function PilotBookingsPage() {
  const { user } = await requirePilot();
  const { bookings, weightByFlight } = await getPilotBookings(user.id);

  const supabase = await createClient();
  const { data: publishedFlights } = await supabase
    .from("flights")
    .select("id, flight_date, flight_type")
    .eq("pilot_user_id", user.id)
    .eq("status", "published")
    .order("flight_date", { ascending: true });

  const pending = bookings.filter((b) => b.status === "pending");
  const active = bookings.filter((b) =>
    ["accepted", "confirmed"].includes(b.status),
  );
  const past = bookings.filter((b) =>
    ["completed", "cancelled", "rejected", "expired"].includes(b.status),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Booking requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accept or reject passenger requests within 48 hours. Mark flights complete
          after they land to trigger payouts.
        </p>
      </div>

      {(publishedFlights ?? []).length > 0 ? (
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="font-medium">Mark flight complete</h2>
          <p className="text-sm text-muted-foreground">
            Triggers passenger notifications and schedules IBAN payouts (immediate if
            you have 5+ reviews ≥4.0, otherwise after 24h).
          </p>
          <ul className="space-y-2">
            {publishedFlights!.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  {f.flight_date} · {f.flight_type}
                </span>
                <MarkFlightCompleteButton flightId={f.id} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          Pending requests ({pending.length})
        </h2>
        {pending.length > 0 ? (
          <ul className="space-y-4">
            {pending.map((b) => (
              <PilotBookingCard
                key={b.id}
                booking={b}
                weightWarning={weightByFlight.get(b.flight.id) ?? null}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Active bookings</h2>
        {active.length > 0 ? (
          <ul className="space-y-4">
            {active.map((b) => (
              <PilotBookingCard
                key={b.id}
                booking={b}
                weightWarning={weightByFlight.get(b.flight.id) ?? null}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No active confirmed bookings.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">History</h2>
        {past.length > 0 ? (
          <ul className="space-y-4">
            {past.map((b) => (
              <PilotBookingCard key={b.id} booking={b} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No past bookings.</p>
        )}
      </section>

      <Link
        href="/pilot/flights"
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        My flights
      </Link>
    </div>
  );
}
