import { AdminBarChart } from "@/components/admin/admin-bar-chart";
import { PilotMetricCard } from "@/components/pilot/pilot-metric-card";
import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { requirePilot } from "@/lib/auth/rbac";
import { getPilotEarningsSummary } from "@/lib/pilot/queries";

export const metadata = { title: "Earnings — Gallebo" };

export default async function PilotEarningsPage() {
  const { user } = await requirePilot();
  const earnings = await getPilotEarningsSummary(user.id);

  const sinceYear = new Date().getFullYear() - 2;

  return (
    <div>
      <PilotPageHeader
        eyebrow="EASA Part-NCO"
        title="Earnings"
        description="Cost-sharing recoupment. Your share equals each passenger's share — no markup allowed."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <PilotMetricCard
          label="Total recouped"
          value={`€${earnings.totalRecouped.toLocaleString()}`}
          sub={`Since ${sinceYear}`}
        />
        <PilotMetricCard
          label="This month"
          value={`€${earnings.thisMonth.toLocaleString()}`}
          sub={`${earnings.thisMonthFlights} completed flight${earnings.thisMonthFlights === 1 ? "" : "s"}`}
        />
        <PilotMetricCard
          label="Avg / flight"
          value={`€${earnings.avgPerFlight}`}
          sub={`Across ${earnings.completedFlights} flights`}
          valueColor="var(--ink)"
        />
      </div>

      <AdminBarChart
        data={earnings.monthly}
        title="Monthly breakdown (€)"
        valuePrefix="€"
        accent="primary"
        height={160}
      />

      <div
        className="mt-8 flex gap-4 rounded-xl border p-5"
        style={{
          borderColor: "color-mix(in srgb, var(--primary-v2) 25%, transparent)",
          background: "var(--primary-soft)",
        }}
      >
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-[14px] font-bold"
          style={{ background: "var(--primary-v2)", color: "var(--primary-ink)" }}
        >
          i
        </div>
        <div>
          <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
            EASA compliance
          </p>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            Formula locked at posting time per EU Reg. 965/2012, Part-NCO. Your share equals
            the per-seat cost. No markup allowed.
          </p>
        </div>
      </div>
    </div>
  );
}
