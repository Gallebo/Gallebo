import { NextResponse } from "next/server";

import { requirePilot } from "@/lib/auth/rbac";
import { createOnboardingLink } from "@/lib/stripe/connect";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const { user } = await requirePilot();
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

    const onboardingUrl = await createOnboardingLink(
      pilot.stripe_account_id,
      "account_update",
    );

    return NextResponse.json({ onboardingUrl });
  } catch (err) {
    console.error("[edit-payouts]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create update link" },
      { status: 500 },
    );
  }
}
