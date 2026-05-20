import { z } from "zod";

export const approveAirfieldSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  country: z.string().min(2).max(100),
});

function checkboxBool(value: unknown): boolean {
  return value === true || value === "on" || value === "true";
}

export const updateAirfieldProfileSchema = z.object({
  name: z.string().min(2).max(200),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().max(50).optional().or(z.literal("")),
  working_hours: z.string().max(500).optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  country: z.string().min(2).max(100),
  has_fuel: z.preprocess(checkboxBool, z.boolean()),
  has_hangar: z.preprocess(checkboxBool, z.boolean()),
  has_rental: z.preprocess(checkboxBool, z.boolean()),
  description: z.string().max(5000).optional().or(z.literal("")),
  destination_info: z.string().max(10000).optional().or(z.literal("")),
});

export const createNoticeSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const createEventSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  link: z.string().url().optional().or(z.literal("")),
});

export const updateEventSchema = createEventSchema;
