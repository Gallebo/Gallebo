import { NextResponse } from "next/server";

import { requirePilotApi } from "@/lib/auth/rbac";
import { getAppUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const auth = await requirePilotApi();
    if (!auth.ok) return auth.response;
    const { user } = auth;
    const admin = createAdminClient();

    const { data: pilot } = await admin
      .from("pilot_profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("user_id", user.id)
      .single();

    if (!pilot?.stripe_account_id) {
      return NextResponse.json({ error: "No payout account found" }, { status: 400 });
    }

    if (!pilot.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: "Complete payout setup before editing details" },
        { status: 400 },
      );
    }

    if (!isStripeConfigured() || pilot.stripe_account_id.startsWith("acct_stub_")) {
      return NextResponse.json({
        onboardingUrl: `${getAppUrl()}/pilot/stripe/complete?stub=1`,
      });
    }

    const stripe = getStripe();
    const loginLink = await stripe.accounts.createLoginLink(pilot.stripe_account_id);

    return NextResponse.json({ onboardingUrl: loginLink.url });
  } catch (err) {
    console.error("[edit-payouts]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create login link" },
      { status: 500 },
    );
  }
}
