import { z } from "zod";

const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
});

export function getStripeEnv() {
  return stripeEnvSchema.parse({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  });
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeEnv().STRIPE_SECRET_KEY);
}
