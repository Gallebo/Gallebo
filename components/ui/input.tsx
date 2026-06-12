import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import {
  formControlClassName,
  formInputSizeClassName,
} from "@/lib/ui/form-controls";
import { cn } from "@/lib/utils";

function Input({
  className,
  type,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & {
  size?: keyof typeof formInputSizeClassName;
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        formControlClassName,
        formInputSizeClassName[size],
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--ink)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
