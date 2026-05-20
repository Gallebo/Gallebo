"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { addAircraftAction } from "@/lib/aircraft/actions";

export function NewAircraftForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(addAircraftAction, {});

  useEffect(() => {
    if (state.success && state.aircraftId) {
      router.push(`/pilot/aircraft/${state.aircraftId}`);
    }
  }, [state.success, state.aircraftId, router]);

  return (
    <form action={formAction} className="max-w-lg space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="model">
          Model
        </label>
        <Input
          id="model"
          name="model"
          placeholder="e.g. Cessna 172"
          required
          minLength={2}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="registration">
          Registration
        </label>
        <Input
          id="registration"
          name="registration"
          className="font-mono uppercase"
          required
          minLength={2}
          maxLength={12}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="seats">
          Seats (incl. pilot, max 6)
        </label>
        <Input
          id="seats"
          name="seats"
          type="number"
          min={2}
          max={6}
          defaultValue={4}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Photos</label>
        <p className="text-xs text-muted-foreground">JPEG or PNG, minimum 1, max 5MB each.</p>
        <input
          type="file"
          name="photos"
          accept="image/jpeg,image/png"
          multiple
          required
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton label="Create aircraft" />
    </form>
  );
}
