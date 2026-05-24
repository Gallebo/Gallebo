import { AdminBarChart } from "@/components/admin/admin-bar-chart";
import { AdminMetricTile } from "@/components/admin/admin-metric-tile";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCurrentMonthGmv,
  getRevenueByMonth,
  monthOverMonthGrowth,
} from "@/lib/admin/metrics";

export const metadata = { title: "Revenue — Admin — Gallebo" };

function formatEur(v: number) {
  if (v >= 1_000) return `€${(v / 1_000).toFixed(1)}k`;
  return `€${Math.round(v)}`;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default async function AdminRevenuePage() {
  const admin = createAdminClient();
  const monthLabel = MONTH_NAMES[new Date().getMonth()];

  const [monthGmv, revenue, { data: pendingPayouts }] = await Promise.all([
    getCurrentMonthGmv(),
    getRevenueByMonth(5),
    admin
      .from("flight_booking_requests")
      .select("passenger_amount_eur")
      .eq("payout_status", "pending")
      .not("paid_at", "is", null),
  ]);

  const growth = monthOverMonthGrowth(revenue);
  const escrowHeld = (pendingPayouts ?? []).reduce(
    (sum, row) => sum + Number(row.passenger_amount_eur ?? 0),
    0
  );
  const activeBookings = pendingPayouts?.length ?? 0;

  const pilotPayouts =
    monthGmv.gmv > 0 ? Math.max(monthGmv.gmv - monthGmv.fee, 0) : 0;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Financials"
        title="Revenue"
        description="Platform fee: 3% of gross passenger payments. Held via Stripe Connect."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricTile
          label={`GMV (${monthLabel})`}
          value={formatEur(monthGmv.gmv)}
          hint="Gross passenger payments"
          tone="blue"
        />
        <AdminMetricTile
          label={`Platform fee (${monthLabel})`}
          value={formatEur(monthGmv.fee)}
          hint="3% of GMV"
          tone="green"
        />
        <AdminMetricTile
          label="Stripe payouts"
          value={formatEur(pilotPayouts)}
          hint="Disbursed to pilots"
        />
      </div>

      <AdminBarChart
        data={revenue.map((d) => ({ label: d.month, value: Math.round(d.gmv) }))}
        title="GMV monthly breakdown (€)"
        growthLabel={growth !== null ? `↑ ${growth}% vs prior month` : undefined}
      />

      <div
        className="flex flex-wrap items-start gap-4 rounded-2xl px-6 py-5"
        style={{
          background: "var(--surface)",
          border: "1px solid color-mix(in srgb, var(--primary-v2) 25%, var(--line))",
        }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "var(--primary-soft)", color: "var(--primary-v2)" }}
          aria-hidden
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3l7 4v6c0 4.2-3 7.8-7 9-4-1.2-7-4.8-7-9V7l7-4z" />
          </svg>
        </div>
        <div>
          <p className="text-[14px] font-semibold" style={{ color: "var(--primary-v2)" }}>
            Stripe Connect escrow status
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--ink-2)" }}>
            {formatEur(escrowHeld)} held in escrow across {activeBookings} active booking
            {activeBookings === 1 ? "" : "s"}. Funds release to pilots within 24 hours of flight
            completion.
          </p>
        </div>
      </div>
    </div>
  );
}
