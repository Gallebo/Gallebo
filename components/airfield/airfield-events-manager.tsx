"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  createEventAction,
  deleteEventAction,
} from "@/lib/airfield/actions";
import type { AirfieldEvent } from "@/lib/airfield/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AirfieldEventsManager({
  events,
}: {
  events: AirfieldEvent[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, formAction, formPending] = useActionState(
    createEventAction,
    {}
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <div className="space-y-8">
      <form action={formAction} className="max-w-xl space-y-4">
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-green-600">{state.success}</p>
        ) : null}
        <Input name="title" placeholder="Event title" required />
        <Input name="event_date" type="date" required />
        <textarea
          name="description"
          rows={3}
          placeholder="Description (optional)"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Input name="link" type="url" placeholder="Link (optional)" />
        <Button type="submit" disabled={formPending}>
          Create event
        </Button>
      </form>

      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.event_date).toLocaleDateString()}
                </p>
                {event.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                ) : null}
                {event.link ? (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-primary hover:underline"
                  >
                    {event.link}
                  </a>
                ) : null}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await deleteEventAction(event.id);
                    router.refresh();
                  });
                }}
              >
                Delete
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
