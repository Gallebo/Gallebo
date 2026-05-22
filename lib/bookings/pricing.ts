/** Platform fee per side (passenger surcharge + pilot deduction). */
export const PLATFORM_FEE_RATE = 0.04;

export type BookingAmounts = {
  basePriceEur: number;
  passengerAmountEur: number;
  pilotPayoutEur: number;
  platformFeeEur: number;
};

export function calculateBookingAmounts(
  pricePerPassengerEur: number,
): BookingAmounts {
  const base = roundMoney(pricePerPassengerEur);
  const passengerAmount = roundMoney(base * (1 + PLATFORM_FEE_RATE));
  const pilotPayout = roundMoney(base * (1 - PLATFORM_FEE_RATE));
  const platformFee = roundMoney(base * PLATFORM_FEE_RATE * 2);

  return {
    basePriceEur: base,
    passengerAmountEur: passengerAmount,
    pilotPayoutEur: pilotPayout,
    platformFeeEur: platformFee,
  };
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function passengerRefundEligible(
  flightDateIso: string,
  cancelledAt: Date = new Date(),
): boolean {
  const flightDate = new Date(`${flightDateIso}T12:00:00Z`);
  const hoursUntil =
    (flightDate.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60);
  return hoursUntil >= 48;
}
