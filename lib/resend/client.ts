import { getServerEnv } from "@/lib/env";

// Email is sent via Supabase Edge Functions (process-notifications).
// This client stub is kept for future direct-send use cases.
export function getResendClient(): null {
  const key = getServerEnv().RESEND_API_KEY;
  if (!key) return null;
  return null;
}
