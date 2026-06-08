import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/rbac";

export const metadata = { title: "Onboarding — Gallebo" };

export default async function OnboardingPage() {
  await requireUser();
  redirect("/onboarding/passenger");
}
