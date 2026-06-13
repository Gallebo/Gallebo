"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormError, FormField, FormLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { personalInfoSchema } from "@/lib/auth/schemas";

type PersonalInfoFormValues = z.input<typeof personalInfoSchema>;

const requiredMark = (
  <span aria-hidden="true" style={{ color: "var(--danger)" }}>
    {" "}
    *
  </span>
);

export function PersonalInfoFields({
  defaultValues,
}: {
  defaultValues?: {
    firstName?: string | null;
    lastName?: string | null;
    dateOfBirth?: string | null;
    phone?: string | null;
    weightKg?: string | number | null;
  };
}) {
  const w =
    defaultValues?.weightKg != null && defaultValues.weightKg !== ""
      ? String(defaultValues.weightKg)
      : "";

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      dateOfBirth: defaultValues?.dateOfBirth ?? "",
      phone: defaultValues?.phone ?? "",
      weightKg: w !== "" ? w : "",
    },
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField>
          <FormLabel htmlFor="firstName">
            First name
            {requiredMark}
          </FormLabel>
          <Input
            id="firstName"
            autoComplete="given-name"
            aria-invalid={Boolean(form.formState.errors.firstName)}
            {...form.register("firstName")}
          />
          <FormError>{form.formState.errors.firstName?.message}</FormError>
        </FormField>
        <FormField>
          <FormLabel htmlFor="lastName">
            Last name
            {requiredMark}
          </FormLabel>
          <Input
            id="lastName"
            autoComplete="family-name"
            aria-invalid={Boolean(form.formState.errors.lastName)}
            {...form.register("lastName")}
          />
          <FormError>{form.formState.errors.lastName?.message}</FormError>
        </FormField>
      </div>
      <FormField>
        <FormLabel htmlFor="dateOfBirth">
          Date of birth
          {requiredMark}
        </FormLabel>
        <Input
          id="dateOfBirth"
          type="date"
          aria-invalid={Boolean(form.formState.errors.dateOfBirth)}
          {...form.register("dateOfBirth")}
        />
        <FormError>{form.formState.errors.dateOfBirth?.message}</FormError>
      </FormField>
      <FormField>
        <FormLabel htmlFor="phone">
          Phone
          {requiredMark}
        </FormLabel>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={Boolean(form.formState.errors.phone)}
          {...form.register("phone")}
        />
        <FormError>{form.formState.errors.phone?.message}</FormError>
      </FormField>
      <FormField>
        <FormLabel htmlFor="weightKg">
          Weight (kg)
          {requiredMark}
        </FormLabel>
        <Input
          id="weightKg"
          type="number"
          min={30}
          max={300}
          aria-invalid={Boolean(form.formState.errors.weightKg)}
          {...form.register("weightKg")}
        />
        <FormError>{form.formState.errors.weightKg?.message}</FormError>
      </FormField>
    </>
  );
}
