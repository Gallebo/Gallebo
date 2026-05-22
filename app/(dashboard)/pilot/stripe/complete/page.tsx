import Link from "next/link";

import { requirePilot } from "@/lib/auth/rbac";

export default async function StripeCompletePage() {
  await requirePilot();

  return (
    <div className="mx-auto max-w-md space-y-4 py-12 text-center">
      <div className="text-4xl">✓</div>
      <h1 className="text-2xl font-semibold">Onboarding submitted</h1>
      <p className="text-muted-foreground">
        Thank you for completing the Stripe setup. Stripe is reviewing your information
        and will notify us when your account is active. This usually takes a few minutes.
      </p>
      <Link
        href="/pilot/stripe"
        className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to payout settings
      </Link>
    </div>
  );
}
