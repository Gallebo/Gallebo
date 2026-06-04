"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { DiditKycStep } from "@/components/onboarding/didit-kyc-step";
import { PersonalInfoFields } from "@/components/onboarding/personal-info-fields";
import { StepCard } from "@/components/onboarding/step-card";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { FormMessage } from "@/components/auth/form-message";
import {
  savePassengerProfileAction,
  savePilotDraftAction,
  savePilotLicenseDraftStepAction,
  savePilotMedicalDraftStepAction,
  submitPilotVerificationAction,
  type ActionState,
} from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Json } from "@/types/database";

const STEP_LABELS = ["Personal", "Didit KYC", "Licence", "Medical", "Tax"] as const;
const MAX_STEP = STEP_LABELS.length;

type DraftJson = Record<string, unknown>;

function draftFromJson(raw: Json | null | undefined): DraftJson {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return { ...raw };
}

function appendPilotDraftToFormData(fd: FormData, draft: DraftJson) {
  fd.set("firstName", String(draft.firstName ?? ""));
  fd.set("lastName", String(draft.lastName ?? ""));
  fd.set("dateOfBirth", String(draft.dateOfBirth ?? ""));
  fd.set("phone", String(draft.phone ?? ""));
  fd.set("weightKg", String(draft.weightKg ?? ""));
  fd.set("licenseExpiresAt", String(draft.licenseExpiresAt ?? ""));
  fd.set("medicalExpiresAt", String(draft.medicalExpiresAt ?? ""));
  fd.set("licenseType", String(draft.licenseType ?? "ppl_license"));
  fd.set("licenseStoragePath", String(draft.licenseStoragePath ?? ""));
  fd.set("licenseDocumentId", String(draft.licenseDocumentId ?? ""));
  fd.set("medicalStoragePath", String(draft.medicalStoragePath ?? ""));
  fd.set("medicalDocumentId", String(draft.medicalDocumentId ?? ""));
}

function hasLicenseDocument(draft: DraftJson) {
  return Boolean(String(draft.licenseStoragePath ?? "").length > 0);
}

function hasMedicalDocument(draft: DraftJson) {
  return Boolean(String(draft.medicalStoragePath ?? "").length > 0);
}

export function PilotOnboardingWizard({
  initialStep,
  initialDraft,
  diditKycComplete,
  profileDefaults,
}: {
  initialStep: number;
  initialDraft: Json | null | undefined;
  diditKycComplete: boolean;
  profileDefaults: {
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    phone: string | null;
    weightKg: number | null;
  };
}) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), MAX_STEP));
  const [draft, setDraft] = useState<DraftJson>(() => {
    const d = draftFromJson(initialDraft);
    const licenseType =
      d.licenseType === "lapl_license" ? "lapl_license" : "ppl_license";
    return {
      firstName: (d.firstName as string) ?? profileDefaults.firstName ?? "",
      lastName: (d.lastName as string) ?? profileDefaults.lastName ?? "",
      dateOfBirth: (d.dateOfBirth as string) ?? profileDefaults.dateOfBirth ?? "",
      phone: (d.phone as string) ?? profileDefaults.phone ?? "",
      weightKg:
        d.weightKg != null
          ? String(d.weightKg)
          : profileDefaults.weightKg != null
            ? String(profileDefaults.weightKg)
            : "",
      licenseExpiresAt: (d.licenseExpiresAt as string) ?? "",
      medicalExpiresAt: (d.medicalExpiresAt as string) ?? "",
      licenseType,
      licenseStoragePath: (d.licenseStoragePath as string) ?? "",
      licenseDocumentId: (d.licenseDocumentId as string) ?? "",
      medicalStoragePath: (d.medicalStoragePath as string) ?? "",
      medicalDocumentId: (d.medicalDocumentId as string) ?? "",
      diditKycApproved: Boolean(d.diditKycApproved) || diditKycComplete,
    };
  });
  const [licenseType, setLicenseType] = useState<"ppl_license" | "lapl_license">(
    () =>
      draft.licenseType === "lapl_license" ? "lapl_license" : "ppl_license"
  );
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  const applyStepResult = useCallback(
    (result: ActionState, nextStep: number) => {
      setState(result);
      if (!result.error) {
        if (result.draft) setDraft(result.draft);
        setStep(nextStep);
        router.refresh();
      }
    },
    [router]
  );

  const onDiditApproved = useCallback(() => {
    setDraft((d) => ({ ...d, diditKycApproved: true }));
    setStep(3);
    router.refresh();
  }, [router]);

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-8">
      <Link href="/onboarding" className="text-sm text-primary hover:underline">
        ← Choose role
      </Link>
      <h1 className="text-2xl font-semibold">Pilot verification</h1>
      <StepIndicator steps={[...STEP_LABELS]} current={step} />
      <p className="text-sm text-muted-foreground">
        Identity is verified with Didit. Admin reviews only your licence and medical
        certificate.
      </p>
      <FormMessage error={state.error} success={state.success} />

      {step === 1 ? (
        <StepCard step={1} title="Personal information" description="Same as passenger profile">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const profileRes = await savePassengerProfileAction({}, fd);
                if (profileRes.error) {
                  setState(profileRes);
                  return;
                }
                const nextDraft: DraftJson = {
                  ...draft,
                  firstName: String(fd.get("firstName") ?? ""),
                  lastName: String(fd.get("lastName") ?? ""),
                  dateOfBirth: String(fd.get("dateOfBirth") ?? ""),
                  phone: String(fd.get("phone") ?? ""),
                  weightKg: String(fd.get("weightKg") ?? ""),
                };
                const result = await savePilotDraftAction(2, nextDraft);
                setState(result);
                if (!result.error) {
                  if (result.draft) setDraft(result.draft);
                  setStep(2);
                  router.refresh();
                }
              });
            }}
          >
            <PersonalInfoFields
              defaultValues={{
                firstName: String(draft.firstName ?? ""),
                lastName: String(draft.lastName ?? ""),
                dateOfBirth: String(draft.dateOfBirth ?? ""),
                phone: String(draft.phone ?? ""),
                weightKg: String(draft.weightKg ?? ""),
              }}
            />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Saving…" : "Save draft & continue"}
            </Button>
          </form>
        </StepCard>
      ) : null}

      {step === 2 ? (
        <StepCard
          step={2}
          title="Didit identity check"
          description="Complete before uploading licence and medical documents."
        >
          <DiditKycStep
            requestedRole="pilot"
            stepNumber={2}
            onApproved={onDiditApproved}
            onBack={() => setStep(1)}
            showContinue
          />
        </StepCard>
      ) : null}

      {step === 3 ? (
        <StepCard step={3} title="PPL / LAPL licence" description="Upload + expiry date">
          <div className="space-y-4">
            {hasLicenseDocument(draft) ? (
              <p className="text-sm text-muted-foreground">
                Licence already uploaded. Choose a new file below to replace it.
              </p>
            ) : null}
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="licenseType"
                  value="ppl_license"
                  checked={licenseType === "ppl_license"}
                  onChange={() => setLicenseType("ppl_license")}
                />
                PPL
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="licenseType"
                  value="lapl_license"
                  checked={licenseType === "lapl_license"}
                  onChange={() => setLicenseType("lapl_license")}
                />
                LAPL
              </label>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(ev) => setLicenseFile(ev.target.files?.[0] ?? null)}
            />
            <Input
              type="date"
              value={String(draft.licenseExpiresAt ?? "")}
              onChange={(ev) =>
                setDraft((d) => ({ ...d, licenseExpiresAt: ev.target.value }))
              }
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={
                  pending ||
                  (!licenseFile && !hasLicenseDocument(draft)) ||
                  !String(draft.licenseExpiresAt ?? "")
                }
                onClick={() =>
                  startTransition(async () => {
                    const fd = new FormData();
                    if (licenseFile) fd.set("file", licenseFile);
                    fd.set("licenseType", licenseType);
                    fd.set("licenseExpiresAt", String(draft.licenseExpiresAt));
                    appendPilotDraftToFormData(fd, {
                      ...draft,
                      licenseType,
                    });
                    const result = await savePilotLicenseDraftStepAction(fd);
                    applyStepResult(result, 4);
                  })
                }
              >
                {pending ? "Uploading…" : "Save draft & continue"}
              </Button>
            </div>
          </div>
        </StepCard>
      ) : null}

      {step === 4 ? (
        <StepCard step={4} title="Medical certificate" description="Upload + expiry date">
          <div className="space-y-4">
            {hasMedicalDocument(draft) ? (
              <p className="text-sm text-muted-foreground">
                Medical certificate already uploaded. Choose a new file below to replace it.
              </p>
            ) : null}
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(ev) => setMedicalFile(ev.target.files?.[0] ?? null)}
            />
            <Input
              type="date"
              value={String(draft.medicalExpiresAt ?? "")}
              onChange={(ev) =>
                setDraft((d) => ({ ...d, medicalExpiresAt: ev.target.value }))
              }
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={
                  pending ||
                  (!medicalFile && !hasMedicalDocument(draft)) ||
                  !String(draft.medicalExpiresAt ?? "")
                }
                onClick={() =>
                  startTransition(async () => {
                    const fd = new FormData();
                    if (medicalFile) fd.set("file", medicalFile);
                    fd.set("medicalExpiresAt", String(draft.medicalExpiresAt));
                    appendPilotDraftToFormData(fd, draft);
                    const result = await savePilotMedicalDraftStepAction(fd);
                    applyStepResult(result, 5);
                  })
                }
              >
                {pending ? "Uploading…" : "Save draft & continue"}
              </Button>
            </div>
          </div>
        </StepCard>
      ) : null}

      {step === 5 ? (
        <StepCard
          step={5}
          title="Tax declaration & submit"
          description="Admin will review your licence and medical certificate only."
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!hasLicenseDocument(draft) || !hasMedicalDocument(draft)) {
                setState({
                  error:
                    "Please go back to steps 3–4 and upload your licence and medical certificate.",
                });
                return;
              }
              const formEl = e.currentTarget;
              const tax = formEl.querySelector(
                'input[name="taxDeclaration"]'
              ) as HTMLInputElement | null;
              if (!tax?.checked) {
                setState({ error: "You must accept the tax declaration." });
                return;
              }
              const fd = new FormData();
              fd.append("firstName", String(draft.firstName));
              fd.append("lastName", String(draft.lastName));
              fd.append("dateOfBirth", String(draft.dateOfBirth));
              fd.append("phone", String(draft.phone));
              fd.append("weightKg", String(draft.weightKg));
              fd.append("licenseType", String(draft.licenseType ?? licenseType));
              fd.append("licenseExpiresAt", String(draft.licenseExpiresAt));
              fd.append("licenseStoragePath", String(draft.licenseStoragePath));
              fd.append("medicalExpiresAt", String(draft.medicalExpiresAt));
              fd.append("medicalStoragePath", String(draft.medicalStoragePath));
              fd.append("taxDeclaration", "on");
              if (licenseFile) fd.append("licenseFile", licenseFile);
              if (medicalFile) fd.append("medicalFile", medicalFile);
              startTransition(async () => {
                const result = await submitPilotVerificationAction(fd);
                if (result?.error) setState(result);
              });
            }}
          >
            <label className="flex items-start gap-2 text-sm">
              <input name="taxDeclaration" type="checkbox" required className="mt-1" />
              I declare that my tax information is accurate for flight cost sharing.
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setStep(4)}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? "Submitting…" : "Submit for admin review"}
              </Button>
            </div>
          </form>
        </StepCard>
      ) : null}
    </div>
  );
}
