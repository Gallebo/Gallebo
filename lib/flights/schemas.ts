import { z } from "zod";

import {
  MAX_PASSENGER_SEATS,
  MIN_PASSENGER_SEATS,
} from "@/lib/flights/constants";

export const flightTypeSchema = z.enum(["panoramic", "excursion", "one_way"]);

export const flightLanguageSchema = z.enum(["hr", "en", "it"]);

export const ownedAircraftSchema = z.object({
  aircraftMode: z.literal("owned"),
  aircraftId: z.string().uuid(),
});

export const rentedAircraftSchema = z.object({
  aircraftMode: z.literal("rented"),
  rentedModel: z.string().min(2).max(120),
  rentedRegistration: z
    .string()
    .min(2)
    .max(12)
    .transform((v) => v.replace(/\s/g, "").toUpperCase()),
  rentedSeats: z.coerce.number().int().min(2).max(6),
});

export const aircraftStepSchema = z.discriminatedUnion("aircraftMode", [
  ownedAircraftSchema,
  rentedAircraftSchema,
]);

export const routeStepSchema = z
  .object({
    flightType: flightTypeSchema,
    departureAirfieldId: z.string().uuid(),
    arrivalAirfieldId: z.string().uuid(),
  })
  .superRefine((data, ctx) => {
    if (data.flightType === "panoramic" && data.departureAirfieldId !== data.arrivalAirfieldId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Panoramic flights must depart and arrive at the same airfield",
        path: ["arrivalAirfieldId"],
      });
    }
    if (data.flightType !== "panoramic" && data.departureAirfieldId === data.arrivalAirfieldId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Departure and arrival must be different airfields",
        path: ["arrivalAirfieldId"],
      });
    }
  });

export const scheduleStepSchema = z.object({
  flightDate: z
    .string()
    .min(1)
    .refine((d) => d >= new Date().toISOString().slice(0, 10), {
      message: "Flight date must be today or in the future",
    }),
  departureTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time (HH:MM)"),
});

export const costStepSchema = z.object({
  totalCostEur: z.coerce.number().positive().max(999999),
});

export const seatsStepSchema = z.object({
  passengerSeats: z.coerce
    .number()
    .int()
    .min(MIN_PASSENGER_SEATS)
    .max(MAX_PASSENGER_SEATS),
});

export const descriptionStepSchema = z.object({
  description: z.string().min(20).max(5000),
});

export const returnStepSchema = z.object({
  returnNote: z.string().max(2000).optional().or(z.literal("")),
  pilotReturnDate: z.string().optional().or(z.literal("")),
});

export const publishFlightSchema = z
  .object({
    flightType: flightTypeSchema,
    aircraftId: z.string().uuid().optional(),
    rentedModel: z.string().optional(),
    rentedRegistration: z.string().optional(),
    rentedSeats: z.coerce.number().int().min(2).max(6).optional(),
    departureAirfieldId: z.string().uuid(),
    arrivalAirfieldId: z.string().uuid(),
    flightDate: z
      .string()
      .min(1)
      .refine((d) => d >= new Date().toISOString().slice(0, 10), {
        message: "Flight date must be today or in the future",
      }),
    departureTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time (HH:MM)"),
    totalCostEur: z.coerce.number().positive().max(999999),
    passengerSeats: z.coerce.number().int().min(MIN_PASSENGER_SEATS).max(MAX_PASSENGER_SEATS),
    description: z.string().min(20).max(5000),
    communicationLanguage: flightLanguageSchema,
    returnNote: z.string().max(2000).optional(),
    pilotReturnDate: z.string().optional(),
    costAcknowledged: z.literal("on").optional(),
    airworthinessDeclared: z.literal("on"),
  })
  .superRefine((data, ctx) => {
    const hasOwned = Boolean(data.aircraftId);
    const hasRent =
      Boolean(data.rentedModel) &&
      Boolean(data.rentedRegistration) &&
      data.rentedSeats !== undefined;

    if (hasOwned === hasRent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select either your aircraft or enter rented aircraft details",
        path: ["aircraftId"],
      });
    }

    if (data.flightType === "panoramic" && data.departureAirfieldId !== data.arrivalAirfieldId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Panoramic flights must use the same airfield",
        path: ["arrivalAirfieldId"],
      });
    }

    if (data.flightType !== "panoramic" && data.departureAirfieldId === data.arrivalAirfieldId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Departure and arrival must be different airfields",
        path: ["arrivalAirfieldId"],
      });
    }

    if (
      data.rentedSeats !== undefined &&
      data.passengerSeats > data.rentedSeats - 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Passenger seats cannot exceed aircraft capacity minus one seat for pilot",
        path: ["passengerSeats"],
      });
    }
  });

export type FlightDraft = {
  flightType?: z.infer<typeof flightTypeSchema>;
  aircraftMode?: "owned" | "rented";
  aircraftId?: string;
  rentedModel?: string;
  rentedRegistration?: string;
  rentedSeats?: number;
  departureAirfieldId?: string;
  arrivalAirfieldId?: string;
  departureAirfieldLabel?: string;
  arrivalAirfieldLabel?: string;
  flightDate?: string;
  departureTime?: string;
  totalCostEur?: number;
  passengerSeats?: number;
  description?: string;
  communicationLanguage?: z.infer<typeof flightLanguageSchema>;
  returnNote?: string;
  pilotReturnDate?: string;
  photoPaths?: string[];
};

export function computePricePerPassenger(
  totalCostEur: number,
  passengerSeats: number,
): number {
  return Math.round((totalCostEur / (passengerSeats + 1)) * 100) / 100;
}
