import * as React from "react";
import { ChevronDown } from "lucide-react";

import { formSelectClassName } from "@/lib/ui/form-controls";
import { cn } from "@/lib/utils";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(formSelectClassName, className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[var(--ink-3)]"
        aria-hidden
      />
    </div>
  );
}

export { Select };
