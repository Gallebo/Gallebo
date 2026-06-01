import { createAdminClient } from "@/lib/supabase/admin";

export class DiditNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiditNotAllowedError";
  }
}

/** Hard checks before starting a Didit session (spec: one KYC flow per user). */
export async function assertCanStartDiditSession(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.status === "verified") {
    throw new DiditNotAllowedError(
      "Your account is already verified. You cannot start identity verification again.",
    );
  }

  const { count: priorSessions } = await admin
    .from("verification_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("didit_session_id", "is", null);

  if ((priorSessions ?? 0) > 0) {
    throw new DiditNotAllowedError(
      "Identity verification was already started for this account.",
    );
  }

  const { count: activeSessions } = await admin
    .from("verification_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("reviewed_at", null)
    .not("didit_session_id", "is", null);

  if ((activeSessions ?? 0) > 0) {
    throw new DiditNotAllowedError(
      "An active verification session already exists.",
    );
  }
}
