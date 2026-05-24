"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
] as const;

export function PassengerBookingTabs() {
  const sp = useSearchParams();
  const current = (sp.get("tab") as (typeof TABS)[number]["id"]) || "upcoming";

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = current === tab.id;
        return (
          <Link
            key={tab.id}
            href={`/passenger/bookings?tab=${tab.id}`}
            className="rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors no-underline"
            style={{
              borderColor: active ? "var(--primary-v2)" : "var(--line)",
              background: active ? "var(--primary-soft)" : "var(--surface)",
              color: active ? "var(--primary-v2)" : "var(--ink-2)",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
