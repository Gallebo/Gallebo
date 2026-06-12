"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/auth/form-message";
import { OptionalFileInput } from "@/components/onboarding/optional-file-input";
import { submitAirfieldRequestAction, type ActionState } from "@/lib/onboarding/actions";
import { airfieldRequestSchema } from "@/lib/auth/schemas";
import { Button } from "@/components/ui/button";
import { FormError, FormField, FormLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

const airfieldFormSchema = airfieldRequestSchema.extend({
  file: z
    .custom<File | undefined>((v) => v === undefined || v instanceof File)
    .refine((v) => v instanceof File, { message: "Please upload a file" }),
});

const initialState: ActionState = {};

export function AirfieldOnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    submitAirfieldRequestAction,
    initialState
  );
  const [, startTransition] = useTransition();
  const form = useForm<z.input<typeof airfieldFormSchema>>({
    resolver: zodResolver(airfieldFormSchema),
    defaultValues: {
      airfieldName: "",
      icaoCode: "",
      location: "",
      contactEmail: "",
      contactPhone: "",
      file: undefined as unknown as File,
    },
  });

  useEffect(() => {
    if (state.error) {
      form.setError("root", { message: state.error });
    }
  }, [state.error, form]);

  const selectedFile = form.watch("file");
  const file =
    selectedFile instanceof File ? selectedFile : null;

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-8">
      <Link href="/onboarding" className="text-sm text-primary hover:underline">
        ← Choose role
      </Link>
      <h1 className="text-2xl font-semibold">Airfield operator request</h1>

      <section className="space-y-5">
        <header className="border-b pb-4" style={{ borderColor: "var(--line)" }}>
          <h2 className="text-[1.15rem] font-semibold" style={{ color: "var(--ink)" }}>
            Airfield details
          </h2>
          <p className="mt-1.5 text-[14px]" style={{ color: "var(--ink-2)" }}>
            Admin will review your operating licence
          </p>
        </header>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((data) => {
            form.clearErrors("root");
            if (!(data.file instanceof File)) return;
            const fd = new FormData();
            fd.append("airfieldName", data.airfieldName);
            fd.append("icaoCode", data.icaoCode);
            fd.append("location", data.location);
            fd.append("contactEmail", data.contactEmail);
            fd.append("contactPhone", data.contactPhone);
            fd.append("type", "airfield_operating_license");
            fd.append("file", data.file);
            startTransition(() => {
              formAction(fd);
            });
          })}
        >
          <FormField>
            <FormLabel htmlFor="airfieldName">Airfield name</FormLabel>
            <Input id="airfieldName" placeholder="e.g. Split Airport" {...form.register("airfieldName")} />
            <FormError>{form.formState.errors.airfieldName?.message}</FormError>
          </FormField>
          <FormField>
            <FormLabel htmlFor="icaoCode">ICAO code</FormLabel>
            <Input
              id="icaoCode"
              placeholder="LDSP"
              maxLength={4}
              className="font-mono uppercase"
              {...form.register("icaoCode")}
            />
            <FormError>{form.formState.errors.icaoCode?.message}</FormError>
          </FormField>
          <FormField>
            <FormLabel htmlFor="location">Location</FormLabel>
            <Input id="location" placeholder="City, country" {...form.register("location")} />
            <FormError>{form.formState.errors.location?.message}</FormError>
          </FormField>
          <FormField>
            <FormLabel htmlFor="contactEmail">Contact email</FormLabel>
            <Input id="contactEmail" type="email" placeholder="ops@airfield.example" {...form.register("contactEmail")} />
            <FormError>{form.formState.errors.contactEmail?.message}</FormError>
          </FormField>
          <FormField>
            <FormLabel htmlFor="contactPhone">Contact phone</FormLabel>
            <Input id="contactPhone" type="tel" placeholder="+385 …" {...form.register("contactPhone")} />
            <FormError>{form.formState.errors.contactPhone?.message}</FormError>
          </FormField>
          <FormField>
            <FormLabel htmlFor="file">Operating licence</FormLabel>
            <OptionalFileInput
              id="file"
              accept="image/jpeg,image/png,application/pdf"
              file={file}
              disabled={isPending}
              onFileChange={(f) => {
                form.setValue(
                  "file",
                  (f ?? undefined) as unknown as File,
                  { shouldValidate: true },
                );
              }}
            />
            <FormError>
              {form.formState.errors.file
                ? String(form.formState.errors.file.message)
                : null}
            </FormError>
          </FormField>
          <FormMessage error={form.formState.errors.root?.message} success={state.success} />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit request"}
          </Button>
        </form>
      </section>
    </div>
  );
}
