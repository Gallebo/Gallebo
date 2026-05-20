import { AirfieldPhotosManager } from "@/components/airfield/airfield-photos-manager";
import {
  getOperatorAirfieldForUser,
  requireAirfieldOperator,
} from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Airfield photos — Gallebo" };

export default async function AirfieldPhotosPage() {
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
  const { data: photos } = await supabase
    .from("airfield_photos")
    .select("*")
    .eq("airfield_id", airfield.id)
    .order("sort_order");

  return <AirfieldPhotosManager photos={photos ?? []} />;
}
