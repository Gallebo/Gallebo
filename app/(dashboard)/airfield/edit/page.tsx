import { AirfieldEditForm } from "@/components/airfield/airfield-edit-form";
import {
  getOperatorAirfieldForUser,
  requireAirfieldOperator,
} from "@/lib/auth/rbac";

export const metadata = { title: "Edit airfield — Gallebo" };

export default async function AirfieldEditPage() {
  const { user } = await requireAirfieldOperator();
  const airfield = await getOperatorAirfieldForUser(user.id);

  if (!airfield) {
    return (
      <p className="text-muted-foreground">
        No airfield is linked to your account.
      </p>
    );
  }

  return <AirfieldEditForm airfield={airfield} />;
}
