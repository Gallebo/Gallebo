import { notFound } from "next/navigation";

import { VerificationActions } from "@/components/admin/verification-actions";
import { BUCKET_BY_TYPE } from "@/lib/documents/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentType } from "@/lib/types/profile";

export const metadata = { title: "Review verification — Admin" };

export default async function VerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("verification_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!request) notFound();

  const { data: documents } = await admin
    .from("documents")
    .select("*")
    .eq("user_id", request.user_id);

  const signedUrls: { type: string; url: string }[] = [];
  for (const doc of documents ?? []) {
    const bucket = BUCKET_BY_TYPE[doc.type as DocumentType];
    const { data } = await admin.storage
      .from(bucket)
      .createSignedUrl(doc.storage_path, 300);
    if (data?.signedUrl) {
      signedUrls.push({ type: doc.type, url: data.signedUrl });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Verification review</h1>
      <Card>
        <CardHeader>
          <CardTitle>
            {request.requested_role} — {request.id.slice(0, 8)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>Didit status: {request.didit_status ?? "—"}</p>
          <p>Auto approved: {request.auto_approved ? "yes" : "no"}</p>
          <ul className="space-y-2">
            {signedUrls.map((d) => (
              <li key={d.type}>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View {d.type} (5 min link)
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <VerificationActions requestId={id} />
    </div>
  );
}
