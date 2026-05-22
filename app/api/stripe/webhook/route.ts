import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getStripeEnv, isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/client";
import {
  handleAccountUpdated,
  handleChargeRefunded,
  handleCheckoutSessionCompleted,
} from "@/lib/stripe/webhook";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const { STRIPE_WEBHOOK_SECRET } = getStripeEnv();
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not set" }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
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
        // Connect event — dolazi s connected accounta.
        // Zahtijeva "Listen to events on Connected accounts" u Stripe Dashboard → Webhooks.
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
