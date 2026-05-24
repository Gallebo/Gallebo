import Link from "next/link";

import { cn } from "@/lib/utils";

export const authInputClassName = cn(
  "h-12 rounded-xl border px-4 text-[15px] shadow-none",
  "placeholder:text-[var(--ink-3)]",
  "focus-visible:border-[var(--primary-v2)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary-v2)_18%,transparent)]"
);

export const authInputStyle = {
  borderColor: "var(--line)",
  background: "var(--surface)",
  color: "var(--ink)",
} as const;

export const authLabelClassName =
  "text-[13px] font-medium tracking-[-0.01em]";

export function AuthSubmitButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background: "var(--primary-v2)",
        color: "#fff",
        boxShadow: "var(--shadow-primary)",
      }}
    >
      {children}
    </button>
  );
}

export function AuthFieldFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p
      className="text-center text-[14px]"
      style={{ color: "var(--ink-2)" }}
    >
      {children}
    </p>
  );
}

export function AuthFooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium underline underline-offset-4 transition-opacity hover:opacity-80"
      style={{ color: "var(--ink)" }}
    >
      {children}
    </Link>
  );
}
