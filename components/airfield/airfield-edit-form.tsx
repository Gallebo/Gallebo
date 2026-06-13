"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { updateAirfieldProfileAction } from "@/lib/airfield/actions";
import type { Airfield } from "@/lib/airfield/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AirfieldEditForm({ airfield }: { airfield: Airfield }) {
  const [state, formAction, pending] = useActionState(
    updateAirfieldProfileAction,
    {}
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-600">{state.success}</p>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="name">
          Name
        </label>
        <Input id="name" name="name" defaultValue={airfield.name} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="latitude">
            Latitude
          </label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={airfield.latitude}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="longitude">
            Longitude
          </label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={airfield.longitude}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="country">
          Country
        </label>
        <Input
          id="country"
          name="country"
          defaultValue={airfield.country}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="contact_email">
            Contact email
          </label>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={airfield.contact_email ?? ""}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="contact_phone">
            Contact phone
          </label>
          <Input
            id="contact_phone"
            name="contact_phone"
            defaultValue={airfield.contact_phone ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="working_hours">
          Working hours
        </label>
        <Input
          id="working_hours"
          name="working_hours"
          defaultValue={airfield.working_hours ?? ""}
          placeholder="Mon–Fri 08:00–18:00"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="has_fuel"
            defaultChecked={airfield.has_fuel}
            className="size-4 accent-primary"
          />
          Fuel available
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="has_hangar"
            defaultChecked={airfield.has_hangar}
            className="size-4 accent-primary"
          />
          Hangar available
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="has_rental"
            defaultChecked={airfield.has_rental}
            className="size-4 accent-primary"
          />
          Aircraft rental
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={airfield.description ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="destination_info">
          Destination info
        </label>
        <textarea
          id="destination_info"
          name="destination_info"
          rows={6}
          defaultValue={airfield.destination_info ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="What to visit nearby, restaurants, attractions…"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  );
}
