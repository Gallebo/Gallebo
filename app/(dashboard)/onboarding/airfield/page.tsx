import { AirfieldOnboardingForm } from "@/components/onboarding/airfield-onboarding-form";
import { requireUser } from "@/lib/auth/rbac";
import { redirectVerifiedPassengerFromLegacyOnboarding } from "@/lib/onboarding/guards";

export const metadata = { title: "Airfield operator — Gallebo" };

export default async function AirfieldOnboardingPage() {
  await requireUser();
  await redirectVerifiedPassengerFromLegacyOnboarding();
  return <AirfieldOnboardingForm />;
}
