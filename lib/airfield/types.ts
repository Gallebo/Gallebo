import type { Tables } from "@/types/database";

export type Airfield = Tables<"airfields">;
export type AirfieldPhoto = Tables<"airfield_photos">;
export type AirfieldNotice = Tables<"airfield_notices">;
export type AirfieldEvent = Tables<"airfield_events">;

export type AirfieldMapMarker = Pick<
  Airfield,
  | "id"
  | "name"
  | "icao_code"
  | "latitude"
  | "longitude"
  | "has_fuel"
  | "has_hangar"
  | "has_rental"
>;
