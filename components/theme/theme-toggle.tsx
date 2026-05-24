"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "./theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-transparent text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--ink)] ${className ?? ""}`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
