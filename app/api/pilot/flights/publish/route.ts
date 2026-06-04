import { NextResponse } from "next/server";

import { publishFlightAction } from "@/lib/flights/actions";
import { getProfile, getSessionUser } from "@/lib/auth/rbac";
import { rethrowIfNextRedirect } from "@/lib/navigation/redirect-error";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await getProfile();
  if (profile?.role !== "pilot" || profile?.status !== "verified") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: pilotProfile } = await supabase
    .from("pilot_profiles")
    .select("stripe_onboarding_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!pilotProfile?.stripe_onboarding_complete) {
    return NextResponse.json(
      { error: "Please set up your payout account before publishing a flight." },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();
    const result = await publishFlightAction({}, formData);
    return NextResponse.json(result);
  } catch (e) {
    rethrowIfNextRedirect(e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Failed to publish flight",
      },
      { status: 500 },
    );
  }
}
