import Link from "next/link";

import { PassengerBookingCard } from "@/components/bookings/passenger-booking-card";
import { getPassengerBookings } from "@/lib/bookings/queries";
import { requireVerifiedPassenger } from "@/lib/auth/rbac";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "My bookings — Gallebo" };

export default async function PassengerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { user } = await requireVerifiedPassenger();
  const params = await searchParams;
  const bookings = await getPassengerBookings(user.id);

  const active = bookings.filter((b) =>
    ["pending", "accepted", "confirmed"].includes(b.status),
  );
  const past = bookings.filter((b) =>
    ["completed", "cancelled", "rejected", "expired"].includes(b.status),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track requests, payments, and completed flights.
        </p>
      </div>

      {params.cancelled ? (
        <p className="rounded-md border px-4 py-2 text-sm text-muted-foreground">
          Payment was cancelled. You can pay again from an accepted booking below.
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Active</h2>
        {active.length > 0 ? (
          <ul className="space-y-4">
            {active.map((b) => (
              <PassengerBookingCard
                key={b.id}
                booking={b}
                currentUserId={user.id}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active bookings.{" "}
            <Link href="/flights" className="underline">
              Find a flight
            </Link>
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">History</h2>
        {past.length > 0 ? (
          <ul className="space-y-4">
            {past.map((b) => (
              <PassengerBookingCard
                key={b.id}
                booking={b}
                currentUserId={user.id}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No past bookings yet.</p>
        )}
      </section>

      <Link href="/flights" className={cn(buttonVariants({ variant: "outline" }))}>
        Browse flights
      </Link>
    </div>
  );
}
