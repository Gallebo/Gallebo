import * as React from "react";

import { formTextareaClassName } from "@/lib/ui/form-controls";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(formTextareaClassName, className)}
      {...props}
    />
  );
}

export { Textarea };
