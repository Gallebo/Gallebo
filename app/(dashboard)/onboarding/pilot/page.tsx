import { PilotOnboardingWizard } from "@/components/onboarding/pilot-wizard";
import { requireUser, getProfile } from "@/lib/auth/rbac";
import { mapPilotOnboardingStep, pilotDraftDiditApproved } from "@/lib/onboarding/pilot-step";
import { weightFromDbValue } from "@/lib/crypto/weight";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export const metadata = { title: "Pilot verification — Gallebo" };

function draftFromJson(raw: Json | null | undefined): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return { ...(raw as Record<string, unknown>) };
}

function isDiditApproved(status: string | null | undefined): boolean {
  const s = String(status ?? "").toLowerCase();
  return s === "approved" || s === "verified" || s === "passed";
}

export default async function PilotOnboardingPage() {
  const user = await requireUser();
  const profile = await getProfile();
  const supabase = await createClient();
  const { data: pilotProfile } = await supabase
    .from("pilot_profiles")
    .select("onboarding_step, onboarding_draft, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: openVr } = await supabase
    .from("verification_requests")
    .select("didit_status")
    .eq("user_id", user.id)
    .eq("requested_role", "pilot")
    .is("reviewed_at", null)
    .maybeSingle();

  const draft = draftFromJson(pilotProfile?.onboarding_draft);
  const storedStep = pilotProfile?.onboarding_step ?? 1;
  const diditFromVr = isDiditApproved(openVr?.didit_status);
  const step = mapPilotOnboardingStep(storedStep, draft, diditFromVr);

  return (
    <PilotOnboardingWizard
      key={`${pilotProfile?.updated_at ?? "new"}-${step}`}
      initialStep={step}
      initialDraft={pilotProfile?.onboarding_draft}
      diditKycComplete={pilotDraftDiditApproved(draft) || diditFromVr}
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
