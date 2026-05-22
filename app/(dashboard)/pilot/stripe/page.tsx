import { redirect } from "next/navigation";

import { requirePilot } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { SetupPayoutsButton } from "@/components/pilot/setup-payouts-button";

export default async function PilotStripePage() {
  const { user } = await requirePilot();
  const supabase = await createClient();

  const { data: pilot } = await supabase
    .from("pilot_profiles")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("user_id", user.id)
    .single();

  if (!pilot) {
    redirect("/pilot");
  }

  const { stripe_account_id, stripe_onboarding_complete } = pilot;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Payout setup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your bank account to receive payouts via Stripe.
        </p>
      </div>

      {/* Stanje C: onboarding završen */}
      {stripe_onboarding_complete && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">Payouts active</p>
          <p className="mt-1 text-green-700">
            Your payout account is set up. Funds will be transferred automatically after each completed flight.
          </p>
        </div>
      )}

      {/* Stanje B: account kreiran ali onboarding nije završen */}
      {stripe_account_id && !stripe_onboarding_complete && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm">
          <p className="font-medium text-yellow-900">Complete your payout setup</p>
          <p className="mt-1 text-yellow-700">
            Your Stripe account has been created but onboarding is not complete.
            Click below to finish setting up your bank account.
          </p>
          <div className="mt-4">
            <SetupPayoutsButton label="Complete setup" />
          </div>
        </div>
      )}

      {/* Stanje A: nema Stripe accounta */}
      {!stripe_account_id && (
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">No payout account</p>
          <p className="mt-1 text-muted-foreground">
            Set up your payout account to receive payments. Stripe will securely collect your bank details.
          </p>
          <div className="mt-4">
            <SetupPayoutsButton label="Set up payouts" />
          </div>
        </div>
      )}
    </div>
  );
}
