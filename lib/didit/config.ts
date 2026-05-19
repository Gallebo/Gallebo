import { z } from "zod";

import { getServerEnv, isDiditConfigured } from "@/lib/env";

const diditEnvSchema = z.object({
  DIDIT_API_KEY: z.string().min(1),
  DIDIT_WORKFLOW_ID: z.string().min(1),
  DIDIT_WEBHOOK_SECRET: z.string().min(1),
});

export type DiditConfig = z.infer<typeof diditEnvSchema>;

/** Server-only Didit configuration. */
export function getDiditConfig(): DiditConfig {
  if (!isDiditConfigured()) {
    throw new Error(
      "Didit is not configured. Set DIDIT_API_KEY, DIDIT_WORKFLOW_ID, and DIDIT_WEBHOOK_SECRET in .env.local."
    );
  }

  const env = getServerEnv();
  return diditEnvSchema.parse({
    DIDIT_API_KEY: env.DIDIT_API_KEY,
    DIDIT_WORKFLOW_ID: env.DIDIT_WORKFLOW_ID,
    DIDIT_WEBHOOK_SECRET: env.DIDIT_WEBHOOK_SECRET,
  });
}
