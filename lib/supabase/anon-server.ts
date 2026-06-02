import { createClient } from "@supabase/supabase-js";

import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

export type AnonSupabaseClient = ReturnType<typeof createAnonClient>;

/**
 * Cookie-free Supabase client for public read paths (cache-safe).
 * Uses the anon key; RLS applies as for unauthenticated visitors.
 */
export function createAnonClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const env = getPublicEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
