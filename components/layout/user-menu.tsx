"use client";

import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";

import { logoutAction } from "@/lib/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UserMenu({
  initials,
}: {
  initials: string;
}) {
  return (
    <div className="relative flex items-center gap-2">
      <span
        className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        aria-hidden
      >
        {initials}
      </span>
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <LayoutDashboard className="mr-1 size-4" />
          Dashboard
        </Link>
        <form action={logoutAction}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="mr-1 size-4" />
            Logout
          </Button>
        </form>
      </nav>
    </div>
  );
}
