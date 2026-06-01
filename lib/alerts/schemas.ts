import { z } from "zod";

export const createAlertSchema = z
  .object({
    locationMode: z.enum(["airfield", "country"]),
    departureAirfieldId: z.string().uuid().optional(),
    departureCountry: z.string().min(1).optional(),
    arrivalAirfieldId: z.string().uuid().optional(),
    arrivalCountry: z.string().min(1).optional(),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    flightType: z
      .enum(["panoramic", "excursion", "one_way", "all"])
      .default("all"),
  })
  .superRefine((data, ctx) => {
    if (data.locationMode === "airfield") {
      if (!data.departureAirfieldId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select departure airfield",
          path: ["departureAirfieldId"],
        });
      }
      if (!data.arrivalAirfieldId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select arrival airfield",
          path: ["arrivalAirfieldId"],
        });
      }
    } else {
      if (!data.departureCountry) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select departure country",
          path: ["departureCountry"],
        });
      }
      if (!data.arrivalCountry) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select arrival country",
          path: ["arrivalCountry"],
        });
      }
    }
    if (data.dateTo < data.dateFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after start date",
        path: ["dateTo"],
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (data.dateFrom < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date cannot be in the past",
        path: ["dateFrom"],
      });
    }

    const fromMs = new Date(`${data.dateFrom}T12:00:00`).getTime();
    const toMs = new Date(`${data.dateTo}T12:00:00`).getTime();
    const maxSpanMs = 365 * 24 * 60 * 60 * 1000;
    if (toMs - fromMs > maxSpanMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Period cannot exceed 365 days",
        path: ["dateTo"],
      });
    }
  });

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
