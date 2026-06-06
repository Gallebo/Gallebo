import Link from "next/link";
import { notFound } from "next/navigation";

import { AirfieldActions } from "@/components/admin/airfield-actions";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import { getRegulatoryAuthority } from "@/lib/admin/airfield-review";
import { formatDiditStatus, isDiditApproved } from "@/lib/admin/didit";
import { BUCKET_BY_TYPE } from "@/lib/documents/constants";
import { privatePageRobots } from "@/lib/seo/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Airfield review",
  robots: privatePageRobots,
};

export default async function AirfieldReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("airfield_operator_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!request) notFound();

  const { data: existingAirfield } = await admin
    .from("airfields")
    .select("id, name, operator_user_id")
    .eq("icao_code", request.icao_code)
    .maybeSingle();

  const [{ data: doc }, { data: profile }, { data: verification }] =
    await Promise.all([
      admin
        .from("documents")
        .select("storage_path")
        .eq("user_id", request.user_id)
        .eq("type", "airfield_operating_license")
        .maybeSingle(),
      admin
        .from("profiles")
        .select("first_name, last_name, status")
        .eq("id", request.user_id)
        .maybeSingle(),
      admin
        .from("verification_requests")
        .select("didit_status, auto_approved, requested_role, created_at")
        .eq("user_id", request.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  let docUrl: string | null = null;
  if (doc?.storage_path) {
    const { data } = await admin.storage
      .from(BUCKET_BY_TYPE.airfield_operating_license)
      .createSignedUrl(doc.storage_path, 300);
    docUrl = data?.signedUrl ?? null;
  }

  const operatorName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Unknown operator";
  const diditApproved = isDiditApproved(verification?.didit_status);
  const authority = getRegulatoryAuthority(
    request.icao_code,
    request.location,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{request.airfield_name}</h1>
        <Link
          href="/admin/airfield-requests"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Back to requests
        </Link>
      </div>

      {existingAirfield ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          ICAO <strong>{request.icao_code}</strong> matches existing airfield{" "}
          <strong>{existingAirfield.name}</strong>
          {existingAirfield.operator_user_id
            ? " (already has an operator — approval will fail unless it is this applicant)"
            : " — approval will link this operator to the existing record."}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Operator identity
            {diditApproved ? (
              <AdminStatusPill variant="completed">Didit verified</AdminStatusPill>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-foreground">Name:</span>{" "}
            {operatorName}
          </p>
          <p>
            <span className="font-medium text-foreground">Profile status:</span>{" "}
            {profile?.status ?? "—"}
          </p>
          <p>
            <span className="font-medium text-foreground">Didit KYC status:</span>{" "}
            {formatDiditStatus(verification?.didit_status)}
          </p>
          {verification?.requested_role ? (
            <p className="text-muted-foreground">
              Verification role: {verification.requested_role}
              {verification.auto_approved ? " · auto-approved" : ""}
            </p>
          ) : null}
          {!verification ? (
            <p className="text-muted-foreground">
              No verification request on file — confirm identity separately if needed.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{request.icao_code}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{request.location}</p>
          <p>{request.contact_email}</p>
          <p>{request.contact_phone}</p>
          {authority ? (
            <p>
              <span className="font-medium text-foreground">Licence registry:</span>{" "}
              <Link
                href={authority.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {authority.label}
              </Link>
            </p>
          ) : null}
          {docUrl ? (
            <a href={docUrl} className="text-primary hover:underline">
              View licence document
            </a>
          ) : null}
          {request.admin_notes ? (
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground">
              <span className="font-medium text-foreground">Previous notes:</span>{" "}
              {request.admin_notes}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <AirfieldActions
        requestId={id}
        linkExistingAirfield={Boolean(existingAirfield)}
      />
    </div>
  );
}
