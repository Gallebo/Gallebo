import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

import { getStripeClient } from "../_shared/connect.ts";
import {
  handleAccountUpdated,
  handleChargeRefunded,
  handleCheckoutSessionCompleted,
} from "../_shared/stripe-webhook-handlers.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const stripe = getStripeClient();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripe) {
    return new Response(JSON.stringify({ error: "Not configured" }), {
      status: 503,
      headers: JSON_HEADERS,
    });
  }

  if (!webhookSecret) {
    return new Response(JSON.stringify({ error: "Webhook secret not set" }), {
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

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    );
    console.log("[stripe/webhook] signature verified, event type:", event.type);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe/webhook] signature verification failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

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
