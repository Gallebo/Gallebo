import { notFound } from "next/navigation";

import { VerificationActions } from "@/components/admin/verification-actions";
import { VerificationReviewPanel } from "@/components/admin/verification-review-panel";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("id, user_id, requested_role, didit_status, auto_approved, reviewed_at")
    .eq("id", id)
    .single();

  if (!request) notFound();

  const isPassenger = request.requested_role === "passenger";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Verification review</h1>
      <VerificationReviewPanel request={request} />
      {isPassenger ? (
        <p className="text-sm text-muted-foreground">
          Approve only if Didit KYC is satisfactory. There are no uploaded identity documents.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Approve only after reviewing the pilot licence and medical certificate. Identity is
          not reviewed here.
        </p>
      )}
      <VerificationActions requestId={id} />
    </div>
  );
}
