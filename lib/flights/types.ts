import type { Enums, Tables } from "@/types/database";

export type Flight = Tables<"flights">;
export type FlightPhoto = Tables<"flight_photos">;
export type FlightType = Enums<"flight_type">;
export type FlightStatus = Enums<"flight_status">;
export type FlightLanguage = Enums<"flight_language">;

export type FlightListItem = Flight & {
  departure_airfield: Pick<
    Tables<"airfields">,
    "id" | "name" | "icao_code" | "latitude" | "longitude" | "country"
  > | null;
  arrival_airfield: Pick<
    Tables<"airfields">,
    "id" | "name" | "icao_code" | "latitude" | "longitude" | "country"
  > | null;
  pilot: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_path: string | null;
  } | null;
  flight_photos: Pick<FlightPhoto, "id" | "storage_path" | "position">[] | null;
  pending_bookings?: number;
  pilot_avg_rating?: number | null;
  pilot_review_count?: number;
};

export type FlightSearchParams = {
  departureAirfieldId?: string;
  arrivalAirfieldId?: string;
  dateFrom?: string;
  dateTo?: string;
  flightType?: FlightType;
  minSeats?: number;
  maxPrice?: number;
  sort?: "date" | "price" | "rating";
  locationQuery?: string;
};
