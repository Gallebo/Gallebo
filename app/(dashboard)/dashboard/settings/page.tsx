import { DeleteAccountForm } from "@/components/auth/delete-account-form";
import { requireUser } from "@/lib/auth/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Settings — Gallebo" };

export default async function SettingsPage() {
  await requireUser();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete your account, documents, and stored payout data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
