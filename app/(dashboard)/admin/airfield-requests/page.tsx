import Link from "next/link";

import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import {
  getAirfieldOperatorRequests,
  type AirfieldOperatorRequestRow,
} from "@/lib/admin/queries";
import { privatePageRobots } from "@/lib/seo/site";

export const metadata = {
  title: "Airfield Requests — Admin — Gallebo",
  robots: privatePageRobots,
};

export default async function AdminAirfieldRequestsPage() {
  const requests = await getAirfieldOperatorRequests();
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const columns = [
    {
      key: "applicant",
      label: "Applicant",
      render: (row: AirfieldOperatorRequestRow) => (
        <div>
          <div className="font-medium" style={{ color: "var(--ink)" }}>
            {row.applicantName}
          </div>
          <div className="text-[12px]" style={{ color: "var(--ink-3)" }}>
            {row.email}
          </div>
        </div>
      ),
    },
    {
      key: "icao",
      label: "ICAO",
      mono: true,
      render: (row: AirfieldOperatorRequestRow) => row.icaoCode,
    },
    {
      key: "airfield",
      label: "Airfield",
      hideOnMobile: true,
      render: (row: AirfieldOperatorRequestRow) => row.airfieldName,
    },
    {
      key: "submitted",
      label: "Submitted",
      muted: true,
      hideOnMobile: true,
      render: (row: AirfieldOperatorRequestRow) => row.submittedLabel,
    },
    {
      key: "status",
      label: "Status",
      render: (row: AirfieldOperatorRequestRow) => (
        <AdminStatusPill
          variant={
            row.statusVariant === "kyc"
              ? "kyc"
              : row.statusVariant === "completed"
                ? "completed"
                : "scheduled"
          }
        >
          {row.status}
        </AdminStatusPill>
      ),
    },
    {
      key: "review",
      label: "",
      render: (row: AirfieldOperatorRequestRow) => (
        <Link
          href={`/admin/airfield/${row.id}`}
          className="text-[13px] font-medium hover:underline"
          style={{ color: "var(--ink-2)", textDecoration: "none" }}
        >
          Review
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Airfield operators"
        title="Airfield requests"
        description="Operator onboarding requests — review licence, link or create airfields, and assign operator access."
        trailing={
          pendingCount > 0 ? (
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{
                background: "color-mix(in srgb, var(--coral) 14%, transparent)",
                color: "var(--coral)",
              }}
            >
              {pendingCount} pending
            </span>
          ) : null
        }
      />

      <AdminDataTable<AirfieldOperatorRequestRow>
        columns={columns}
        rows={requests}
        emptyText="No airfield operator requests yet."
      />
    </div>
  );
}
