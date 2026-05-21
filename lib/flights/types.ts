import type { Enums, Tables } from "@/types/database";

export type Flight = Tables<"flights">;
export type FlightPhoto = Tables<"flight_photos">;
export type FlightType = Enums<"flight_type">;
export type FlightStatus = Enums<"flight_status">;
export type FlightLanguage = Enums<"flight_language">;

type FlightAirfieldSummary = Pick<
  Tables<"airfields">,
  "id" | "name" | "icao_code" | "latitude" | "longitude" | "country"
>;

export type FlightPilotSummary = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
};

/** Row returned by FLIGHT_SELECT before pilot/booking/rating enrichment. */
export type FlightRowFromDb = Flight & {
  departure_airfield: FlightAirfieldSummary | null;
  arrival_airfield: FlightAirfieldSummary | null;
  flight_photos: Pick<FlightPhoto, "id" | "storage_path" | "position">[] | null;
};

export type FlightListEnrichment = {
  pilot: FlightPilotSummary | null;
  pending_bookings: number;
  pilot_avg_rating: number | null;
  pilot_review_count: number;
};

export type FlightListItem = FlightRowFromDb & FlightListEnrichment;

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
