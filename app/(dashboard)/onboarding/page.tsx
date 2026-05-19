import Link from "next/link";

import { RolePicker } from "@/components/onboarding/role-picker";
import { requireUser } from "@/lib/auth/rbac";

export const metadata = { title: "Choose your role — Gallebo" };

export default async function OnboardingPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">How will you use Gallebo?</h1>
        <p className="mt-2 text-muted-foreground">
          Your role is assigned after verification. You can only have one active role.
        </p>
      </div>
      <RolePicker />
    </div>
  );
}
