"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
] as const;

export type AdminBookingTabId = (typeof TABS)[number]["id"];

export function AdminBookingTabs() {
  const sp = useSearchParams();
  const current = (sp.get("status") as AdminBookingTabId) || "all";

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = current === tab.id;
        const href =
          tab.id === "all" ? "/admin/bookings" : `/admin/bookings?status=${tab.id}`;
        return (
          <Link
            key={tab.id}
            href={href}
            className="rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors no-underline"
            style={{
              borderColor: active ? "var(--coral)" : "var(--line)",
              background: active ? "color-mix(in srgb, var(--coral) 12%, transparent)" : "var(--surface)",
              color: active ? "var(--coral)" : "var(--ink-2)",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
