import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Payment successful — Gallebo" };

export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Payment received</h1>
      <p className="text-muted-foreground">
        Your booking is being confirmed. You will receive an email shortly once
        payment is verified.
        {sessionId ? (
          <>
            <br />
            <span className="text-xs">Reference: {sessionId}</span>
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/passenger/bookings"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          My bookings
        </Link>
        <Link
          href={`/flights/${id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to flight
        </Link>
      </div>
    </div>
  );
}
