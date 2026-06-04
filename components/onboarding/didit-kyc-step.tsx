"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DiditStartButton } from "@/components/onboarding/didit-start-button";
import { FormMessage } from "@/components/auth/form-message";
import {
  getDiditVerificationStatusAction,
  prepareDiditVerificationAction,
  type ActionState,
} from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";

type DiditRole = "passenger" | "pilot";

export function DiditKycStep({
  requestedRole,
  stepNumber,
  title = "Didit identity check",
  description = "Complete identity verification before continuing.",
  onApproved,
  onBack,
  showContinue = requestedRole === "pilot",
}: {
  requestedRole: DiditRole;
  stepNumber: number;
  title?: string;
  description?: string;
  onApproved: () => void;
  onBack?: () => void;
  showContinue?: boolean;
}) {
  const [state, setState] = useState<ActionState>({});
  const [approved, setApproved] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const preparing = useRef(false);
  const notifiedApproved = useRef(false);

  const refreshStatus = useCallback(async () => {
    const result = await getDiditVerificationStatusAction();
    if (result.error) {
      setState({ error: result.error });
      return;
    }
    const isApproved = Boolean(result.approved);
    setApproved(isApproved);
    setStatusLabel(result.diditStatus ?? null);
    if (isApproved && !notifiedApproved.current) {
      notifiedApproved.current = true;
      onApproved();
    }
  }, [onApproved]);

  useEffect(() => {
    if (preparing.current) return;
    preparing.current = true;

    let cancelled = false;
    void (async () => {
      const prep = await prepareDiditVerificationAction(requestedRole);
      if (cancelled) return;
      if (prep.error) {
        setState({ error: prep.error });
        return;
      }
      await refreshStatus();
    })();

    return () => {
      cancelled = true;
    };
  }, [requestedRole, refreshStatus]);

  useEffect(() => {
    if (approved) return;
    const id = window.setInterval(() => {
      void refreshStatus();
    }, 4000);
    return () => window.clearInterval(id);
  }, [approved, refreshStatus]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{description}</p>
      {approved ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          Identity verification approved. You can continue.
        </p>
      ) : statusLabel ? (
        <p className="text-sm text-muted-foreground">
          Current status: <span className="font-medium">{statusLabel}</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Start Didit verification, then return here. This page updates automatically.
        </p>
      )}
      <DiditStartButton disabled={approved} />
      <FormMessage error={state.error} success={state.success} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
        ) : null}
        {showContinue ? (
          <Button
            type="button"
            className="flex-1"
            disabled={!approved}
            onClick={() => onApproved()}
          >
            Continue to licence upload
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">Step {stepNumber}</p>
    </div>
  );
}
