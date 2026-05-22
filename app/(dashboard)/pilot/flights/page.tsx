import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { FLIGHT_TYPE_LABELS } from "@/lib/flights/constants";
import { requirePilot } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My flights — Gallebo" };

export default async function PilotFlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string }>;
}) {
  const { user } = await requirePilot();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: flights } = await supabase
    .from("flights")
    .select("id, flight_type, flight_date, status, price_per_passenger_eur, passenger_seats")
    .eq("pilot_user_id", user.id)
    .order("flight_date", { ascending: false });

  const publishedIds = (flights ?? [])
    .filter((f) => f.status === "published")
    .map((f) => f.id);

  const { data: bookings } =
    publishedIds.length > 0
      ? await supabase
          .from("flight_booking_requests")
          .select("flight_id")
          .in("flight_id", publishedIds)
          .in("status", ["pending", "accepted", "confirmed"])
      : { data: [] as { flight_id: string }[] };

  const pendingByFlight = new Map<string, number>();
  for (const b of bookings ?? []) {
    pendingByFlight.set(
      b.flight_id,
      (pendingByFlight.get(b.flight_id) ?? 0) + 1,
    );
  }

  return (
    <div className="space-y-6">
      {params.published ? (
        <p className="rounded-md border border-green-600/30 bg-green-600/10 px-4 py-2 text-sm text-green-800 dark:text-green-200">
          Flight published successfully.{" "}
          <Link href={`/flights/${params.published}`} className="underline">
            View listing
          </Link>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Publish cost-sharing flights for passengers to discover.
        </p>
        <div className="flex gap-2">
          <Link
            href="/pilot/bookings"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
          >
            Booking requests
          </Link>
          <Link
            href="/pilot/flights/new"
            className={cn(buttonVariants({ variant: "default" }), "inline-flex")}
          >
            Publish new flight
          </Link>
        </div>
      </div>

      {flights && flights.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {flights.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium capitalize">{f.status}</p>
                <p className="text-sm text-muted-foreground">
                  {FLIGHT_TYPE_LABELS[f.flight_type]} · {f.flight_date} · €
                  {Number(f.price_per_passenger_eur).toFixed(2)} / seat ·{" "}
                  {f.status === "published"
                    ? `${pendingByFlight.get(f.id) ?? 0}/${f.passenger_seats} seats booked`
                    : `${f.passenger_seats} seats`}
                </p>
              </div>
              <div className="flex gap-2">
                {f.status === "published" ? (
                  <Link
                    href={`/flights/${f.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    View
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No flights yet.</p>
      )}
    </div>
  );
}
