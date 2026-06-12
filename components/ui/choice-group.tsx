"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type ChoiceGroupProps<T extends string> = {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly ChoiceOption<T>[];
  className?: string;
  layout?: "stack" | "grid";
};

export function ChoiceGroup<T extends string>({
  name,
  value,
  onChange,
  options,
  className,
  layout = "stack",
}: ChoiceGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        layout === "grid" ? "grid gap-3 sm:grid-cols-3" : "grid gap-3",
        className,
      )}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "relative flex cursor-pointer items-start gap-3 rounded-[var(--radius-base)] border p-4 transition-[border-color,background-color,box-shadow]",
              selected
                ? "border-[var(--primary-v2)] bg-[var(--primary-soft)] shadow-[var(--shadow-sm)]"
                : "border-[var(--line)] bg-[var(--surface)] hover:border-[color-mix(in_srgb,var(--primary-v2)_28%,transparent)]",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                selected
                  ? "border-[var(--primary-v2)] bg-[var(--primary-v2)] text-[var(--primary-ink)]"
                  : "border-[var(--line-strong)] bg-[var(--surface)]",
              )}
              aria-hidden
            >
              {selected ? <Check className="size-3" strokeWidth={3} /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="block text-[14px] font-semibold tracking-[-0.01em]"
                style={{ color: "var(--ink)" }}
              >
                {option.label}
              </span>
              {option.description ? (
                <span className="mt-1 block text-[13px] leading-snug text-[var(--ink-3)]">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

type ChoiceCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
  children: ReactNode;
  className?: string;
};

export function ChoiceCheckbox({
  checked,
  onChange,
  name,
  children,
  className,
}: ChoiceCheckboxProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[var(--radius-base)] border p-4 transition-[border-color,background-color]",
        checked
          ? "border-[var(--primary-v2)] bg-[var(--primary-soft)]"
          : "border-[var(--line)] bg-[var(--surface)] hover:border-[color-mix(in_srgb,var(--primary-v2)_28%,transparent)]",
        className,
      )}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
          checked
            ? "border-[var(--primary-v2)] bg-[var(--primary-v2)] text-[var(--primary-ink)]"
            : "border-[var(--line-strong)] bg-[var(--surface)]",
        )}
        aria-hidden
      >
        {checked ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <span className="text-[14px] leading-snug text-[var(--ink-2)]">{children}</span>
    </label>
  );
}
