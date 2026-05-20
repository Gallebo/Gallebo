import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PilotDocumentRenewalForm } from "@/components/pilot/pilot-document-renewal-form";
import { requirePilot } from "@/lib/auth/rbac";
import { daysUntilIsoDate, isExpiryWarning } from "@/lib/pilot/review-stats";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pilot documents — Gallebo" };

export default async function PilotDocumentsPage() {
  const { user } = await requirePilot();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();

  const { data: pilotProfile } = await supabase
    .from("pilot_profiles")
    .select("license_expires_at, medical_expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: recentDocs } = await supabase
    .from("documents")
    .select("id, type, uploaded_at, review_status, expires_at")
    .eq("user_id", user.id)
    .in("type", ["ppl_license", "lapl_license", "medical_certificate"])
    .order("uploaded_at", { ascending: false })
    .limit(12);

  const licDays = daysUntilIsoDate(pilotProfile?.license_expires_at ?? null);
  const medDays = daysUntilIsoDate(pilotProfile?.medical_expires_at ?? null);
  const licWarn = isExpiryWarning(licDays);
  const medWarn = isExpiryWarning(medDays);

  return (
    <div className="max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Verification status</CardTitle>
          <CardDescription>Current platform status.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="capitalize">{profile?.status ?? "unknown"}</p>
        </CardContent>
      </Card>

      <Card className={licWarn || medWarn ? "border-destructive/50" : ""}>
        <CardHeader>
          <CardTitle>Licence &amp; medical</CardTitle>
          <CardDescription>Dates saved on your pilot profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">PPL / LAPL expiry</span>
            <span>
              {pilotProfile?.license_expires_at ?? "—"}
              {licWarn ? (
                <span className="ml-2 text-destructive">(within 30 days)</span>
              ) : null}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Medical expiry</span>
            <span>
              {pilotProfile?.medical_expires_at ?? "—"}
              {medWarn ? (
                <span className="ml-2 text-destructive">(within 30 days)</span>
              ) : null}
            </span>
          </div>
          {(licWarn || medWarn) && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-destructive">
              At least one document expires within 30 days. Upload renewed files below.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent uploads</CardTitle>
          <CardDescription>Latest pilot documents you submitted.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentDocs && recentDocs.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {recentDocs.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0"
                >
                  <span className="font-mono text-xs">{d.type}</span>
                  <span className="text-muted-foreground">{d.review_status}</span>
                  <span className="text-xs text-muted-foreground">
                    {d.uploaded_at?.slice(0, 10)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No documents found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload renewals</CardTitle>
          <CardDescription>
            Submit new licence and medical files. Admin will review pending uploads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PilotDocumentRenewalForm />
        </CardContent>
      </Card>
    </div>
  );
}
