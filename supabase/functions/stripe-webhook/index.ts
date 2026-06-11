import type Stripe from "npm:stripe@17.7.0";

import { getStripeClient } from "../_shared/connect.ts";
import {
  handleAccountUpdated,
  handleChargeRefunded,
  handleCheckoutSessionCompleted,
} from "../_shared/stripe-webhook-handlers.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };

type WebhookSecretScope = "platform" | "connect";

async function constructWebhookEvent(
  stripe: NonNullable<ReturnType<typeof getStripeClient>>,
  rawBody: string,
  signature: string,
  secret: string,
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEventAsync(rawBody, signature, secret);
}

async function verifyWebhookSignature(
  stripe: NonNullable<ReturnType<typeof getStripeClient>>,
  rawBody: string,
  signature: string,
  platformSecret: string | undefined,
  connectSecret: string | undefined,
): Promise<{ event: Stripe.Event; scope: WebhookSecretScope } | null> {
  if (platformSecret) {
    try {
      const event = await constructWebhookEvent(
        stripe,
        rawBody,
        signature,
        platformSecret,
      );
      return { event, scope: "platform" };
    } catch {
      // Fall through to Connect secret.
    }
  }

  if (connectSecret) {
    try {
      const event = await constructWebhookEvent(
        stripe,
        rawBody,
        signature,
        connectSecret,
      );
      return { event, scope: "connect" };
    } catch {
      // Both secrets failed (or only Connect was configured).
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const stripe = getStripeClient();
  const platformWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const connectWebhookSecret = Deno.env.get("STRIPE_CONNECT_WEBHOOK_SECRET");

  if (!stripe) {
    return new Response(JSON.stringify({ error: "Not configured" }), {
      status: 503,
      headers: JSON_HEADERS,
    });
  }

  if (!platformWebhookSecret && !connectWebhookSecret) {
    return new Response(JSON.stringify({ error: "Webhook secrets not set" }), {
      status: 503,
      headers: JSON_HEADERS,
    });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  console.log(
    "[stripe/webhook] request received, stripe-signature present:",
    signature !== null,
  );

  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const verified = await verifyWebhookSignature(
    stripe,
    rawBody,
    signature,
    platformWebhookSecret ?? undefined,
    connectWebhookSecret ?? undefined,
  );

  if (!verified) {
    console.error(
      "[stripe/webhook] signature verification failed for platform and connect secrets",
    );
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const { event, scope: verifiedScope } = verified;

  console.log(
    `[stripe/webhook] signature verified (${verifiedScope} secret), event type:`,
    event.type,
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook]", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Handler failed",
      }),
      { status: 500, headers: JSON_HEADERS },
    );
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: JSON_HEADERS,
  });
});
