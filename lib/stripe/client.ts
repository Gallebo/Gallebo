import Stripe from "stripe";

import { getStripeEnv, isStripeConfigured } from "@/lib/stripe/config";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  if (!stripeClient) {
    const { STRIPE_SECRET_KEY } = getStripeEnv();
    stripeClient = new Stripe(STRIPE_SECRET_KEY!, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}
