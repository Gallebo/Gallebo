"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type" | "size"> & {
  size?: "default" | "lg";
};

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={show ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
        onClick={() => setShow((s) => !s)}
      >
        {show
          ? <EyeOff size={16} aria-hidden="true" />
          : <Eye size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}
