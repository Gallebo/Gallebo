import { Suspense } from "react";

import { AdminBookingTabs, type AdminBookingTabId } from "@/components/admin/admin-booking-tabs";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import { getAdminBookings } from "@/lib/admin/queries";

export const metadata = { title: "Bookings — Admin — Gallebo" };

const VALID_STATUSES: AdminBookingTabId[] = [
  "all",
  "pending",
  "accepted",
  "confirmed",
  "completed",
  "cancelled",
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusParam = params.status ?? "all";
  const statusFilter = VALID_STATUSES.includes(statusParam as AdminBookingTabId)
    ? statusParam
    : "all";

  const bookings = await getAdminBookings(
    statusFilter === "all" ? undefined : statusFilter,
  );

  const columns = [
    {
      key: "route",
      label: "Route",
      render: (row: (typeof bookings)[0]) => (
        <span className="font-medium" style={{ color: "var(--ink)" }}>
          {row.route}
        </span>
      ),
    },
    {
      key: "flightDate",
      label: "Flight date",
      muted: true,
      hideOnMobile: true,
      render: (row: (typeof bookings)[0]) => row.flightDateLabel,
    },
    {
      key: "passenger",
      label: "Passenger",
      render: (row: (typeof bookings)[0]) => row.passengerName,
    },
    {
      key: "pilot",
      label: "Pilot",
      hideOnMobile: true,
      render: (row: (typeof bookings)[0]) => row.pilotName,
    },
    {
      key: "amount",
      label: "Amount",
      render: (row: (typeof bookings)[0]) => (
        <span className="font-semibold">{row.amountEur}</span>
      ),
    },
    {
      key: "created",
      label: "Requested",
      muted: true,
      hideOnMobile: true,
      render: (row: (typeof bookings)[0]) => row.createdLabel,
    },
    {
      key: "status",
      label: "Status",
      render: (row: (typeof bookings)[0]) => (
        <AdminStatusPill variant={row.statusVariant}>{row.statusLabel}</AdminStatusPill>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Operations"
        title="Bookings"
        description="All flight booking requests across the platform."
      />

      <Suspense fallback={null}>
        <AdminBookingTabs />
      </Suspense>

      <AdminDataTable
        columns={columns as unknown as Parameters<typeof AdminDataTable>[0]["columns"]}
        rows={bookings as unknown as Record<string, unknown>[]}
        emptyText="No bookings match this filter."
      />
    </div>
  );
}
