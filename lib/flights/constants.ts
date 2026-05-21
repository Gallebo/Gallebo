export const FLIGHT_PHOTOS_BUCKET = "flight-photos";

export const MIN_FLIGHT_PHOTOS = 3;

export const MAX_FLIGHT_PHOTOS = 12;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const ALLOWED_FLIGHT_PHOTO_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MIN_PASSENGER_SEATS = 1;

export const MAX_PASSENGER_SEATS = 5;

export const PRICE_DEVIATION_PCT = 0.25;

export const MIN_BENCHMARK_SAMPLES = 3;

export const WEIGHT_WARNING_GENERAL_KG = 95;

export const WEIGHT_WARNING_SINGLE_SEAT_KG = 85;

export const FLIGHT_TYPE_LABELS: Record<string, string> = {
  panoramic: "Panoramic (A→A)",
  excursion: "Excursion (A→B→A)",
  one_way: "One-way (A→B)",
};

export const FLIGHT_LANGUAGE_LABELS: Record<string, string> = {
  hr: "Croatian",
  en: "English",
  it: "Italian",
};
