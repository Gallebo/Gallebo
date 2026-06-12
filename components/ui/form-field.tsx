import type { ReactNode } from "react";

import {
  formErrorClassName,
  formHintClassName,
  formLabelClassName,
} from "@/lib/ui/form-controls";
import { cn } from "@/lib/utils";

export function FormField({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-1.5", className)}>{children}</div>;
}

export function FormLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn(formLabelClassName, className)}>
      {children}
    </label>
  );
}

export function FormHint({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn(formHintClassName, className)}>{children}</p>;
}

export function FormError({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return <p className={cn(formErrorClassName, className)}>{children}</p>;
}
