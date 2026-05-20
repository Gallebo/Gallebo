"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { updatePilotIbanAction } from "@/lib/pilot/actions";

export function PilotIbanForm({ defaultHolderName }: { defaultHolderName: string }) {
  const [state, formAction] = useActionState(updatePilotIbanAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="iban">
          New IBAN
        </label>
        <Input
          id="iban"
          name="iban"
          autoComplete="off"
          placeholder="EU IBAN"
          className="font-mono"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="accountHolderName">
          Account holder (optional if unchanged)
        </label>
        <Input
          id="accountHolderName"
          name="accountHolderName"
          defaultValue={defaultHolderName}
          placeholder="As on bank records"
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      <SubmitButton label="Update IBAN" />
    </form>
  );
}
