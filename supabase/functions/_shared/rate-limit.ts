import { createAdminClient } from "./supabase.ts";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("[rate-limit] RPC error:", error.message);
    return { allowed: false, retryAfterSeconds: 60 };
  }

  const row = data as {
    allowed?: boolean;
    retry_after_seconds?: number | null;
  } | null;

  return {
    allowed: row?.allowed === true,
    retryAfterSeconds:
      row?.retry_after_seconds != null && row.retry_after_seconds > 0
        ? row.retry_after_seconds
        : undefined,
  };
}
