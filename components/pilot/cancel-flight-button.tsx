"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cancelFlightAction } from "@/lib/flights/actions";

export function CancelFlightButton({ flightId }: { flightId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        className="rounded-lg px-3 py-2 text-[13px] font-semibold transition-opacity"
        style={{
          background: "color-mix(in srgb, var(--danger) 12%, transparent)",
          color: "var(--danger)",
          border: "none",
          cursor: "pointer",
        }}
        onClick={() => setOpen(true)}
      >
        Cancel flight
      </button>
    );
  }

  return (
    <div
      className="w-full max-w-sm rounded-lg border p-4 space-y-3 sm:w-auto"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
        Cancel this flight?
      </p>
      <p className="text-sm" style={{ color: "var(--ink-3)" }}>
        The listing will be removed. Pending or accepted booking requests will be
        cancelled. This cannot be undone.
      </p>
      {message ? (
        <p
          className="text-sm"
          style={{ color: message.includes("cancelled") ? "var(--success)" : "var(--danger)" }}
        >
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--danger)", border: "none", cursor: "pointer" }}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const res = await cancelFlightAction(flightId);
              if (res.error) {
                setMessage(res.error);
                return;
              }
              setOpen(false);
              router.refresh();
            });
          }}
        >
          {pending ? "Cancelling…" : "Confirm cancel"}
        </button>
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-[13px] font-medium"
          style={{
            background: "transparent",
            border: "1px solid var(--line)",
            color: "var(--ink-2)",
            cursor: "pointer",
          }}
          onClick={() => {
            setOpen(false);
            setMessage(null);
          }}
        >
          Keep flight
        </button>
      </div>
    </div>
  );
}
