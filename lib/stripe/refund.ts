import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/client";

export async function createBookingRefund(
  paymentIntentId: string,
  idempotencyKey: string,
): Promise<{ refundId: string } | { error: string }> {
  if (!isStripeConfigured()) {
    console.warn("[stripe/refund] STRIPE not configured — stub refund");
    return { refundId: `stub_refund_${idempotencyKey}` };
  }

  const stripe = getStripe();
  const refund = await stripe.refunds.create(
    { payment_intent: paymentIntentId },
    { idempotencyKey },
  );

  return { refundId: refund.id };
}
