export type PilotDraftJson = Record<string, unknown>;

export function pilotDraftDiditApproved(draft: PilotDraftJson): boolean {
  return Boolean(draft.diditKycApproved);
}

/** Map stored onboarding_step to wizard step after Didit was inserted as step 2. */
export function mapPilotOnboardingStep(
  storedStep: number,
  draft: PilotDraftJson,
  diditApprovedFromVr: boolean
): number {
  const diditDone = pilotDraftDiditApproved(draft) || diditApprovedFromVr;
  const step = Math.max(1, storedStep);

  if (!diditDone) {
    if (step <= 1) return step;
    return 2;
  }

  if (step === 2) return 3;
  return Math.min(step, 5);
}
