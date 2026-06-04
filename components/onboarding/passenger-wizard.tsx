"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { DiditKycStep } from "@/components/onboarding/didit-kyc-step";
import { PersonalInfoFields } from "@/components/onboarding/personal-info-fields";
import { StepCard } from "@/components/onboarding/step-card";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { FormMessage } from "@/components/auth/form-message";
import { savePassengerProfileAction, type ActionState } from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";

const STEPS = ["Personal info", "Didit KYC"] as const;

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
          title="Didit identity check"
          description="Verify your identity with Didit. Admin does not review a separate ID upload."
        >
          <DiditKycStep
            requestedRole="passenger"
            stepNumber={2}
            onApproved={() => router.push("/dashboard")}
            onBack={() => setStep(1)}
            showContinue={false}
          />
        </StepCard>
      ) : null}
    </div>
  );
}
