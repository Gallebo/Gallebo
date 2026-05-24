import { AdminDataTable } from "@/components/admin/admin-data-table";

import { AdminMetricTile } from "@/components/admin/admin-metric-tile";

import { AdminPageHeader } from "@/components/admin/admin-page-header";

import { AdminStatusPill } from "@/components/admin/admin-status-pill";

import { getFlightModerationStats, getRecentFlights } from "@/lib/admin/queries";



export const metadata = { title: "Flights — Admin — Gallebo" };



const MONTH_NAMES = [

  "Jan", "Feb", "Mar", "Apr", "May", "Jun",

  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",

];



export default async function AdminFlightsPage() {
  const monthLabel = MONTH_NAMES[new Date().getMonth()];



  const [stats, flights] = await Promise.all([

    getFlightModerationStats(),

    getRecentFlights(50),

  ]);



  const columns = [

    {

      key: "route",

      label: "Route",

      render: (row: (typeof flights)[0]) => (

        <span className="font-medium" style={{ color: "var(--ink)" }}>

          {row.route}

        </span>

      ),

    },

    {

      key: "date",

      label: "Date",

      muted: true,

      render: (row: (typeof flights)[0]) => row.dateLabel,

    },

    {

      key: "pilot",

      label: "Pilot",

      render: (row: (typeof flights)[0]) => row.pilotName,

    },

    {

      key: "pax",

      label: "Pax",

      render: (row: (typeof flights)[0]) => row.pax,

    },

    {

      key: "revenue",

      label: "Revenue",

      render: (row: (typeof flights)[0]) => (

        <span className="font-semibold">€{row.revenueEur}</span>

      ),

    },

    {

      key: "status",

      label: "Status",

      render: (row: (typeof flights)[0]) => (

        <AdminStatusPill variant={row.statusVariant}>{row.statusLabel}</AdminStatusPill>

      ),

    },

  ];



  return (

    <div className="space-y-8">

      <AdminPageHeader

        eyebrow="Flight moderation"

        title="Flights"

        description="All platform flights, EASA compliance flags, and cost-sharing status."

      />



      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <AdminMetricTile label="Active now" value={stats.active} tone="green" />

        <AdminMetricTile label="Scheduled" value={stats.scheduled} tone="blue" />

        <AdminMetricTile

          label={`Completed (${monthLabel})`}

          value={stats.completedMonth}

        />

        <AdminMetricTile label="Flagged" value={stats.flagged} tone="orange" />

      </div>



      <AdminDataTable

        columns={columns as unknown as Parameters<typeof AdminDataTable>[0]["columns"]}

        rows={flights as unknown as Record<string, unknown>[]}

        emptyText="No flights yet."

      />

    </div>

  );

}

