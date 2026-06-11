"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { OptionalFileInput } from "@/components/onboarding/optional-file-input";
import { RoleChangeWarning } from "@/components/onboarding/role-change-warning";
import { StepCard } from "@/components/onboarding/step-card";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { FormMessage } from "@/components/auth/form-message";
import {
  checkPilotUpgradeIdentityAction,
  savePilotLicenseDraftStepAction,
  savePilotMedicalDraftStepAction,
  submitPilotUpgradeAction,
  type ActionState,
} from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Json } from "@/types/database";

const STEP_LABELS = ["Licence", "Medical", "Tax"] as const;
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

function mapUpgradeStep(storedStep: number): number {
  if (storedStep <= 3) return 1;
  if (storedStep === 4) return 2;
  return 3;
}

export function PilotUpgradeWizard({
  initialStep,
  initialDraft,
  profileDefaults,
}: {
  initialStep: number;
  initialDraft: Json | null | undefined;
  profileDefaults: {
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    phone: string | null;
    weightKg: number | null;
  };
}) {
  const router = useRouter();
  const [step, setStep] = useState(
    Math.min(Math.max(mapUpgradeStep(initialStep), 1), MAX_STEP)
  );
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

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-8">
      <Link href="/passenger" className="text-sm text-primary hover:underline">
        ← Back to passenger dashboard
      </Link>
      <h1 className="text-2xl font-semibold">Upgrade to pilot</h1>
      <RoleChangeWarning />
      <StepIndicator steps={[...STEP_LABELS]} current={step} />
      <p className="text-sm text-muted-foreground">
        Your identity is already verified. Upload your licence and medical
        certificate for admin review.
      </p>
      <FormMessage error={state.error} success={state.success} />

      {step === 1 ? (
        <StepCard step={1} title="PPL / LAPL licence" description="Upload + expiry date">
          <div className="space-y-4">
            {hasLicenseDocument(draft) ? (
              <p className="text-sm text-muted-foreground">
                Licence already uploaded. Choose a new file below to replace it.
              </p>
            ) : null}
            <div className="flex gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="licenseType"
                  value="ppl_license"
                  checked={licenseType === "ppl_license"}
                  onChange={() => setLicenseType("ppl_license")}
                />
                PPL
              </label>
              <label className="flex cursor-pointer items-center gap-2">
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
            <OptionalFileInput
              id="pilot-upgrade-license-file"
              accept="image/jpeg,image/png,application/pdf"
              file={licenseFile}
              disabled={pending}
              onFileChange={setLicenseFile}
            />
            <div className="space-y-2">
              <label
                htmlFor="pilot-upgrade-license-expires"
                className="text-sm font-medium"
              >
                Licence expiry date
              </label>
              <Input
                id="pilot-upgrade-license-expires"
                type="date"
                value={String(draft.licenseExpiresAt ?? "")}
                onChange={(ev) =>
                  setDraft((d) => ({ ...d, licenseExpiresAt: ev.target.value }))
                }
              />
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={
                pending ||
                (!licenseFile && !hasLicenseDocument(draft)) ||
                !String(draft.licenseExpiresAt ?? "")
              }
              onClick={() =>
                startTransition(async () => {
                  const identityCheck = await checkPilotUpgradeIdentityAction();
                  if (identityCheck.error) {
                    setState(identityCheck);
                    return;
                  }
                  const fd = new FormData();
                  if (licenseFile) fd.set("file", licenseFile);
                  fd.set("licenseType", licenseType);
                  fd.set("licenseExpiresAt", String(draft.licenseExpiresAt));
                  appendPilotDraftToFormData(fd, {
                    ...draft,
                    licenseType,
                  });
                  const result = await savePilotLicenseDraftStepAction(fd);
                  applyStepResult(result, 2);
                })
              }
            >
              {pending ? "Uploading…" : "Save draft & continue"}
            </Button>
          </div>
        </StepCard>
      ) : null}

      {step === 2 ? (
        <StepCard step={2} title="Medical certificate" description="Upload + expiry date">
          <div className="space-y-4">
            {hasMedicalDocument(draft) ? (
              <p className="text-sm text-muted-foreground">
                Medical certificate already uploaded. Choose a new file below to replace it.
              </p>
            ) : null}
            <OptionalFileInput
              id="pilot-upgrade-medical-file"
              accept="image/jpeg,image/png,application/pdf"
              file={medicalFile}
              disabled={pending}
              onFileChange={setMedicalFile}
            />
            <Input
              type="date"
              value={String(draft.medicalExpiresAt ?? "")}
              onChange={(ev) =>
                setDraft((d) => ({ ...d, medicalExpiresAt: ev.target.value }))
              }
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
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
                    applyStepResult(result, 3);
                  })
                }
              >
                {pending ? "Uploading…" : "Save draft & continue"}
              </Button>
            </div>
          </div>
        </StepCard>
      ) : null}

      {step === 3 ? (
        <StepCard
          step={3}
          title="Tax declaration & submit"
          description="Admin will review your licence and medical certificate."
        >
          <RoleChangeWarning />
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!hasLicenseDocument(draft) || !hasMedicalDocument(draft)) {
                setState({
                  error:
                    "Please go back and upload your licence and medical certificate.",
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
                const result = await submitPilotUpgradeAction(fd);
                if (result?.error) setState(result);
              });
            }}
          >
            <label className="flex items-start gap-2 text-sm">
              <input name="taxDeclaration" type="checkbox" required className="mt-1" />
              I declare that my tax information is accurate for flight cost sharing.
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
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
