"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { StepCard } from "@/components/onboarding/step-card";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import {
  AirfieldCombobox,
  type AirfieldOption,
} from "@/components/flights/airfield-combobox";
import { ChoiceCheckbox, ChoiceGroup } from "@/components/ui/choice-group";
import { Button } from "@/components/ui/button";
import { FormField, FormHint, FormLabel } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FLIGHT_LANGUAGE_LABELS,
  FLIGHT_TYPE_LABELS,
  MAX_FLIGHT_PHOTOS,
  MIN_FLIGHT_PHOTOS,
} from "@/lib/flights/constants";
import { getPilotWaitingPassengersCountAction } from "@/lib/alerts/actions";
import {
  clearFlightPublishDraftAction,
  loadFlightDraftAction,
  previewPublishPricingAction,
  removeFlightDraftPhotoAction,
  saveFlightDraftAction,
  uploadFlightDraftPhotoAction,
} from "@/lib/flights/actions";
import { FLIGHT_PHOTOS_BUCKET } from "@/lib/flights/constants";
import { sanitizePhotoPathsForPublish } from "@/lib/flights/sanitize-draft";
import type { FlightActionState } from "@/lib/flights/actions";
import {
  computePricePerPassenger,
  type FlightDraft,
} from "@/lib/flights/schemas";
type AircraftRow = {
  id: string;
  model: string;
  registration: string;
  seats: number;
};

function draftPhotoPublicUrl(path: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${FLIGHT_PHOTOS_BUCKET}/${path}`;
}

function draftHasContent(draft: FlightDraft, step: number): boolean {
  if (step > 1) return true;
  return Boolean(
    draft.flightType ||
      draft.aircraftId ||
      draft.rentedModel ||
      draft.departureAirfieldId ||
      draft.description ||
      (draft.photoPaths?.length ?? 0) > 0,
  );
}

export function PublishFlightWizard({
  aircraftList,
  stripeOnboardingComplete,
}: {
  aircraftList: AircraftRow[];
  stripeOnboardingComplete: boolean;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<FlightDraft>({});
  const [draftReady, setDraftReady] = useState(false);
  const [draftLoadError, setDraftLoadError] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [pricePreview, setPricePreview] = useState<{
    warning: string | null;
    avg: number | null;
  }>({ warning: null, avg: null });
  const [waitingPassengers, setWaitingPassengers] = useState<number | null>(null);
  const [photoUploadProgress, setPhotoUploadProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [airworthinessDeclared, setAirworthinessDeclared] = useState(false);
  const [costAcknowledged, setCostAcknowledged] = useState(false);

  const pricePerPassenger = useMemo(() => {
    if (!draft.totalCostEur || !draft.passengerSeats) return null;
    return computePricePerPassenger(draft.totalCostEur, draft.passengerSeats);
  }, [draft.totalCostEur, draft.passengerSeats]);

  const pricingDraft = useMemo(
    (): FlightDraft => ({
      departureAirfieldId: draft.departureAirfieldId,
      arrivalAirfieldId: draft.arrivalAirfieldId,
      flightType: draft.flightType,
      totalCostEur: draft.totalCostEur,
      passengerSeats: draft.passengerSeats,
    }),
    [
      draft.departureAirfieldId,
      draft.arrivalAirfieldId,
      draft.flightType,
      draft.totalCostEur,
      draft.passengerSeats,
    ],
  );

  async function handlePublishSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPublishError(null);
    if (!airworthinessDeclared) {
      setPublishError("Please confirm the airworthiness declaration before publishing.");
      return;
    }
    setPublishing(true);
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      fd.set("airworthinessDeclared", "on");
      if (pricePreview.warning && costAcknowledged) {
        fd.set("costAcknowledged", "on");
      }
      const pathsRaw = fd.get("photoPaths");
      if (typeof pathsRaw === "string") {
        try {
          fd.set(
            "photoPaths",
            JSON.stringify(
              sanitizePhotoPathsForPublish(JSON.parse(pathsRaw)),
            ),
          );
        } catch {
          setPublishError("Invalid photo list");
          return;
        }
      }

      const res = await fetch("/api/pilot/flights/publish", {
        method: "POST",
        body: fd,
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        setPublishError(
          text.slice(0, 200) || `Publish failed (${res.status})`,
        );
        return;
      }

      const data = (await res.json()) as FlightActionState;
      if (data.priceWarning !== undefined || data.avgRoutePrice !== undefined) {
        setPricePreview({
          warning: data.priceWarning ?? null,
          avg: data.avgRoutePrice ?? null,
        });
      }
      if (data.error) {
        setPublishError(data.error);
        return;
      }
      if (data.success === "published" && data.flightId) {
        router.push(`/pilot/flights?published=${data.flightId}`);
        router.refresh();
        return;
      }
      setPublishError("Unexpected response from server");
    } catch (err) {
      setPublishError(
        err instanceof Error ? err.message : "Failed to publish flight",
      );
    } finally {
      setPublishing(false);
    }
  }

  const persist = (nextStep: number, nextDraft: FlightDraft) => {
    setStepError(null);
    setDraft(nextDraft);
    startTransition(async () => {
      await saveFlightDraftAction(nextStep, nextDraft);
    });
  };

  const handleDiscardDraft = () => {
    if (
      !window.confirm(
        "Discard this draft and start a new flight listing? Uploaded photos will be removed.",
      )
    ) {
      return;
    }
    setStepError(null);
    startTransition(async () => {
      const res = await clearFlightPublishDraftAction();
      if (res.error) {
        setStepError(res.error);
        return;
      }
      setDraft({});
      setStep(1);
      setPricePreview({ warning: null, avg: null });
      setPublishError(null);
    });
  };

  const handleRemovePhoto = (storagePath: string) => {
    setStepError(null);
    startTransition(async () => {
      const res = await removeFlightDraftPhotoAction(storagePath);
      if (res.error) {
        setStepError(res.error);
        return;
      }
      const nextDraft =
        res.draft ??
        ({
          ...draft,
          photoPaths: (draft.photoPaths ?? []).filter((p) => p !== storagePath),
        } satisfies FlightDraft);
      setDraft(nextDraft);
      await saveFlightDraftAction(step, nextDraft);
    });
  };

  const handleAddPhotos = (files: FileList | null) => {
    if (!files?.length) return;
    setStepError(null);
    const fileList = Array.from(files);
    setPhotoUploadProgress({ completed: 0, total: fileList.length });
    startTransition(async () => {
      try {
        let paths = [...(draft.photoPaths ?? [])];
        let completed = 0;
        for (const file of fileList) {
          if (paths.length >= MAX_FLIGHT_PHOTOS) {
            setStepError(`Maximum ${MAX_FLIGHT_PHOTOS} photos allowed`);
            break;
          }
          const fd = new FormData();
          fd.set("file", file);
          const res = await uploadFlightDraftPhotoAction(fd);
          if (res.error) {
            setStepError(res.error);
            break;
          }
          if (res.path) paths.push(res.path);
          completed += 1;
          setPhotoUploadProgress({ completed, total: fileList.length });
        }
        const next = { ...draft, photoPaths: paths };
        setDraft(next);
        await saveFlightDraftAction(8, next);
      } finally {
        setPhotoUploadProgress(null);
      }
    });
  };

  const showDraftBanner = draftHasContent(draft, step);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setDraftLoadError(true);
    }, 5000);

    void loadFlightDraftAction().then((res) => {
      clearTimeout(timer);
      if (cancelled) return;
      setDraft(res.draft);
      setStep(res.step);
      if (res.error) setStepError(res.error);
      setDraftReady(true);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (step !== 11) return;
    if (
      !pricingDraft.departureAirfieldId ||
      !pricingDraft.arrivalAirfieldId ||
      !pricingDraft.flightType ||
      !pricingDraft.totalCostEur ||
      !pricingDraft.passengerSeats
    ) {
      return;
    }

    let cancelled = false;
    startTransition(async () => {
      const res = await previewPublishPricingAction(pricingDraft);
      if (cancelled) return;
      setPricePreview({
        warning: res.priceWarning ?? null,
        avg: res.avgRoutePrice ?? null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [step, pricingDraft, startTransition]);

  useEffect(() => {
    if (
      !draft.departureAirfieldId ||
      !draft.arrivalAirfieldId ||
      !draft.flightDate ||
      !draft.flightType
    ) {
      setWaitingPassengers(null);
      return;
    }

    let cancelled = false;
    startTransition(async () => {
      const res = await getPilotWaitingPassengersCountAction({
        departureAirfieldId: draft.departureAirfieldId!,
        arrivalAirfieldId: draft.arrivalAirfieldId!,
        flightDate: draft.flightDate!,
        flightType: draft.flightType,
      });
      if (!cancelled) setWaitingPassengers(res.count);
    });

    return () => {
      cancelled = true;
    };
  }, [
    draft.departureAirfieldId,
    draft.arrivalAirfieldId,
    draft.flightDate,
    draft.flightType,
    startTransition,
  ]);

  const depOpt: AirfieldOption | null =
    draft.departureAirfieldId && draft.departureAirfieldLabel
      ? {
          id: draft.departureAirfieldId,
          label: draft.departureAirfieldLabel,
          icao_code: "",
        }
      : null;

  const arrOpt: AirfieldOption | null =
    draft.arrivalAirfieldId && draft.arrivalAirfieldLabel
      ? {
          id: draft.arrivalAirfieldId,
          label: draft.arrivalAirfieldLabel,
          icao_code: "",
        }
      : null;

  if (!draftReady) {
    if (draftLoadError) {
      return (
        <div className="mx-auto max-w-2xl py-12 text-center text-muted-foreground">
          Failed to load draft. Please refresh or start over.
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-2xl py-12 text-center text-muted-foreground">
        Loading your draft…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/pilot/flights"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Cancel
        </Link>
        {showDraftBanner ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={handleDiscardDraft}
          >
            Start over
          </Button>
        ) : null}
      </div>

      {showDraftBanner ? (
        <p
          className="rounded-lg border px-3 py-2 text-sm text-muted-foreground"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          You are continuing a saved draft. Use <strong>Start over</strong> to
          publish a new flight from scratch.
        </p>
      ) : null}

      <StepIndicator
        current={step}
        steps={[
          "Type",
          "Aircraft",
          "Route",
          "Schedule",
          "Cost",
          "Seats",
          "Price",
          "Photos",
          "Language",
          "Return",
          "Publish",
        ]}
      />

      {step === 1 ? (
        <StepCard step={1} title="Flight type" description="Choose how you will fly">
          <ChoiceGroup
            name="flightType"
            value={draft.flightType ?? "excursion"}
            onChange={(t) => setDraft((d) => ({ ...d, flightType: t }))}
            options={(["panoramic", "excursion", "one_way"] as const).map((t) => ({
              value: t,
              label: FLIGHT_TYPE_LABELS[t],
            }))}
          />
          {stepError ? <p className="text-sm text-destructive">{stepError}</p> : null}
          <NavButtons
            pending={pending}
            onBack={() => setStep(1)}
            showBack={false}
            onNext={() => {
              if (!draft.flightType) { setStepError("Select a flight type to continue"); return; }
              persist(2, draft);
              setStep(2);
            }}
          />
        </StepCard>
      ) : null}

      {step === 2 ? (
        <StepCard step={2} title="Aircraft" description="Your aircraft or rented">
          <div className="space-y-4">
            <ChoiceGroup
              name="aircraftMode"
              value={draft.aircraftMode === "rented" ? "rented" : "owned"}
              onChange={(mode) =>
                setDraft((d) =>
                  mode === "rented"
                    ? {
                        ...d,
                        aircraftMode: "rented",
                        aircraftId: undefined,
                      }
                    : {
                        ...d,
                        aircraftMode: "owned",
                        rentedModel: undefined,
                        rentedRegistration: undefined,
                        rentedSeats: undefined,
                      },
                )
              }
              options={[
                {
                  value: "owned",
                  label: "My registered aircraft",
                  description: "Select from aircraft you have added to Gallebo.",
                },
                {
                  value: "rented",
                  label: "Rented aircraft",
                  description: "Enter details for a one-off rental.",
                },
              ]}
            />
            {draft.aircraftMode !== "rented" ? (
              aircraftList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No aircraft registered.{" "}
                  <Link href="/pilot/aircraft/new" className="text-primary hover:underline">
                    Add an aircraft first
                  </Link>
                </p>
              ) : (
                <FormField>
                  <FormLabel htmlFor="publish-aircraft-select">Aircraft</FormLabel>
                  <Select
                    id="publish-aircraft-select"
                    value={draft.aircraftId ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, aircraftId: e.target.value, aircraftMode: "owned" }))
                    }
                  >
                    <option value="">Select aircraft</option>
                    {aircraftList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.model} — {a.registration} ({a.seats} seats)
                      </option>
                    ))}
                  </Select>
                </FormField>
              )
            ) : null}

            {draft.aircraftMode === "rented" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField>
                  <FormLabel htmlFor="rented-model">Model</FormLabel>
                  <Input
                    id="rented-model"
                    placeholder="Cessna 172"
                    value={draft.rentedModel ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, rentedModel: e.target.value }))
                    }
                  />
                </FormField>
                <FormField>
                  <FormLabel htmlFor="rented-registration">Registration</FormLabel>
                  <Input
                    id="rented-registration"
                    placeholder="9A-ABC"
                    className="font-mono uppercase"
                    required
                    minLength={2}
                    maxLength={12}
                    value={draft.rentedRegistration ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, rentedRegistration: e.target.value }))
                    }
                  />
                </FormField>
                <FormField className="sm:col-span-2">
                  <FormLabel htmlFor="rented-seats">Seats</FormLabel>
                  <Input
                    id="rented-seats"
                    type="number"
                    min={2}
                    max={6}
                    placeholder="4"
                    value={draft.rentedSeats ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        rentedSeats: Number(e.target.value),
                      }))
                    }
                  />
                </FormField>
              </div>
            ) : null}
          </div>
          {stepError ? <p className="text-sm text-destructive">{stepError}</p> : null}
          <NavButtons
            pending={pending}
            onBack={() => setStep(1)}
            onNext={() => {
              const owned = draft.aircraftMode !== "rented" && draft.aircraftId;
              const rent =
                draft.aircraftMode === "rented" &&
                draft.rentedModel &&
                draft.rentedRegistration &&
                draft.rentedSeats;
              if (!owned && !rent) { setStepError("Complete aircraft details to continue"); return; }
              persist(3, draft);
              setStep(3);
            }}
          />
        </StepCard>
      ) : null}

      {step === 3 ? (
        <StepCard step={3} title="Route" description="Departure and arrival airfields">
          <div className="space-y-4">
            <AirfieldCombobox
              label="Departure"
              value={depOpt}
              onChange={(opt) =>
                setDraft((d) => ({
                  ...d,
                  departureAirfieldId: opt?.id,
                  departureAirfieldLabel: opt?.label,
                  ...(d.flightType === "panoramic" && opt
                    ? {
                        arrivalAirfieldId: opt.id,
                        arrivalAirfieldLabel: opt.label,
                      }
                    : {}),
                }))
              }
            />
            {draft.flightType !== "panoramic" ? (
              <AirfieldCombobox
                label="Arrival"
                value={arrOpt}
                onChange={(opt) =>
                  setDraft((d) => ({
                    ...d,
                    arrivalAirfieldId: opt?.id,
                    arrivalAirfieldLabel: opt?.label,
                  }))
                }
              />
            ) : null}
            {waitingPassengers != null && waitingPassengers > 0 ? (
              <p
                className="rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: "color-mix(in srgb, var(--primary-v2) 25%, transparent)",
                  background: "var(--primary-soft)",
                  color: "var(--primary-v2)",
                }}
              >
                {waitingPassengers === 1
                  ? "1 passenger is waiting for this route"
                  : `${waitingPassengers} passengers are waiting for this route`}
              </p>
            ) : null}
          </div>
          {stepError ? <p className="text-sm text-destructive">{stepError}</p> : null}
          <NavButtons
            pending={pending}
            onBack={() => setStep(2)}
            onNext={() => {
              if (!draft.departureAirfieldId || !draft.arrivalAirfieldId) { setStepError("Select both departure and arrival airfields"); return; }
              persist(4, draft);
              setStep(4);
            }}
          />
        </StepCard>
      ) : null}

      {step === 4 ? (
        <StepCard step={4} title="Date & time">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField>
              <FormLabel htmlFor="publish-flight-date">Date</FormLabel>
              <Input
                id="publish-flight-date"
                type="date"
                value={draft.flightDate ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, flightDate: e.target.value }))
                }
              />
            </FormField>
            {waitingPassengers != null && waitingPassengers > 0 ? (
              <p
                className="sm:col-span-2 rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: "color-mix(in srgb, var(--primary-v2) 25%, transparent)",
                  background: "var(--primary-soft)",
                  color: "var(--primary-v2)",
                }}
              >
                {waitingPassengers === 1
                  ? "1 passenger is waiting for this route in your selected period"
                  : `${waitingPassengers} passengers are waiting for this route in your selected period`}
              </p>
            ) : null}
            <FormField>
              <FormLabel htmlFor="publish-departure-time">Departure time</FormLabel>
              <Input
                id="publish-departure-time"
                type="time"
                value={draft.departureTime ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, departureTime: e.target.value }))
                }
              />
            </FormField>
          </div>
          {stepError ? <p className="text-sm text-destructive">{stepError}</p> : null}
          <NavButtons
            pending={pending}
            onBack={() => setStep(3)}
            onNext={() => {
              if (!draft.flightDate || !draft.departureTime) { setStepError("Enter date and departure time"); return; }
              persist(5, draft);
              setStep(5);
            }}
          />
        </StepCard>
      ) : null}

      {step === 5 ? (
        <StepCard step={5} title="Total cost" description="Full flight cost in EUR">
          <FormField>
            <FormLabel htmlFor="publish-total-cost">Total cost (EUR)</FormLabel>
            <Input
              id="publish-total-cost"
              type="number"
              step="0.01"
              min={1}
              value={draft.totalCostEur ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  totalCostEur: Number(e.target.value),
                }))
              }
            />
          </FormField>
          {stepError ? <p className="text-sm text-destructive">{stepError}</p> : null}
          <NavButtons
            pending={pending}
            onBack={() => setStep(4)}
            onNext={() => {
              if (!draft.totalCostEur || draft.totalCostEur <= 0) { setStepError("Enter a total cost greater than 0"); return; }
              persist(6, draft);
              setStep(6);
            }}
          />
        </StepCard>
      ) : null}

      {step === 6 ? (
        <StepCard step={6} title="Passenger seats" description="Max 5 (6 incl. pilot)">
          <FormField>
            <FormLabel htmlFor="publish-passenger-seats">Passenger seats</FormLabel>
            <Input
              id="publish-passenger-seats"
              type="number"
              min={1}
              max={5}
              value={draft.passengerSeats ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  passengerSeats: Number(e.target.value),
                }))
              }
            />
          </FormField>
          {stepError ? <p className="text-sm text-destructive">{stepError}</p> : null}
          <NavButtons
            pending={pending}
            onBack={() => setStep(5)}
            onNext={() => {
              if (!draft.passengerSeats) { setStepError("Enter number of passenger seats (1–5)"); return; }
              persist(7, draft);
              setStep(7);
            }}
          />
        </StepCard>
      ) : null}

      {step === 7 ? (
        <StepCard step={7} title="Price per passenger" description="Auto-calculated">
          <p className="text-2xl font-semibold">
            {pricePerPassenger !== null
              ? `€${pricePerPassenger.toFixed(2)}`
              : "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            Total €{draft.totalCostEur} ÷ ({draft.passengerSeats ?? "?"} passengers + you)
          </p>
          <NavButtons
            pending={pending}
            onBack={() => setStep(6)}
            onNext={() => {
              persist(8, draft);
              setStep(8);
            }}
          />
        </StepCard>
      ) : null}

      {step === 8 ? (
        <StepCard
          step={8}
          title="Description & photos"
          description={`Min ${MIN_FLIGHT_PHOTOS} photos`}
        >
          <FormField>
            <FormLabel htmlFor="publish-description">Description</FormLabel>
            <Textarea
              id="publish-description"
              value={draft.description ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              placeholder="Describe the flight experience…"
            />
          </FormField>
          <div className="space-y-3">
            {(draft.photoPaths?.length ?? 0) > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {(draft.photoPaths ?? []).map((path) => {
                  const url = draftPhotoPublicUrl(path);
                  const name = path.split("/").pop() ?? "Photo";
                  return (
                    <li
                      key={path}
                      className="flex gap-3 rounded-md border p-2"
                      style={{ borderColor: "var(--line)" }}
                    >
                      {url ? (
                        <img
                          src={url}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-muted text-xs">
                          Photo
                        </div>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                        <span className="truncate text-xs text-muted-foreground">
                          {name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 self-start px-2 text-destructive hover:text-destructive"
                          disabled={pending || photoUploadProgress !== null}
                          onClick={() => handleRemovePhoto(path)}
                        >
                          Remove
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No photos yet.</p>
            )}
            <FormField>
              <FormLabel htmlFor="publish-flight-photos">
                {(draft.photoPaths?.length ?? 0) >= MAX_FLIGHT_PHOTOS
                  ? "Maximum photos reached"
                  : "Add photos"}
              </FormLabel>
              <label
                htmlFor="publish-flight-photos"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-base)] border border-dashed px-4 py-6 text-center transition-colors hover:border-[var(--primary-v2)] hover:bg-[var(--primary-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor: "var(--line-strong)",
                  background: "var(--surface-alt)",
                }}
              >
                <span className="text-[14px] font-medium text-[var(--ink)]">
                  Choose photos
                </span>
                <FormHint>JPEG, PNG or WebP</FormHint>
              </label>
              <input
                id="publish-flight-photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                disabled={
                  pending ||
                  photoUploadProgress !== null ||
                  (draft.photoPaths?.length ?? 0) >= MAX_FLIGHT_PHOTOS
                }
                onChange={(e) => {
                  handleAddPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </FormField>
            {photoUploadProgress ? (
              <p
                className="flex items-center gap-2 text-sm text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Uploading... ({photoUploadProgress.completed} of{" "}
                {photoUploadProgress.total})
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {draft.photoPaths?.length ?? 0} of {MAX_FLIGHT_PHOTOS} photos · min{" "}
              {MIN_FLIGHT_PHOTOS} required
            </p>
          </div>
          {stepError ? <p className="text-sm text-destructive">{stepError}</p> : null}
          <NavButtons
            pending={pending || photoUploadProgress !== null}
            nextLabel={
              photoUploadProgress
                ? "Uploading…"
                : pending
                  ? "Saving…"
                  : undefined
            }
            onBack={() => setStep(7)}
            onNext={() => {
              if (!draft.description || draft.description.length < 20) {
                setStepError("Description must be at least 20 characters");
                return;
              }
              if ((draft.photoPaths?.length ?? 0) < MIN_FLIGHT_PHOTOS) {
                setStepError(`Upload at least ${MIN_FLIGHT_PHOTOS} photos`);
                return;
              }
              if ((draft.photoPaths?.length ?? 0) > MAX_FLIGHT_PHOTOS) {
                setStepError(`Maximum ${MAX_FLIGHT_PHOTOS} photos allowed`);
                return;
              }
              persist(9, draft);
              setStep(9);
            }}
          />
        </StepCard>
      ) : null}

      {step === 9 ? (
        <StepCard step={9} title="Communication language">
          <ChoiceGroup
            name="communicationLanguage"
            value={draft.communicationLanguage ?? "en"}
            onChange={(lang) =>
              setDraft((d) => ({ ...d, communicationLanguage: lang }))
            }
            layout="grid"
            options={(["hr", "en", "it"] as const).map((lang) => ({
              value: lang,
              label: FLIGHT_LANGUAGE_LABELS[lang],
            }))}
          />
          {stepError ? <p className="text-sm text-destructive">{stepError}</p> : null}
          <NavButtons
            pending={pending}
            onBack={() => setStep(8)}
            onNext={() => {
              if (!draft.communicationLanguage) { setStepError("Select a communication language"); return; }
              const nextStep = draft.flightType === "one_way" ? 10 : 11;
              persist(nextStep, draft);
              setStep(nextStep);
            }}
          />
        </StepCard>
      ) : null}

      {step === 10 && draft.flightType === "one_way" ? (
        <StepCard step={10} title="Return note" description="Optional">
          <FormField>
            <FormLabel htmlFor="publish-return-note">Return note (optional)</FormLabel>
            <Textarea
              id="publish-return-note"
              className="min-h-[80px]"
              value={draft.returnNote ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, returnNote: e.target.value }))
              }
              placeholder="When you plan to return…"
            />
          </FormField>
          <FormField>
            <FormLabel htmlFor="publish-return-date">Pilot return date (optional)</FormLabel>
            <Input
              id="publish-return-date"
              type="date"
              value={draft.pilotReturnDate ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, pilotReturnDate: e.target.value }))
              }
            />
          </FormField>
          <NavButtons
            pending={pending}
            onBack={() => setStep(9)}
            onNext={() => {
              persist(11, draft);
              setStep(11);
            }}
          />
        </StepCard>
      ) : null}

      {step === 11 ? (
        <StepCard step={11} title="Review & publish">
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Type:</strong>{" "}
              {draft.flightType ? FLIGHT_TYPE_LABELS[draft.flightType] : "—"}
            </li>
            <li>
              <strong>Route:</strong> {draft.departureAirfieldLabel} →{" "}
              {draft.arrivalAirfieldLabel}
            </li>
            <li>
              <strong>When:</strong> {draft.flightDate} {draft.departureTime}
            </li>
            <li>
              <strong>Aircraft:</strong>{" "}
              {draft.aircraftMode === "rented" ? (
                <>
                  {draft.rentedModel ?? "—"} ({draft.rentedRegistration ?? "—"}) —{" "}
                  {draft.rentedSeats ?? "—"} seats
                </>
              ) : (
                (() => {
                  const ac = aircraftList.find((a) => a.id === draft.aircraftId);
                  return ac
                    ? `${ac.model} — ${ac.registration} (${ac.seats} seats)`
                    : "—";
                })()
              )}
            </li>
            <li>
              <strong>Price / passenger:</strong> €
              {pricePerPassenger?.toFixed(2) ?? "—"}
            </li>
            {pricePreview.avg !== null ? (
              <li>
                <strong>Route average:</strong> €{pricePreview.avg.toFixed(2)}
              </li>
            ) : null}
          </ul>
          {pricePreview.warning ? (
            <p className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
              {pricePreview.warning}
            </p>
          ) : null}
          {!stripeOnboardingComplete ? (
            <div className="space-y-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
              <p className="font-medium">
                Set up your payout account before publishing. Passengers can only book flights
                when you can receive payouts via Stripe.
              </p>
              <Link
                href="/pilot/stripe"
                className="inline-flex font-semibold text-primary hover:underline"
              >
                Set up payouts →
              </Link>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setStep(draft.flightType === "one_way" ? 10 : 9)
                  }
                >
                  Back
                </Button>
              </div>
            </div>
          ) : null}
          {stripeOnboardingComplete ? (
          <form onSubmit={handlePublishSubmit} className="space-y-4">
            <input type="hidden" name="flightType" value={draft.flightType ?? ""} />
            <input type="hidden" name="aircraftId" value={draft.aircraftId ?? ""} />
            <input type="hidden" name="rentedModel" value={draft.rentedModel ?? ""} />
            <input
              type="hidden"
              name="rentedRegistration"
              value={draft.rentedRegistration ?? ""}
            />
            <input type="hidden" name="rentedSeats" value={draft.rentedSeats ?? ""} />
            <input
              type="hidden"
              name="departureAirfieldId"
              value={draft.departureAirfieldId ?? ""}
            />
            <input
              type="hidden"
              name="arrivalAirfieldId"
              value={draft.arrivalAirfieldId ?? ""}
            />
            <input type="hidden" name="flightDate" value={draft.flightDate ?? ""} />
            <input
              type="hidden"
              name="departureTime"
              value={draft.departureTime ?? ""}
            />
            <input type="hidden" name="totalCostEur" value={draft.totalCostEur ?? ""} />
            <input
              type="hidden"
              name="passengerSeats"
              value={draft.passengerSeats ?? ""}
            />
            <input type="hidden" name="description" value={draft.description ?? ""} />
            <input
              type="hidden"
              name="communicationLanguage"
              value={draft.communicationLanguage ?? "en"}
            />
            <input type="hidden" name="returnNote" value={draft.returnNote ?? ""} />
            <input
              type="hidden"
              name="pilotReturnDate"
              value={draft.pilotReturnDate ?? ""}
            />
            <input
              type="hidden"
              name="photoPaths"
              value={JSON.stringify(
                sanitizePhotoPathsForPublish(draft.photoPaths ?? []),
              )}
            />
            {pricePreview.warning ? (
              <ChoiceCheckbox
                name="costAcknowledged"
                checked={costAcknowledged}
                onChange={setCostAcknowledged}
              >
                I confirm this amount reflects actual shared costs without profit.
              </ChoiceCheckbox>
            ) : null}
            <ChoiceCheckbox
              name="airworthinessDeclared"
              checked={airworthinessDeclared}
              onChange={setAirworthinessDeclared}
            >
              I confirm that the aircraft is airworthy, insured for flights with
              passengers, and that I have valid authorization to operate this aircraft
              on this flight.
            </ChoiceCheckbox>
            {publishError ? (
              <p className="text-sm text-destructive">{publishError}</p>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={publishing}
                onClick={() =>
                  setStep(draft.flightType === "one_way" ? 10 : 9)
                }
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={
                  publishing ||
                  pending ||
                  !airworthinessDeclared ||
                  (pricePreview.warning !== null && !costAcknowledged)
                }
              >
                {publishing ? "Publishing…" : "Publish flight"}
              </Button>
            </div>
          </form>
          ) : null}
        </StepCard>
      ) : null}
    </div>
  );
}

function NavButtons({
  pending,
  nextLabel,
  onBack,
  onNext,
  showBack = true,
}: {
  pending: boolean;
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
  showBack?: boolean;
}) {
  const continueLabel =
    nextLabel ?? (pending ? "Saving…" : "Continue");

  return (
    <div className="mt-6 flex gap-2">
      {showBack ? (
        <Button type="button" variant="ghost" className="h-11 sm:h-8" onClick={onBack}>
          Back
        </Button>
      ) : null}
      <Button type="button" className="h-11 flex-1 sm:h-8" disabled={pending} onClick={onNext}>
        {continueLabel}
      </Button>
    </div>
  );
}
