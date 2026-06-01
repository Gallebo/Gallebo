"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import {
  AirfieldCombobox,
  type AirfieldOption,
} from "@/components/flights/airfield-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FLIGHT_TYPE_LABELS } from "@/lib/flights/constants";
import {
  createAlertAction,
  type AlertActionState,
} from "@/lib/alerts/actions";
import type { FlightType } from "@/lib/flights/types";

type LocationMode = "airfield" | "country";

function LocationModeToggle({
  label,
  mode,
  onModeChange,
}: {
  label: string;
  mode: LocationMode;
  onModeChange: (mode: LocationMode) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{
            borderColor: mode === "airfield" ? "var(--primary-v2)" : "var(--line)",
            color: mode === "airfield" ? "var(--primary-v2)" : "var(--ink-2)",
          }}
          onClick={() => onModeChange("airfield")}
        >
          Airfield
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{
            borderColor: mode === "country" ? "var(--primary-v2)" : "var(--line)",
            color: mode === "country" ? "var(--primary-v2)" : "var(--ink-2)",
          }}
          onClick={() => onModeChange("country")}
        >
          Country / region
        </button>
      </div>
    </div>
  );
}

export function AlertForm({ countries }: { countries: string[] }) {
  const router = useRouter();
  const [departureMode, setDepartureMode] = useState<LocationMode>("airfield");
  const [arrivalMode, setArrivalMode] = useState<LocationMode>("airfield");
  const [departure, setDeparture] = useState<AirfieldOption | null>(null);
  const [arrival, setArrival] = useState<AirfieldOption | null>(null);
  const [departureCountry, setDepartureCountry] = useState("");
  const [arrivalCountry, setArrivalCountry] = useState("");
  const [state, formAction, pending] = useActionState<
    AlertActionState,
    FormData
  >(createAlertAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-5 rounded-xl border p-5">
      <input type="hidden" name="departureMode" value={departureMode} />
      <input type="hidden" name="arrivalMode" value={arrivalMode} />
      {departureMode === "airfield" ? (
        <input
          type="hidden"
          name="departureAirfieldId"
          value={departure?.id ?? ""}
        />
      ) : (
        <input type="hidden" name="departureCountry" value={departureCountry} />
      )}
      {arrivalMode === "airfield" ? (
        <input
          type="hidden"
          name="arrivalAirfieldId"
          value={arrival?.id ?? ""}
        />
      ) : (
        <input type="hidden" name="arrivalCountry" value={arrivalCountry} />
      )}

      <div className="space-y-4">
        <LocationModeToggle
          label="Departure"
          mode={departureMode}
          onModeChange={setDepartureMode}
        />
        {departureMode === "airfield" ? (
          <AirfieldCombobox
            label="Departure airfield"
            value={departure}
            onChange={setDeparture}
          />
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium">Departure country / region</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={departureCountry}
              onChange={(e) => setDepartureCountry(e.target.value)}
              required
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <LocationModeToggle
          label="Arrival"
          mode={arrivalMode}
          onModeChange={setArrivalMode}
        />
        {arrivalMode === "airfield" ? (
          <AirfieldCombobox
            label="Arrival airfield"
            value={arrival}
            onChange={setArrival}
          />
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium">Arrival country / region</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={arrivalCountry}
              onChange={(e) => setArrivalCountry(e.target.value)}
              required
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">From date</label>
          <Input type="date" name="dateFrom" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">To date</label>
          <Input type="date" name="dateTo" required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Flight type</label>
        <select
          name="flightType"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          defaultValue="all"
        >
          <option value="all">All types</option>
          {(Object.keys(FLIGHT_TYPE_LABELS) as FlightType[]).map((t) => (
            <option key={t} value={t}>
              {FLIGHT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs" style={{ color: "var(--ink-3)" }}>
        Alerts stay active for 15 days. You will be notified by email, push, and
        in-app when a matching flight is published.
      </p>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm" style={{ color: "var(--success)" }}>
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Create alert"}
      </Button>
    </form>
  );
}
