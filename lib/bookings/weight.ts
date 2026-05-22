export type WeightCheckResult = {
  totalKg: number;
  maxKg: number | null;
  exceedsLimit: boolean;
  passengerWeights: { userId: string; weightKg: number | null }[];
};

export function checkFlightWeight(
  maxPassengerWeightKg: number | null | undefined,
  passengerWeights: { userId: string; weightKg: number | null }[],
): WeightCheckResult {
  const totalKg = passengerWeights.reduce(
    (sum, p) => sum + (p.weightKg ?? 0),
    0,
  );
  const maxKg = maxPassengerWeightKg ?? null;
  const exceedsLimit =
    maxKg != null && maxKg > 0 && totalKg > maxKg;

  return {
    totalKg,
    maxKg,
    exceedsLimit,
    passengerWeights,
  };
}
