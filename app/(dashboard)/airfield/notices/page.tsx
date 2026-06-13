import { AirfieldNoticesManager } from "@/components/airfield/airfield-notices-manager";
import {
  getOperatorAirfieldForUser,
  requireAirfieldOperator,
} from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Airfield notices — Gallebo" };

export default async function AirfieldNoticesPage() {
  const { user } = await requireAirfieldOperator();
  const airfield = await getOperatorAirfieldForUser(user.id);

  if (!airfield) {
    return (
      <p className="text-muted-foreground">
        No airfield is linked to your account.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: notices } = await supabase
    .from("airfield_notices")
    .select("id, body, created_at")
    .eq("airfield_id", airfield.id)
    .order("created_at", { ascending: false });

  return <AirfieldNoticesManager notices={notices ?? []} />;
}
