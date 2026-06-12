import { getAppUrl } from "@/lib/env";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/client";

export async function createBookingCheckoutSession(params: {
  bookingId: string;
  flightId: string;
  passengerUserId: string;
  passengerAmountEur: number;
  paymentExpiresAt: Date;
}): Promise<{ sessionId: string; url: string } | { error: string }> {
  if (!isStripeConfigured()) {
    return { error: "Payment is not configured" };
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();
  const amountCents = Math.round(params.passengerAmountEur * 100);

  const expiresAt = Math.floor(params.paymentExpiresAt.getTime() / 1000);
  const nowSec = Math.floor(Date.now() / 1000);
  const minExpires = nowSec + 30 * 60;
  const sessionExpiresAt = Math.max(expiresAt, minExpires);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: {
            name: "Gallebo flight booking",
            description: "Includes 4% platform service fee",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      booking_id: params.bookingId,
      flight_id: params.flightId,
      passenger_user_id: params.passengerUserId,
    },
    success_url: `${appUrl}/flights/${params.flightId}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/passenger/bookings?cancelled=1`,
    expires_at: sessionExpiresAt,
  });

  if (!session.url) {
    return { error: "Failed to create checkout session" };
  }

  return { sessionId: session.id, url: session.url };
}
