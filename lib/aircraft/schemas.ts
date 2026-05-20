import { z } from "zod";

export const aircraftFormSchema = z.object({
  model: z.string().min(2).max(120),
  registration: z
    .string()
    .min(2)
    .max(12)
    .transform((v) => v.replace(/\s/g, "").toUpperCase()),
  seats: z.coerce.number().int().min(2).max(6),
});

export const aircraftPhotoReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});
