import { notFound } from "next/navigation";

import { AirfieldActions } from "@/components/admin/airfield-actions";
import { BUCKET_BY_TYPE } from "@/lib/documents/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const { data: doc } = await admin
    .from("documents")
    .select("storage_path")
    .eq("user_id", request.user_id)
    .eq("type", "airfield_operating_license")
    .maybeSingle();

  let docUrl: string | null = null;
  if (doc?.storage_path) {
    const { data } = await admin.storage
      .from(BUCKET_BY_TYPE.airfield_operating_license)
      .createSignedUrl(doc.storage_path, 300);
    docUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{request.airfield_name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{request.icao_code}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{request.location}</p>
          <p>{request.contact_email}</p>
          <p>{request.contact_phone}</p>
          {docUrl ? (
            <a href={docUrl} className="text-primary hover:underline">
              View licence document
            </a>
          ) : null}
        </CardContent>
      </Card>
      <AirfieldActions requestId={id} />
    </div>
  );
}
