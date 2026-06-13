import { z } from "zod";

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: strongPassword,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "Name is required").max(100),
  lastName: z.string().min(1, "Name is required").max(100),
  dateOfBirth: z.string().refine((d) => new Date(d) <= eighteenYearsAgo, {
    message: "You must be at least 18 years old",
  }),
  phone: z.string().min(6, "Enter a valid phone number").max(30),
  weightKg: z.coerce
    .number()
    .min(30, "Weight must be between 30 and 300 kg")
    .max(300, "Weight must be between 30 and 300 kg"),
});

export const airfieldRequestSchema = z.object({
  airfieldName: z.string().min(2).max(200),
  icaoCode: z
    .string()
    .length(4)
    .regex(/^[A-Za-z0-9]{4}$/, "ICAO must be 4 characters")
    .transform((v) => v.toUpperCase()),
  location: z.string().min(2).max(500),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(6).max(30),
});

export const pilotDocumentSchema = z.object({
  licenseExpiresAt: z
    .string()
    .min(1, "Datum isteka licence je obavezan")
    .refine((d) => new Date(d) > new Date(), {
      message: "Datum isteka licence mora biti u budućnosti",
    }),
  medicalExpiresAt: z
    .string()
    .min(1, "Datum isteka medicinskog certifikata je obavezan")
    .refine((d) => new Date(d) > new Date(), {
      message: "Datum isteka medicinskog certifikata mora biti u budućnosti",
    }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
