"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";

import { StepCard } from "@/components/onboarding/step-card";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import {
  AirfieldCombobox,
  type AirfieldOption,
} from "@/components/flights/airfield-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FLIGHT_LANGUAGE_LABELS,
  FLIGHT_TYPE_LABELS,
  MAX_FLIGHT_PHOTOS,
  MIN_FLIGHT_PHOTOS,
} from "@/lib/flights/constants";
import { getPilotWaitingPassengersCountAction } from "@/lib/alerts/actions";
import {
  previewPublishPricingAction,
  publishFlightAction,
  saveFlightDraftAction,
  uploadFlightDraftPhotoAction,
} from "@/lib/flights/actions";
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

export function PublishFlightWizard({
  initialStep,
  initialDraft,
  aircraftList,
}: {
  initialStep: number;
  initialDraft: FlightDraft;
  aircraftList: AircraftRow[];
}) {
  const [step, setStep] = useState(initialStep);
  const [draft, setDraft] = useState<FlightDraft>(initialDraft);
  const [stepError, setStepError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [publishState, publishAction] = useActionState(publishFlightAction, {});
  const [pricePreview, setPricePreview] = useState<{
    warning: string | null;
    avg: number | null;
  }>({ warning: null, avg: null });
  const [waitingPassengers, setWaitingPassengers] = useState<number | null>(null);

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

  const persist = (nextStep: number, nextDraft: FlightDraft) => {
    setStepError(null);
    setDraft(nextDraft);
    startTransition(async () => {
      await saveFlightDraftAction(nextStep, nextDraft);
    });
  };

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

    startTransition(async () => {
      const res = await previewPublishPricingAction(pricingDraft);
      setPricePreview({
        warning: res.priceWarning ?? null,
        avg: res.avgRoutePrice ?? null,
      });
    });
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

  return (
    <div className="mx-auto max-w-2xl space-y-8">
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
          <div className="space-y-3">
            {(["panoramic", "excursion", "one_way"] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="flightType"
                  checked={draft.flightType === t}
                  onChange={() => setDraft((d) => ({ ...d, flightType: t }))}
                />
                {FLIGHT_TYPE_LABELS[t]}
              </label>
            ))}
          </div>
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={draft.aircraftMode !== "rented"}
                onChange={() =>
                  setDraft((d) => ({
                    ...d,
                    aircraftMode: "owned",
                    rentedModel: undefined,
                    rentedRegistration: undefined,
                    rentedSeats: undefined,
                  }))
                }
              />
              My registered aircraft
            </label>
            {draft.aircraftMode !== "rented" ? (
              aircraftList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No aircraft registered.{" "}
                  <Link href="/pilot/aircraft/new" className="text-primary hover:underline">
                    Add an aircraft first
                  </Link>
                </p>
              ) : (
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
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
                </select>
              )
            ) : null}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={draft.aircraftMode === "rented"}
                onChange={() =>
                  setDraft((d) => ({
                    ...d,
                    aircraftMode: "rented",
                    aircraftId: undefined,
                  }))
                }
              />
              Rented aircraft (per flight)
            </label>
            {draft.aircraftMode === "rented" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Model"
                  value={draft.rentedModel ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, rentedModel: e.target.value }))
                  }
                />
                <Input
                  placeholder="Registration"
                  className="font-mono uppercase"
                  value={draft.rentedRegistration ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, rentedRegistration: e.target.value }))
                  }
                />
                <Input
                  type="number"
                  min={2}
                  max={6}
                  placeholder="Seats"
                  value={draft.rentedSeats ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      rentedSeats: Number(e.target.value),
                    }))
                  }
                />
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={draft.flightDate ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, flightDate: e.target.value }))
                }
              />
            </div>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Departure time</label>
              <Input
                type="time"
                value={draft.departureTime ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, departureTime: e.target.value }))
                }
              />
            </div>
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
          <Input
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
          <Input
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
          <textarea
            className="min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
            value={draft.description ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
            placeholder="Describe the flight experience…"
          />
          <div className="space-y-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (!files?.length) return;
                const input = e.target;
                startTransition(async () => {
                  setStepError(null);
                  const paths = [...(draft.photoPaths ?? [])];
                  for (const file of Array.from(files)) {
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
                  }
                  const next = { ...draft, photoPaths: paths };
                  setDraft(next);
                  await saveFlightDraftAction(8, next);
                  input.value = "";
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              {draft.photoPaths?.length ?? 0} photo(s) uploaded
            </p>
          </div>
          {stepError ? <p className="text-sm text-destructive">{stepError}</p> : null}
          <NavButtons
            pending={pending}
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
          <div className="flex flex-wrap gap-4">
            {(["hr", "en", "it"] as const).map((lang) => (
              <label key={lang} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={draft.communicationLanguage === lang}
                  onChange={() =>
                    setDraft((d) => ({ ...d, communicationLanguage: lang }))
                  }
                />
                {FLIGHT_LANGUAGE_LABELS[lang]}
              </label>
            ))}
          </div>
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
          <textarea
            className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
            value={draft.returnNote ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, returnNote: e.target.value }))
            }
            placeholder="When you plan to return…"
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilot return date (optional)</label>
            <Input
              type="date"
              value={draft.pilotReturnDate ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, pilotReturnDate: e.target.value }))
              }
            />
          </div>
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
          <form action={publishAction} className="space-y-4">
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
              value={JSON.stringify(draft.photoPaths ?? [])}
            />
            {pricePreview.warning ? (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="costAcknowledged" required />
                I confirm this amount reflects actual shared costs without profit.
              </label>
            ) : null}
            {publishState.error ? (
              <p className="text-sm text-destructive">{publishState.error}</p>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setStep(draft.flightType === "one_way" ? 10 : 9)
                }
              >
                Back
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Publishing…" : "Publish flight"}
              </Button>
            </div>
          </form>
        </StepCard>
      ) : null}
    </div>
  );
}

function NavButtons({
  pending,
  onBack,
  onNext,
  showBack = true,
}: {
  pending: boolean;
  onBack: () => void;
  onNext: () => void;
  showBack?: boolean;
}) {
  return (
    <div className="mt-6 flex gap-2">
      {showBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
      ) : null}
      <Button type="button" className="flex-1" disabled={pending} onClick={onNext}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </div>
  );
}
