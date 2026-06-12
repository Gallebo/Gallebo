import { cn } from "@/lib/utils";

/** Shared v2 form control tokens — single source for Input, Textarea, Select. */
export const formControlClassName = cn(
  "w-full min-w-0 border px-3.5 text-[15px] shadow-none transition-[border-color,box-shadow,background-color] outline-none",
  "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]",
  "placeholder:text-[var(--ink-3)]",
  "focus-visible:border-[var(--primary-v2)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary-v2)_18%,transparent)]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--surface-alt)] disabled:opacity-50",
  "aria-invalid:border-[var(--danger)] aria-invalid:ring-2 aria-invalid:ring-[color-mix(in_srgb,var(--danger)_20%,transparent)]",
);

export const formInputSizeClassName = {
  default: "min-h-11 rounded-[var(--radius-base)] py-2.5",
  lg: "min-h-12 rounded-xl py-3",
} as const;

export const formTextareaClassName = cn(
  formControlClassName,
  "min-h-[120px] resize-y rounded-[var(--radius-base)] py-3 leading-relaxed",
);

export const formSelectClassName = cn(
  formControlClassName,
  formInputSizeClassName.default,
  "scheme-light appearance-none bg-[var(--surface)] pr-10",
);

export const formLabelClassName =
  "text-[13px] font-medium tracking-[-0.01em] text-[var(--ink)]";

export const formHintClassName = "text-[12px] leading-snug text-[var(--ink-3)]";

export const formErrorClassName = "text-[12px] leading-snug text-[var(--danger)]";
