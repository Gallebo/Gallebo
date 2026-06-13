import Link from "next/link";
import { Suspense } from "react";

import { PilotFlightCard } from "@/components/pilot/pilot-flight-card";
import { PilotFlightTabs } from "@/components/pilot/pilot-flight-tabs";
import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { buttonVariants } from "@/components/ui/button";
import { requirePilot } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";
import { getPilotFlightsLog } from "@/lib/pilot/queries";

export const metadata = { title: "Flight log — Gallebo" };

export default async function PilotFlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; published?: string }>;
}) {
  const { user } = await requirePilot();
  const params = await searchParams;
  const tab =
    params.tab === "past" || params.tab === "cancelled"
      ? params.tab
      : "upcoming";

  const flights = await getPilotFlightsLog(user.id, tab);

  return (
    <div>
      {params.published ? (
        <p
          className="mb-6 rounded-lg border px-4 py-3 text-[14px]"
          style={{
            borderColor: "color-mix(in srgb, var(--success) 35%, transparent)",
            background: "color-mix(in srgb, var(--success) 10%, transparent)",
            color: "var(--success)",
          }}
        >
          Flight published successfully.{" "}
          <Link href={`/flights/${params.published}`} className="font-semibold underline">
            View listing
          </Link>
        </p>
      ) : null}

      <PilotPageHeader
        eyebrow="My flights"
        title="Flight log"
        action={{ href: "/pilot/flights/new", label: "Post new flight" }}
      />

      <Suspense fallback={null}>
        <PilotFlightTabs />
      </Suspense>

      {flights.length > 0 ? (
        <div className="flex flex-col gap-3">
          {flights.map((f) => (
            <PilotFlightCard key={f.id} flight={f} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-14 text-center"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="text-[14px]" style={{ color: "var(--ink-3)" }}>
            No {tab} flights.
          </p>
          {tab === "upcoming" ? (
            <Link
              href="/pilot/flights/new"
              className={cn(buttonVariants({ variant: "default" }), "inline-flex")}
            >
              Post your first flight
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
