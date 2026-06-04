import { BUCKET_BY_TYPE } from "@/lib/documents/constants";
import {
  adminDocumentLinkLabel,
  formatDiditStatus,
  isDiditApproved,
  isPilotProfessionalDocument,
} from "@/lib/admin/didit";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentType } from "@/lib/types/profile";

type VerificationRequest = {
  id: string;
  user_id: string;
  requested_role: string | null;
  didit_status: string | null;
  auto_approved: boolean | null;
};

export async function VerificationReviewPanel({
  request,
}: {
  request: VerificationRequest;
}) {
  const admin = createAdminClient();
  const role = request.requested_role ?? "passenger";
  const isPassenger = role === "passenger";
  const isPilot = role === "pilot";
  const diditApproved = isDiditApproved(request.didit_status);

  const signedUrls: { type: string; label: string; url: string }[] = [];

  if (isPilot) {
    const { data: documents } = await admin
      .from("documents")
      .select("type, storage_path")
      .eq("user_id", request.user_id)
      .in("type", ["ppl_license", "lapl_license", "medical_certificate"]);

    for (const doc of documents ?? []) {
      if (!isPilotProfessionalDocument(doc.type)) continue;
      const bucket = BUCKET_BY_TYPE[doc.type as DocumentType];
      const { data } = await admin.storage
        .from(bucket)
        .createSignedUrl(doc.storage_path, 300);
      if (data?.signedUrl) {
        signedUrls.push({
          type: doc.type,
          label: adminDocumentLinkLabel(doc.type),
          url: data.signedUrl,
        });
      }
    }

    const order = ["ppl_license", "lapl_license", "medical_certificate"];
    signedUrls.sort(
      (a, b) => order.indexOf(a.type) - order.indexOf(b.type)
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>
            {role} — {request.id.slice(0, 8)}
          </span>
          {isPassenger && (request.auto_approved || diditApproved) ? (
            <AdminStatusPill variant="completed">Auto-approved (Didit)</AdminStatusPill>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1">
          <p>
            <span className="font-medium text-foreground">Didit KYC status:</span>{" "}
            {formatDiditStatus(request.didit_status)}
          </p>
          {request.auto_approved ? (
            <p className="text-muted-foreground">Didit auto-approved: yes</p>
          ) : null}
        </div>

        {isPilot && diditApproved ? (
          <p
            className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
          >
            Identity verified via Didit KYC. Review only professional documents below.
          </p>
        ) : null}

        {isPassenger ? (
          <p className="text-muted-foreground">
            No documents to review. Passenger identity is handled entirely through Didit KYC.
          </p>
        ) : null}

        {isPilot ? (
          <div className="space-y-2">
            <p className="font-medium text-foreground">Professional documents</p>
            {signedUrls.length > 0 ? (
              <ul className="space-y-2">
                {signedUrls.map((d) => (
                  <li key={d.type}>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {d.label} (5 min link)
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                No licence or medical certificate uploaded yet.
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
