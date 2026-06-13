import { PilotUpgradeWizard } from "@/components/onboarding/pilot-upgrade-wizard";
import { getProfile } from "@/lib/auth/rbac";
import { phoneFromDbValue } from "@/lib/crypto/phone";
import { weightFromDbValue } from "@/lib/crypto/weight";
import { requireVerifiedPassengerForUpgrade } from "@/lib/onboarding/guards";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export const metadata = { title: "Upgrade to pilot — Gallebo" };

export default async function PassengerPilotUpgradePage() {
  const { user } = await requireVerifiedPassengerForUpgrade();
  const profile = await getProfile();
  const supabase = await createClient();
  const { data: profileExtras } = await supabase
    .from("profiles")
    .select("date_of_birth, phone_encrypted, weight_encrypted")
    .eq("id", user.id)
    .maybeSingle();
  const { data: pilotProfile } = await supabase
    .from("pilot_profiles")
    .select("onboarding_step, onboarding_draft, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <PilotUpgradeWizard
      key={pilotProfile?.updated_at ?? "new"}
      initialStep={pilotProfile?.onboarding_step ?? 3}
      initialDraft={pilotProfile?.onboarding_draft as Json | null}
      profileDefaults={{
        firstName: profile?.first_name ?? null,
        lastName: profile?.last_name ?? null,
        dateOfBirth: profileExtras?.date_of_birth ?? null,
        phone: profileExtras?.phone_encrypted
          ? phoneFromDbValue(profileExtras.phone_encrypted)
          : null,
        weightKg: profileExtras?.weight_encrypted
          ? weightFromDbValue(profileExtras.weight_encrypted)
          : null,
      }}
    />
  );
}
