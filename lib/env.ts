import { z } from "zod";

/** Treat unset or blank .env values as missing (empty string fails .min()). */
function emptyToUndefined(value: unknown) {
  if (value === "" || value === undefined || value === null) return undefined;
  return value;
}

const optionalString = (min = 1) =>
  z.preprocess(emptyToUndefined, z.string().min(min).optional());

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_MAPTILER_API_KEY: z
    .preprocess(
      (v) => (v === "" || v === undefined ? undefined : v),
      z.string().min(1).optional()
    ),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalString(),
  DIDIT_API_KEY: optionalString(),
  DIDIT_WEBHOOK_SECRET: optionalString(),
  DIDIT_WORKFLOW_ID: optionalString(),
  CRON_SECRET: optionalString(),
  PHONE_ENCRYPTION_KEY: optionalString(32),
  RESEND_API_KEY: optionalString(),
  STRIPE_SECRET_KEY: optionalString(),
  STRIPE_WEBHOOK_SECRET: optionalString(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MAPTILER_API_KEY: process.env.NEXT_PUBLIC_MAPTILER_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
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
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  });
}

export function isStripeConfigured(): boolean {
  return Boolean(getServerEnv().STRIPE_SECRET_KEY);
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
