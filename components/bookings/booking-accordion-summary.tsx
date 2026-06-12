"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BookingAccordionSummaryProps = {
  expanded: boolean;
  onToggle: () => void;
  routeLabel: string;
  meta: string;
  nameLabel: string;
  badge: ReactNode;
  className?: string;
};

export function BookingAccordionSummary({
  expanded,
  onToggle,
  routeLabel,
  meta,
  nameLabel,
  badge,
  className,
}: BookingAccordionSummaryProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={cn(
        "flex w-full items-start justify-between gap-3 rounded-lg text-left transition-colors",
        "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className="text-[1.05rem] font-semibold tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
          >
            {routeLabel}
          </p>
          {badge}
        </div>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--ink)" }}>
          {nameLabel}
        </p>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--ink-3)" }}>
          {meta}
        </p>
      </div>
      <ChevronDown
        className={cn(
          "mt-1 size-5 shrink-0 transition-transform duration-300",
          expanded && "rotate-180",
        )}
        style={{ color: "var(--ink-3)" }}
        aria-hidden
      />
    </button>
  );
}
