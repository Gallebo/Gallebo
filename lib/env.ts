import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_MAPTILER_API_KEY: z
    .preprocess(
      (v) => (v === "" || v === undefined ? undefined : v),
      z.string().min(1).optional()
    ),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DIDIT_API_KEY: z.string().min(1).optional(),
  DIDIT_WEBHOOK_SECRET: z.string().min(1).optional(),
  DIDIT_WORKFLOW_ID: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  PHONE_ENCRYPTION_KEY: z.string().min(32).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MAPTILER_API_KEY: process.env.NEXT_PUBLIC_MAPTILER_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DIDIT_API_KEY: process.env.DIDIT_API_KEY,
    DIDIT_WEBHOOK_SECRET: process.env.DIDIT_WEBHOOK_SECRET,
    DIDIT_WORKFLOW_ID: process.env.DIDIT_WORKFLOW_ID,
    CRON_SECRET: process.env.CRON_SECRET,
    PHONE_ENCRYPTION_KEY: process.env.PHONE_ENCRYPTION_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  });
}

export function getAppUrl(): string {
  return getPublicEnv().NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function isSupabaseConfigured(): boolean {
  const env = getPublicEnv();
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isMapTilerConfigured(): boolean {
  return Boolean(getPublicEnv().NEXT_PUBLIC_MAPTILER_API_KEY);
}

export function isDiditConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(
    env.DIDIT_API_KEY && env.DIDIT_WORKFLOW_ID && env.DIDIT_WEBHOOK_SECRET
  );
}

export function isCronConfigured(): boolean {
  return Boolean(getServerEnv().CRON_SECRET);
}
