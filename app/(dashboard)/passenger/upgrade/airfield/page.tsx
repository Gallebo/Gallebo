import { AirfieldUpgradeForm } from "@/components/onboarding/airfield-upgrade-form";
import { requireVerifiedPassengerForUpgrade } from "@/lib/onboarding/guards";

export const metadata = { title: "Upgrade to airfield operator — Gallebo" };

export default async function PassengerAirfieldUpgradePage() {
  await requireVerifiedPassengerForUpgrade();
  return <AirfieldUpgradeForm />;
}
