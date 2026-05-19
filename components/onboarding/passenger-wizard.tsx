"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { DiditStartButton } from "@/components/onboarding/didit-start-button";
import { PersonalInfoFields } from "@/components/onboarding/personal-info-fields";
import { StepCard } from "@/components/onboarding/step-card";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { FormMessage } from "@/components/auth/form-message";
import {
  savePassengerProfileAction,
  submitPassengerVerificationAction,
  type ActionState,
} from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";

const STEPS = ["Personal info", "ID document", "Didit KYC"] as const;

export function PassengerOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-8">
      <Link href="/onboarding" className="text-sm text-primary hover:underline">
        ← Choose role
      </Link>
      <h1 className="text-2xl font-semibold">Passenger verification</h1>
      <StepIndicator steps={[...STEPS]} current={step} />

      {step === 1 ? (
        <StepCard
          step={1}
          title="Personal information"
          description="Must be 18+ to use Gallebo"
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const result = await savePassengerProfileAction({}, fd);
                setState(result);
                if (!result.error) {
                  setStep(2);
                  router.refresh();
                }
              });
            }}
          >
            <PersonalInfoFields />
            <FormMessage error={state.error} success={state.success} />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Saving…" : "Save and continue"}
            </Button>
          </form>
        </StepCard>
      ) : null}

      {step === 2 ? (
        <StepCard
          step={2}
          title="ID document"
          description="JPEG, PNG or PDF, max 10MB"
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const result = await submitPassengerVerificationAction(fd);
                setState(result);
                if (!result.error) {
                  setStep(3);
                  router.refresh();
                }
              });
            }}
          >
            <PersonalInfoFields />
            <input type="hidden" name="type" value="id_card" />
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium">
                ID card scan
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                required
                className="block w-full text-sm"
              />
            </div>
            <FormMessage error={state.error} success={state.success} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button type="submit" className="w-full flex-1" disabled={pending}>
                {pending ? "Submitting…" : "Submit for verification"}
              </Button>
            </div>
          </form>
        </StepCard>
      ) : null}

      {step === 3 ? (
        <StepCard
          step={3}
          title="Didit identity check"
          description="Complete after your documents are submitted"
        >
          <div className="space-y-4">
            <DiditStartButton />
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
          </div>
        </StepCard>
      ) : null}
    </div>
  );
}
