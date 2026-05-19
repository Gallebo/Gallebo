import { PassengerOnboardingWizard } from "@/components/onboarding/passenger-wizard";
import { requireUser } from "@/lib/auth/rbac";

export const metadata = { title: "Passenger verification — Gallebo" };

export default async function PassengerOnboardingPage() {
  await requireUser();
  return <PassengerOnboardingWizard />;
}
