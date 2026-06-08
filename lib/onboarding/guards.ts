import { redirect } from "next/navigation";

import { getProfile, requireUser } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

const DIDIT_APPROVED = new Set(["approved", "verified", "passed"]);

export const UPGRADE_PENDING_QUERY = "upgradePending";
export const UPGRADE_PENDING_MESSAGE =
  "You already have a pending upgrade request. Contact support@gallebo.app to make changes.";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export function isDiditApprovedStatus(status: string | null | undefined): boolean {
  return DIDIT_APPROVED.has(String(status ?? "").toLowerCase());
}

/** Open pilot upgrade VR or pending airfield operator request. */
export async function hasPendingUpgradeRequest(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const [{ data: pilotVr }, { data: airfieldReq }] = await Promise.all([
    supabase
      .from("verification_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("requested_role", "pilot")
      .is("reviewed_at", null)
      .maybeSingle(),
    supabase
      .from("airfield_operator_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle(),
  ]);

  return Boolean(pilotVr?.id || airfieldReq?.id);
}

export async function assertPassengerIdentityVerified(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error?: string }> {
  const { data, error } = await supabase
    .from("verification_requests")
    .select("id, didit_status")
    .eq("user_id", userId)
    .eq("requested_role", "passenger")
    .in("didit_status", ["approved", "verified", "passed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) {
    return { error: "Identity verification incomplete. Cannot upgrade role." };
  }
  return {};
}

export async function redirectVerifiedPassengerFromLegacyOnboarding(): Promise<void> {
  const profile = await getProfile();
  if (profile?.role === "passenger" && profile.status === "verified") {
    redirect("/passenger");
  }
}

export async function requireVerifiedPassengerForUpgrade() {
  const user = await requireUser();
  const profile = await getProfile();

  if (profile?.role !== "passenger" || profile.status !== "verified") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  if (await hasPendingUpgradeRequest(supabase, user.id)) {
    redirect(`/passenger?${UPGRADE_PENDING_QUERY}=1`);
  }

  return { user, profile };
}

export function becomePilotHref(
  loggedIn: boolean,
  profile: { role: string | null; status: string } | null
): string {
  if (!loggedIn) return "/login";
  if (profile?.role === "passenger" && profile.status === "verified") {
    return "/passenger/upgrade/pilot";
  }
  return "/onboarding/passenger";
}
