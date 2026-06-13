"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { FileInput } from "@/components/ui/file-input";
import { FormError, FormField, FormHint, FormLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { addAircraftAction } from "@/lib/aircraft/actions";

const requiredMark = (
  <span aria-hidden="true" style={{ color: "var(--danger)" }}>
    {" "}
    *
  </span>
);

export function NewAircraftForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(addAircraftAction, {});

  useEffect(() => {
    if (state.success && state.aircraftId) {
      router.push(`/pilot/aircraft/${state.aircraftId}`);
    }
  }, [state.success, state.aircraftId, router]);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <FormField>
        <FormLabel htmlFor="model">
          Model
          {requiredMark}
        </FormLabel>
        <Input
          id="model"
          name="model"
          placeholder="e.g. Cessna 172"
          required
          minLength={2}
        />
      </FormField>
      <FormField>
        <FormLabel htmlFor="registration">
          Registration
          {requiredMark}
        </FormLabel>
        <Input
          id="registration"
          name="registration"
          className="font-mono uppercase"
          placeholder="9A-ABC"
          required
          minLength={2}
          maxLength={12}
        />
      </FormField>
      <FormField>
        <FormLabel htmlFor="seats">
          Seats (incl. pilot, max 6)
          {requiredMark}
        </FormLabel>
        <Input
          id="seats"
          name="seats"
          type="number"
          min={2}
          max={6}
          defaultValue={4}
          required
        />
      </FormField>

      <FormField>
        <FormLabel htmlFor="photos">
          Photos
          {requiredMark}
        </FormLabel>
        <FormHint>JPEG or PNG, minimum 1, max 5MB each.</FormHint>
        <FileInput
          id="photos"
          name="photos"
          accept="image/jpeg,image/png"
          required
          hint="Select one or more images"
        />
      </FormField>

      <FormError>{state.error}</FormError>
      <SubmitButton label="Create aircraft" />
    </form>
  );
}
