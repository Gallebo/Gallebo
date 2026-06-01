"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FLIGHT_TYPE_LABELS } from "@/lib/flights/constants";
import {
  deleteAlertAction,
  extendAlertAction,
} from "@/lib/alerts/actions";
import type { FlightAlertWithLabels } from "@/lib/alerts/queries";
import type { FlightType } from "@/lib/flights/types";

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AlertCard({ alert }: { alert: FlightAlertWithLabels }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const flightTypeLabel = alert.flight_type
    ? FLIGHT_TYPE_LABELS[alert.flight_type as FlightType]
    : "All types";

  return (
    <article
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
            Route
          </p>
          <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            {alert.departureLabel} → {alert.arrivalLabel}
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{
            background: "var(--primary-soft)",
            color: "var(--primary-v2)",
          }}
        >
          Active
        </span>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2" style={{ color: "var(--ink-2)" }}>
        <div>
          <dt className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
            Period
          </dt>
          <dd>
            {formatDate(alert.date_from)} — {formatDate(alert.date_to)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
            Flight type
          </dt>
          <dd>{flightTypeLabel}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
            Expires
          </dt>
          <dd>{formatDate(alert.expires_at.slice(0, 10))}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await extendAlertAction(alert.id);
              router.refresh();
            });
          }}
        >
          Extend 15 days
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await deleteAlertAction(alert.id);
              router.refresh();
            });
          }}
        >
          Remove
        </Button>
      </div>
    </article>
  );
}
