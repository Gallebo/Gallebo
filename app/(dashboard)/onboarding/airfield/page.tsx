import { AirfieldOnboardingForm } from "@/components/onboarding/airfield-onboarding-form";
import { requireUser } from "@/lib/auth/rbac";

export const metadata = { title: "Airfield operator — Gallebo" };

export default async function AirfieldOnboardingPage() {
  await requireUser();
  return <AirfieldOnboardingForm />;
}
