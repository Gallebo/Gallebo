import { AdminBarChart } from "@/components/admin/admin-bar-chart";
import { AdminMetricTile } from "@/components/admin/admin-metric-tile";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import {
  getAveragePilotRating,
  getCurrentMonthGmv,
  getFlightsCompletedThisMonth,
  getPlatformMetrics,
  getRevenueByMonth,
  getUsersJoinedThisWeek,
  getVerifiedPilotsCount,
  monthOverMonthGrowth,
} from "@/lib/admin/metrics";
import { getRecentFlights } from "@/lib/admin/queries";

export const metadata = { title: "Admin Overview — Gallebo" };

function formatEur(v: number) {
  if (v >= 1_000) return `€${(v / 1_000).toFixed(1)}k`;
  return `€${Math.round(v)}`;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default async function AdminOverviewPage() {
  const [
    metrics,
    revenue,
    monthGmv,
    verifiedPilots,
    joinedThisWeek,
    flightsThisMonth,
    avgRating,
    recentFlights,
  ] = await Promise.all([
    getPlatformMetrics(),
    getRevenueByMonth(5),
    getCurrentMonthGmv(),
    getVerifiedPilotsCount(),
    getUsersJoinedThisWeek(),
    getFlightsCompletedThisMonth(),
    getAveragePilotRating(),
    getRecentFlights(4),
  ]);

  const growth = monthOverMonthGrowth(revenue);
  const monthLabel = MONTH_NAMES[new Date().getMonth()];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Admin overview"
        title="Platform status"
        description="All systems operational."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminMetricTile
          label="Total users"
          value={metrics.totalUsers.toLocaleString()}
          hint={joinedThisWeek > 0 ? `+${joinedThisWeek} this week` : undefined}
        />
        <AdminMetricTile
          label="Active pilots"
          value={verifiedPilots.toLocaleString()}
          hint="KYC-verified, active"
          tone="blue"
        />
        <AdminMetricTile
          label="KYC pendings"
          value={metrics.pendingKyc}
          hint="Awaiting review"
          tone="orange"
        />
        <AdminMetricTile
          label={`Flights (${monthLabel})`}
          value={flightsThisMonth}
          hint={growth !== null ? `+${Math.max(growth, 0)}% vs prior month GMV` : undefined}
          tone="green"
        />
        <AdminMetricTile
          label={`GMV (${monthLabel})`}
          value={formatEur(monthGmv.gmv)}
          hint={growth !== null ? `+${growth}% vs prior month` : undefined}
        />
        <AdminMetricTile
          label="Avg. rating"
          value={avgRating !== null ? avgRating.toFixed(2) : "—"}
          hint={avgRating !== null ? "★ Across all pilots" : "No reviews yet"}
        />
      </div>

      <AdminBarChart
        data={revenue.map((d) => ({ label: d.month, value: Math.round(d.gmv) }))}
        title="GMV monthly (€)"
        growthLabel={growth !== null ? `↑ ${growth}% vs prior month` : undefined}
      />

      <section className="space-y-4">
        <h2 className="text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
          Recent flights
        </h2>
        <div
          className="overflow-hidden rounded-2xl"
          style={{ border: "1px solid var(--line)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--line)",
                    background: "var(--surface-alt)",
                  }}
                >
                  {["ROUTE", "DATE", "PILOT", "PAX", "REVENUE", "STATUS"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ background: "var(--surface)" }}>
                {recentFlights.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-[14px]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      No flights yet.
                    </td>
                  </tr>
                ) : (
                  recentFlights.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom:
                          i < recentFlights.length - 1
                            ? "1px solid var(--line)"
                            : "none",
                      }}
                    >
                      <td className="px-5 py-4 text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                        {row.route}
                      </td>
                      <td className="px-5 py-4 text-[13px]" style={{ color: "var(--ink-3)" }}>
                        {row.dateLabel}
                      </td>
                      <td className="px-5 py-4 text-[14px]" style={{ color: "var(--ink)" }}>
                        {row.pilotName}
                      </td>
                      <td className="px-5 py-4 text-[14px]" style={{ color: "var(--ink)" }}>
                        {row.pax}
                      </td>
                      <td className="px-5 py-4 text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                        €{row.revenueEur}
                      </td>
                      <td className="px-5 py-4">
                        <AdminStatusPill variant={row.statusVariant}>
                          {row.statusLabel}
                        </AdminStatusPill>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
