"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/auth/form-message";
import { submitAirfieldRequestAction, type ActionState } from "@/lib/onboarding/actions";
import { airfieldRequestSchema } from "@/lib/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-8">
      <Link href="/onboarding" className="text-sm text-primary hover:underline">
        ← Choose role
      </Link>
      <h1 className="text-2xl font-semibold">Airfield operator request</h1>

      <Card>
        <CardHeader>
          <CardTitle>Airfield details</CardTitle>
          <CardDescription>Admin will review your operating licence</CardDescription>
        </CardHeader>
        <CardContent>
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
              formAction(fd);
            })}
          >
            <Input placeholder="Airfield name" {...form.register("airfieldName")} />
            {form.formState.errors.airfieldName ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.airfieldName.message}
              </p>
            ) : null}
            <Input
              placeholder="ICAO (4 chars)"
              maxLength={4}
              {...form.register("icaoCode")}
            />
            {form.formState.errors.icaoCode ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.icaoCode.message}
              </p>
            ) : null}
            <Input placeholder="Location" {...form.register("location")} />
            <Input type="email" placeholder="Contact email" {...form.register("contactEmail")} />
            <Input type="tel" placeholder="Contact phone" {...form.register("contactPhone")} />
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium">
                Operating licence (PDF/JPEG/PNG)
              </label>
              <input
                id="file"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="block w-full text-sm"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) form.setValue("file", f, { shouldValidate: true });
                }}
              />
              {form.formState.errors.file ? (
                <p className="text-sm text-destructive">
                  {String(form.formState.errors.file.message)}
                </p>
              ) : null}
            </div>
            <FormMessage error={form.formState.errors.root?.message} success={state.success} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
