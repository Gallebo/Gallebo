import { PublishFlightWizard } from "@/components/flights/publish-wizard";
import { requirePilot } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "Publish flight — Gallebo" };

export default async function PublishFlightPage() {
  const { user } = await requirePilot();
  const supabase = await createClient();

  const [{ data: aircraftList }, { data: pilotProfile }] = await Promise.all([
    supabase
      .from("aircraft")
      .select("id, model, registration, seats")
      .eq("pilot_user_id", user.id)
      .order("model"),
    supabase
      .from("pilot_profiles")
      .select("stripe_onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <PublishFlightWizard
      aircraftList={aircraftList ?? []}
      stripeOnboardingComplete={Boolean(pilotProfile?.stripe_onboarding_complete)}
    />
  );
}
