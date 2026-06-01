/** In-app notification titles and bodies keyed by notification_queue type */

export function inAppCopyForType(
  type: string,
  payload: Record<string, unknown>,
): { title: string; body: string } | null {
  const flightId = String(payload.flightId ?? "");

  switch (type) {
    case "booking_request_received":
      return {
        title: "New booking request",
        body: "A passenger requested a seat on your flight.",
      };
    case "booking_accepted":
      return {
        title: "Booking accepted",
        body: "Pay within 30 minutes to confirm your seat.",
      };
    case "booking_rejected":
      return {
        title: "Booking not accepted",
        body: "The pilot did not accept your booking request.",
      };
    case "booking_expired_no_response":
      return {
        title: "Booking expired",
        body:
          payload.reason === "payment_timeout"
            ? "Payment was not received in time."
            : "The pilot did not respond in time.",
      };
    case "payment_confirmed":
      return {
        title: "Payment confirmed",
        body: "Your seat is booked. Contact details are now available in chat.",
      };
    case "flight_completed":
      return {
        title: "Flight completed",
        body: "The pilot marked the flight as completed.",
      };
    case "booking_cancelled_by_pilot":
      return {
        title: "Booking cancelled",
        body: "The pilot cancelled your booking.",
      };
    case "booking_cancelled_by_passenger":
      return {
        title: "Booking cancelled",
        body: "The passenger cancelled their booking.",
      };
    case "flight_reminder_24h":
      return {
        title: "Flight reminder",
        body: `Your flight${flightId ? ` (${flightId.slice(0, 8)}…)` : ""} departs in about 24 hours.`,
      };
    case "flight_cancelled":
      return {
        title: "Flight cancelled",
        body: "A flight you booked was cancelled by the pilot.",
      };
    case "payout_sent":
      return {
        title: "Payout sent",
        body: `€${String(payload.amountEur ?? "")} was sent to your IBAN.`,
      };
    case "flight_alert_match":
      return {
        title: "Flight found!",
        body: "A pilot published a flight that matches your route alert.",
      };
    case "flight_alert_expiry_warning":
      return {
        title: "Alert expiring soon",
        body: "Your flight alert expires tomorrow. Extend it with one click.",
      };
    default:
      return null;
  }
}
