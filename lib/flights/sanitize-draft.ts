import { MAX_FLIGHT_PHOTOS } from "@/lib/flights/constants";
import type { FlightDraft } from "@/lib/flights/schemas";

const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_LABEL_LENGTH = 200;
const MAX_PHOTO_PATH_LENGTH = 256;
const MAX_STRING_FIELD_LENGTH = 128;

/** Storage paths only — never data URLs or embedded file content. */
const STORAGE_PATH_RE = /^[0-9a-f-]{36}\/draft\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i;

export function isValidDraftPhotoPath(userId: string, path: string): boolean {
  return path.startsWith(`${userId}/draft/`) && STORAGE_PATH_RE.test(path);
}

function trimString(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

function sanitizePhotoPaths(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const paths: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const path = item.trim();
    if (!path || path.startsWith("data:")) continue;
    if (path.length > MAX_PHOTO_PATH_LENGTH) continue;
    if (!STORAGE_PATH_RE.test(path)) continue;
    paths.push(path);
    if (paths.length >= MAX_FLIGHT_PHOTOS) break;
  }
  return paths.length > 0 ? paths : undefined;
}

/** For publish: valid storage paths only (no data URLs). */
export function sanitizePhotoPathsForPublish(raw: unknown): string[] {
  return sanitizePhotoPaths(raw) ?? [];
}

/**
 * Keeps only known draft fields and drops oversized or invalid values
 * (e.g. legacy base64 in photoPaths) so RSC props and Server Actions stay under limits.
 */
export function sanitizeFlightDraftForTransport(
  raw: unknown,
): FlightDraft {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const d = raw as Record<string, unknown>;
  const draft: FlightDraft = {};

  if (
    d.flightType === "panoramic" ||
    d.flightType === "excursion" ||
    d.flightType === "one_way"
  ) {
    draft.flightType = d.flightType;
  }

  if (d.aircraftMode === "owned" || d.aircraftMode === "rented") {
    draft.aircraftMode = d.aircraftMode;
  }

  const aircraftId = trimString(d.aircraftId, MAX_STRING_FIELD_LENGTH);
  if (aircraftId) draft.aircraftId = aircraftId;

  const rentedModel = trimString(d.rentedModel, MAX_STRING_FIELD_LENGTH);
  if (rentedModel) draft.rentedModel = rentedModel;

  const rentedRegistration = trimString(
    d.rentedRegistration,
    MAX_STRING_FIELD_LENGTH,
  );
  if (rentedRegistration) draft.rentedRegistration = rentedRegistration;

  if (
    typeof d.rentedSeats === "number" &&
    Number.isFinite(d.rentedSeats) &&
    d.rentedSeats >= 1 &&
    d.rentedSeats <= 20
  ) {
    draft.rentedSeats = Math.floor(d.rentedSeats);
  }

  const departureAirfieldId = trimString(
    d.departureAirfieldId,
    MAX_STRING_FIELD_LENGTH,
  );
  if (departureAirfieldId) draft.departureAirfieldId = departureAirfieldId;

  const arrivalAirfieldId = trimString(d.arrivalAirfieldId, MAX_STRING_FIELD_LENGTH);
  if (arrivalAirfieldId) draft.arrivalAirfieldId = arrivalAirfieldId;

  const departureAirfieldLabel = trimString(
    d.departureAirfieldLabel,
    MAX_LABEL_LENGTH,
  );
  if (departureAirfieldLabel) draft.departureAirfieldLabel = departureAirfieldLabel;

  const arrivalAirfieldLabel = trimString(d.arrivalAirfieldLabel, MAX_LABEL_LENGTH);
  if (arrivalAirfieldLabel) draft.arrivalAirfieldLabel = arrivalAirfieldLabel;

  const flightDate = trimString(d.flightDate, 32);
  if (flightDate) draft.flightDate = flightDate;

  const departureTime = trimString(d.departureTime, 16);
  if (departureTime) draft.departureTime = departureTime;

  if (
    typeof d.totalCostEur === "number" &&
    Number.isFinite(d.totalCostEur) &&
    d.totalCostEur > 0
  ) {
    draft.totalCostEur = d.totalCostEur;
  }

  if (
    typeof d.passengerSeats === "number" &&
    Number.isFinite(d.passengerSeats) &&
    d.passengerSeats >= 1 &&
    d.passengerSeats <= 20
  ) {
    draft.passengerSeats = Math.floor(d.passengerSeats);
  }

  const description = trimString(d.description, MAX_DESCRIPTION_LENGTH);
  if (description) draft.description = description;

  if (d.communicationLanguage === "hr" || d.communicationLanguage === "en" || d.communicationLanguage === "it") {
    draft.communicationLanguage = d.communicationLanguage;
  }

  const returnNote = trimString(d.returnNote, MAX_DESCRIPTION_LENGTH);
  if (returnNote) draft.returnNote = returnNote;

  const pilotReturnDate = trimString(d.pilotReturnDate, 32);
  if (pilotReturnDate) draft.pilotReturnDate = pilotReturnDate;

  const photoPaths = sanitizePhotoPaths(d.photoPaths);
  if (photoPaths) draft.photoPaths = photoPaths;

  return draft;
}
