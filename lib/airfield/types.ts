import type { Tables } from "@/types/database";

export type Airfield = Tables<"airfields">;
export type AirfieldPhoto = Pick<
  Tables<"airfield_photos">,
  "id" | "storage_path" | "sort_order"
>;
export type AirfieldNotice = Pick<
  Tables<"airfield_notices">,
  "id" | "body" | "created_at"
>;
export type AirfieldEvent = Pick<
  Tables<"airfield_events">,
  "id" | "title" | "description" | "event_date" | "link"
>;

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
