import { createAdminClient } from "@/lib/supabase/admin";
import { SuspendPilotButton } from "@/components/admin/suspend-pilot-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Pilots — Admin" };

export default async function AdminPilotsPage() {
  const admin = createAdminClient();

  const { data: pilots } = await admin
    .from("profiles")
    .select(
      "id, first_name, last_name, status, pilot_profiles(license_expires_at, medical_expires_at)"
    )
    .eq("role", "pilot");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Verified pilots</h1>
      <div className="grid gap-4">
        {pilots?.map((pilot) => {
          const pp = Array.isArray(pilot.pilot_profiles)
            ? pilot.pilot_profiles[0]
            : pilot.pilot_profiles;
          return (
            <Card key={pilot.id}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base">
                  {pilot.first_name} {pilot.last_name}
                </CardTitle>
                <Badge>{pilot.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 pb-3 text-sm text-muted-foreground">
                <p>Licence expires: {pp?.license_expires_at ?? "—"}</p>
                <p>Medical expires: {pp?.medical_expires_at ?? "—"}</p>
                {pilot.status !== "suspended" ? (
                  <SuspendPilotButton userId={pilot.id} />
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
