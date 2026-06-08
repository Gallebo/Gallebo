"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/auth/form-message";
import { OptionalFileInput } from "@/components/onboarding/optional-file-input";
import { RoleChangeWarning } from "@/components/onboarding/role-change-warning";
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

export function AirfieldUpgradeForm() {
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
  const file = selectedFile instanceof File ? selectedFile : null;

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-8">
      <Link href="/passenger" className="text-sm text-primary hover:underline">
        ← Back to passenger dashboard
      </Link>
      <h1 className="text-2xl font-semibold">Upgrade to airfield operator</h1>
      <RoleChangeWarning />

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
              startTransition(() => {
                formAction(fd);
              });
            })}
          >
            <Input placeholder="Airfield name" {...form.register("airfieldName")} />
            <Input
              placeholder="ICAO (4 chars)"
              maxLength={4}
              {...form.register("icaoCode")}
            />
            <Input placeholder="Location" {...form.register("location")} />
            <Input type="email" placeholder="Contact email" {...form.register("contactEmail")} />
            <Input type="tel" placeholder="Contact phone" {...form.register("contactPhone")} />
            <div className="space-y-2">
              <label htmlFor="airfield-upgrade-license" className="text-sm font-medium">
                Operating licence (PDF/JPEG/PNG)
              </label>
              <OptionalFileInput
                id="airfield-upgrade-license"
                accept="image/jpeg,image/png,application/pdf"
                file={file}
                disabled={isPending}
                onFileChange={(f) => {
                  form.setValue(
                    "file",
                    (f ?? undefined) as unknown as File,
                    { shouldValidate: true }
                  );
                }}
              />
            </div>
            <RoleChangeWarning />
            <FormMessage error={state.error || form.formState.errors.root?.message} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Submitting…" : "Submit for admin review"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
