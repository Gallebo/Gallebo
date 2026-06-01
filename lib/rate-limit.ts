import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs?: number;
};

type Bucket = { count: number; resetAt: number };

const devBuckets = new Map<string, Bucket>();

function checkRateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = devBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    devBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Distributed rate limit via Postgres RPC (service role).
 * Falls back to in-memory only when Supabase is not configured (local dev).
 */
export async function checkRateLimit(
  key: string,
  limit = 5,
  windowSeconds = 60,
): Promise<RateLimitResult> {
  if (!isSupabaseConfigured()) {
    if (isProduction()) {
      return { allowed: false, retryAfterMs: 60_000 };
    }
    console.warn("[rate-limit] Supabase not configured — using in-memory fallback");
    return checkRateLimitInMemory(key, limit, windowSeconds * 1000);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("[rate-limit] RPC error:", error.message);
      if (isProduction()) {
        return { allowed: false, retryAfterMs: 60_000 };
      }
      return checkRateLimitInMemory(key, limit, windowSeconds * 1000);
    }

    const row = data as {
      allowed?: boolean;
      retry_after_seconds?: number | null;
    } | null;

    const allowed = row?.allowed === true;
    const retrySec = row?.retry_after_seconds;
    return {
      allowed,
      retryAfterMs:
        retrySec != null && retrySec > 0 ? retrySec * 1000 : undefined,
    };
  } catch (e) {
    console.error("[rate-limit] unexpected error:", e);
    if (isProduction()) {
      return { allowed: false, retryAfterMs: 60_000 };
    }
    return checkRateLimitInMemory(key, limit, windowSeconds * 1000);
  }
}
