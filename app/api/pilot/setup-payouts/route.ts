import { NextResponse } from "next/server";

import { requirePilotApi } from "@/lib/auth/rbac";
import { createPilotConnectAccount, createOnboardingLink } from "@/lib/stripe/connect";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const auth = await requirePilotApi();
    if (!auth.ok) return auth.response;
    const { user } = auth;
    const admin = createAdminClient();

    const { data: authUser } = await admin.auth.admin.getUserById(user.id);
    const email = authUser.user?.email;

    if (!email) {
      return NextResponse.json({ error: "Pilot email not found" }, { status: 400 });
    }

    const { accountId } = await createPilotConnectAccount(user.id, email);
    const onboardingUrl = await createOnboardingLink(accountId);

    return NextResponse.json({ onboardingUrl });
  } catch (err) {
    console.error("[setup-payouts]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create onboarding link" },
      { status: 500 },
    );
  }
}
