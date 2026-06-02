import Link from "next/link";

import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { requirePilot } from "@/lib/auth/rbac";
import {
  formatPeriodLabel,
  resolveTransactionPeriod,
} from "@/lib/pilot/transaction-period";
import {
  formatEur,
  getPilotTransactionReport,
  getPilotTransactionYears,
} from "@/lib/pilot/transactions";

export const metadata = { title: "Transactions — Gallebo" };

export default async function PilotTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; from?: string; to?: string }>;
}) {
  const { user } = await requirePilot();
  const params = await searchParams;
  const period = resolveTransactionPeriod(params);
  const [report, years] = await Promise.all([
    getPilotTransactionReport(user.id, period),
    getPilotTransactionYears(user.id),
  ]);

  const periodLabel = formatPeriodLabel(period.from, period.to);
  const selectedYear =
    params.from && params.to
      ? ""
      : String(
          params.year
            ? Number.parseInt(params.year, 10)
            : new Date().getFullYear(),
        );

  const pdfHref = `/api/pilot/transactions/report?${new URLSearchParams(
    params.from && params.to
      ? { from: period.from, to: period.to }
      : { year: selectedYear || String(new Date().getFullYear()) },
  ).toString()}`;

  return (
    <div>
      <PilotPageHeader
        eyebrow="EASA Part-NCO"
        title="Transactions"
        description="Cost-sharing transaction summary for your records. Download a PDF report for any period."
      />

      <form
        method="GET"
        className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border p-5"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <div className="space-y-1">
          <label
            htmlFor="year"
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--ink-3)" }}
          >
            Year
          </label>
          <select
            id="year"
            name="year"
            defaultValue={selectedYear}
            className="rounded-lg border px-3 py-2 text-[14px]"
            style={{
              borderColor: "var(--line)",
              background: "var(--bg)",
              color: "var(--ink)",
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="from"
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--ink-3)" }}
          >
            From
          </label>
          <input
            type="date"
            id="from"
            name="from"
            defaultValue={params.from ?? ""}
            className="rounded-lg border px-3 py-2 text-[14px]"
            style={{
              borderColor: "var(--line)",
              background: "var(--bg)",
              color: "var(--ink)",
            }}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="to"
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--ink-3)" }}
          >
            To
          </label>
          <input
            type="date"
            id="to"
            name="to"
            defaultValue={params.to ?? ""}
            className="rounded-lg border px-3 py-2 text-[14px]"
            style={{
              borderColor: "var(--line)",
              background: "var(--bg)",
              color: "var(--ink)",
            }}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-[14px] font-semibold text-white"
          style={{ background: "var(--primary-v2)" }}
        >
          Apply
        </button>
        <p className="w-full text-[12px]" style={{ color: "var(--ink-3)" }}>
          Use year only, or set custom from/to (custom range overrides year).
        </p>
      </form>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-[14px] font-medium" style={{ color: "var(--ink-2)" }}>
          Period: {periodLabel}
        </p>
        <Link
          href={pdfHref}
          className="btn-v2-coral inline-flex items-center gap-2 rounded-lg px-5 py-3 text-[14px] font-semibold no-underline"
        >
          Download PDF
        </Link>
      </div>

      {report.flights.length === 0 ? (
        <div
          className="rounded-xl border p-8 text-center text-[14px]"
          style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}
        >
          No paid bookings in this period.
        </div>
      ) : (
        <div className="space-y-3">
          {report.flights.map((row) => (
            <div
              key={row.flightId}
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                    {row.route}
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                    {row.dateLabel} · {row.passengerCount} passenger
                    {row.passengerCount === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className="text-[12px] font-semibold uppercase tracking-[0.06em]"
                  style={{
                    color:
                      row.payoutStatusLabel === "Paid"
                        ? "var(--success)"
                        : "var(--ink-2)",
                  }}
                >
                  {row.payoutStatusLabel}
                </span>
              </div>
              <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt style={{ color: "var(--ink-3)" }}>Flight cost</dt>
                  <dd className="font-medium" style={{ color: "var(--ink)" }}>
                    {formatEur(row.totalCostEur)}
                  </dd>
                </div>
                <div>
                  <dt style={{ color: "var(--ink-3)" }}>Passenger share</dt>
                  <dd className="font-medium" style={{ color: "var(--ink)" }}>
                    {formatEur(row.passengerShareEur)}
                  </dd>
                </div>
                <div>
                  <dt style={{ color: "var(--ink-3)" }}>Platform fee</dt>
                  <dd className="font-medium" style={{ color: "var(--ink)" }}>
                    {formatEur(row.platformFeeEur)}
                  </dd>
                </div>
                <div>
                  <dt style={{ color: "var(--ink-3)" }}>Net received</dt>
                  <dd className="font-medium" style={{ color: "var(--primary-v2)" }}>
                    {formatEur(row.netReceivedEur)}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}

      <div
        className="mt-8 rounded-xl border p-5"
        style={{
          borderColor: "color-mix(in srgb, var(--primary-v2) 25%, transparent)",
          background: "var(--primary-soft)",
        }}
      >
        <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
          Period totals
        </p>
        <dl className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
          <div className="flex justify-between gap-4 sm:block">
            <dt style={{ color: "var(--ink-3)" }}>Total flight costs</dt>
            <dd className="font-semibold sm:mt-1" style={{ color: "var(--ink)" }}>
              {formatEur(report.totals.totalFlightCostEur)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:block">
            <dt style={{ color: "var(--ink-3)" }}>Passenger share (gross)</dt>
            <dd className="font-semibold sm:mt-1" style={{ color: "var(--ink)" }}>
              {formatEur(report.totals.totalPassengerShareEur)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:block">
            <dt style={{ color: "var(--ink-3)" }}>Platform fee</dt>
            <dd className="font-semibold sm:mt-1" style={{ color: "var(--ink)" }}>
              {formatEur(report.totals.totalPlatformFeeEur)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:block">
            <dt style={{ color: "var(--ink-3)" }}>Net received</dt>
            <dd className="font-semibold sm:mt-1" style={{ color: "var(--primary-v2)" }}>
              {formatEur(report.totals.totalNetReceivedEur)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 sm:col-span-2 sm:block">
            <dt style={{ color: "var(--ink-3)" }}>Pilot own share (cost borne)</dt>
            <dd className="font-semibold sm:mt-1" style={{ color: "var(--ink)" }}>
              {formatEur(report.totals.totalPilotOwnShareEur)}
            </dd>
          </div>
        </dl>
      </div>

      <div
        className="mt-6 flex gap-4 rounded-xl border p-5"
        style={{
          borderColor: "color-mix(in srgb, var(--primary-v2) 25%, transparent)",
          background: "color-mix(in srgb, var(--primary-soft) 70%, transparent)",
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
            Cost-sharing notice
          </p>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            Amounts from passengers are reimbursements of direct flight costs under EASA
            Reg. 965/2012, not commercial income. Net received equals your pilot payout per
            booking. Card processing fees are borne by the platform. Consult a tax adviser for
            local treatment.
          </p>
        </div>
      </div>
    </div>
  );
}
