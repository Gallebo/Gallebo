"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { PersonalInfoFields } from "@/components/onboarding/personal-info-fields";
import { StepCard } from "@/components/onboarding/step-card";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { FormMessage } from "@/components/auth/form-message";
import {
  savePassengerProfileAction,
  savePilotDraftAction,
  submitPilotVerificationAction,
  type ActionState,
} from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Json } from "@/types/database";

const STEP_LABELS = ["Personal", "Licence", "Medical", "Payout", "Tax"] as const;

type DraftJson = Record<string, unknown>;

function draftFromJson(raw: Json | null | undefined): DraftJson {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return { ...raw };
}

export function PilotOnboardingWizard({
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
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 5));
  const [draft, setDraft] = useState<DraftJson>(() => {
    const d = draftFromJson(initialDraft);
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
      accountHolderName: (d.accountHolderName as string) ?? "",
    };
  });
  const [iban, setIban] = useState("");
  const [licenseType, setLicenseType] = useState<"ppl_license" | "lapl_license">("ppl_license");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  const persistDraft = useCallback(
    async (nextStep: number, nextDraft: DraftJson) => {
      const result = await savePilotDraftAction(nextStep, nextDraft);
      setState(result);
      if (!result.error) {
        setDraft(nextDraft);
        setStep(nextStep);
        router.refresh();
      }
    },
    [router]
  );

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-8">
      <Link href="/onboarding" className="text-sm text-primary hover:underline">
        ← Choose role
      </Link>
      <h1 className="text-2xl font-semibold">Pilot verification</h1>
      <StepIndicator steps={[...STEP_LABELS]} current={step} />
      <p className="text-sm text-muted-foreground">
        IBAN is stored in Vault server-side and is never returned to the browser.
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
                  firstName: String(fd.get("firstName") ?? ""),
                  lastName: String(fd.get("lastName") ?? ""),
                  dateOfBirth: String(fd.get("dateOfBirth") ?? ""),
                  phone: String(fd.get("phone") ?? ""),
                  weightKg: String(fd.get("weightKg") ?? ""),
                  licenseExpiresAt: draft.licenseExpiresAt,
                  medicalExpiresAt: draft.medicalExpiresAt,
                  accountHolderName: draft.accountHolderName,
                };
                await persistDraft(2, nextDraft);
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
        <StepCard step={2} title="PPL / LAPL licence" description="Upload + expiry date">
          <div className="space-y-4">
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
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={pending || !licenseFile}
                onClick={() =>
                  startTransition(() =>
                    persistDraft(3, {
                      ...draft,
                      licenseExpiresAt: draft.licenseExpiresAt,
                    })
                  )
                }
              >
                {pending ? "Saving…" : "Save draft & continue"}
              </Button>
            </div>
          </div>
        </StepCard>
      ) : null}

      {step === 3 ? (
        <StepCard step={3} title="Medical certificate" description="Upload + expiry date">
          <div className="space-y-4">
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
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={pending || !medicalFile}
                onClick={() =>
                  startTransition(() =>
                    persistDraft(4, {
                      ...draft,
                      medicalExpiresAt: draft.medicalExpiresAt,
                    })
                  )
                }
              >
                {pending ? "Saving…" : "Save draft & continue"}
              </Button>
            </div>
          </div>
        </StepCard>
      ) : null}

      {step === 4 ? (
        <StepCard
          step={4}
          title="Payout"
          description="IBAN is submitted only on the final step (not stored in draft JSON)."
        >
          <div className="space-y-4">
            <Input
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="IBAN"
              autoComplete="off"
              className="font-mono"
            />
            <Input
              value={String(draft.accountHolderName ?? "")}
              onChange={(e) =>
                setDraft((d) => ({ ...d, accountHolderName: e.target.value }))
              }
              placeholder="Account holder name"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={pending}
                onClick={() =>
                  startTransition(() =>
                    persistDraft(5, {
                      ...draft,
                      accountHolderName: draft.accountHolderName,
                    })
                  )
                }
              >
                {pending ? "Saving…" : "Save draft & continue"}
              </Button>
            </div>
          </div>
        </StepCard>
      ) : null}

      {step === 5 ? (
        <StepCard step={5} title="Tax declaration & submit" description="Admin will review your documents">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!licenseFile || !medicalFile) {
                setState({
                  error:
                    "Please go back to steps 2–3 and select your licence and medical files.",
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
              fd.append("licenseFile", licenseFile);
              fd.append("licenseType", licenseType);
              fd.append("licenseExpiresAt", String(draft.licenseExpiresAt));
              fd.append("medicalFile", medicalFile);
              fd.append("medicalExpiresAt", String(draft.medicalExpiresAt));
              fd.append("iban", iban);
              fd.append("accountHolderName", String(draft.accountHolderName));
              fd.append("taxDeclaration", "on");
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
            <p className="text-xs text-muted-foreground">
              Confirm IBAN for submit: it is not reloaded from the server.
            </p>
            <Input
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="IBAN"
              required
              className="font-mono"
            />
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
