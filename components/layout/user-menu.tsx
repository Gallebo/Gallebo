"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme/theme-provider";
import { logoutAction } from "@/lib/auth/actions";

export function UserMenu({
  initials,
  isAdmin = false,
}: {
  initials: string;
  isAdmin?: boolean;
}) {
  const { theme, toggle } = useTheme();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(() => {
      void logoutAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-9 cursor-pointer items-center justify-center rounded-full text-sm font-semibold text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          background: isAdmin ? "var(--coral)" : "var(--primary-v2)",
        }}
        aria-label="Account menu"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem render={<Link href="/dashboard" />}>
          Dashboard
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem render={<Link href="/admin" />}>
            Admin panel
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggle}>
          {theme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          disabled={pending}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
