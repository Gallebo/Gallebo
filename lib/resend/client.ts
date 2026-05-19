import { getServerEnv } from "@/lib/env";

export function getResendClient(): null {
  const key = getServerEnv().RESEND_API_KEY;
  if (!key) return null;
  // Faza 1 stub — activate when domain is ready
  return null;
}
