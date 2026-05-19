import { PilotOnboardingWizard } from "@/components/onboarding/pilot-wizard";
import { requireUser, getProfile } from "@/lib/auth/rbac";
import { weightFromDbValue } from "@/lib/crypto/weight";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pilot verification — Gallebo" };

export default async function PilotOnboardingPage() {
  const user = await requireUser();
  const profile = await getProfile();
  const supabase = await createClient();
  const { data: pilotProfile } = await supabase
    .from("pilot_profiles")
    .select("onboarding_step, onboarding_draft, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const step = pilotProfile?.onboarding_step ?? 1;

  return (
    <PilotOnboardingWizard
      key={`${pilotProfile?.updated_at ?? "new"}-${step}`}
      initialStep={step}
      initialDraft={pilotProfile?.onboarding_draft}
      profileDefaults={{
        firstName: profile?.first_name ?? null,
        lastName: profile?.last_name ?? null,
        dateOfBirth: profile?.date_of_birth ?? null,
        phone: null,
        weightKg: profile?.weight_encrypted
          ? weightFromDbValue(profile.weight_encrypted)
          : null,
      }}
    />
  );
}
