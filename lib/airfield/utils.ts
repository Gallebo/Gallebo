import { getPublicEnv } from "@/lib/env";

export const AIRFIELD_PHOTOS_BUCKET = "airfield-photos";

export function getAirfieldPhotoPublicUrl(storagePath: string): string | null {
  const baseUrl = getPublicEnv().NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;
  return `${baseUrl}/storage/v1/object/public/${AIRFIELD_PHOTOS_BUCKET}/${storagePath}`;
}

export function formatServiceLabels(airfield: {
  has_fuel: boolean;
  has_hangar: boolean;
  has_rental: boolean;
}): string[] {
  const labels: string[] = [];
  if (airfield.has_fuel) labels.push("Fuel");
  if (airfield.has_hangar) labels.push("Hangar");
  if (airfield.has_rental) labels.push("Aircraft rental");
  return labels;
}
