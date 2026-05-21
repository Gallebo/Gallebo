import {
  WEIGHT_WARNING_GENERAL_KG,
  WEIGHT_WARNING_SINGLE_SEAT_KG,
} from "@/lib/flights/constants";
import { weightFromDbValue } from "@/lib/crypto/weight";

export function getPassengerWeightWarning(
  weightEncrypted: string | null,
  passengerSeats: number,
): string | null {
  if (!weightEncrypted) return null;
  try {
    const kg = weightFromDbValue(weightEncrypted);
    if (passengerSeats <= 1 && kg > WEIGHT_WARNING_SINGLE_SEAT_KG) {
      return `Your weight (${kg} kg) may exceed the comfortable limit for a single remaining seat on this flight. Contact the pilot before booking.`;
    }
    if (kg > WEIGHT_WARNING_GENERAL_KG) {
      return `Your weight (${kg} kg) is above the typical limit (${WEIGHT_WARNING_GENERAL_KG} kg). Confirm with the pilot that the aircraft can accommodate you.`;
    }
  } catch {
    return null;
  }
  return null;
}
