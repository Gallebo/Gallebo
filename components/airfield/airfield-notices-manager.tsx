"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  createNoticeAction,
  deleteNoticeAction,
} from "@/lib/airfield/actions";
import type { AirfieldNotice } from "@/lib/airfield/types";
import { Button } from "@/components/ui/button";

export function AirfieldNoticesManager({
  notices,
}: {
  notices: AirfieldNotice[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, formAction, formPending] = useActionState(
    createNoticeAction,
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
        <textarea
          name="body"
          rows={4}
          required
          placeholder="Operational notice (runway closure, schedule change…)"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={formPending}>
          Publish notice
        </Button>
      </form>

      <div className="space-y-3">
        {notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notices yet.</p>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div>
                <p className="whitespace-pre-wrap text-sm">{notice.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(notice.created_at).toLocaleString()}
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await deleteNoticeAction(notice.id);
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
