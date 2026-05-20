import Link from "next/link";
import { Plane } from "lucide-react";

import { UserMenu } from "@/components/layout/user-menu";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function initialsFrom(
  firstName: string | null,
  lastName: string | null,
  email: string
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export async function SiteHeader({ className }: { className?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { first_name: string | null; last_name: string | null } | null =
    null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
          <Plane className="size-6" aria-hidden />
          <span className="text-xl tracking-tight">Gallebo</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          <Link
            href="/map"
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Airfields
          </Link>
          <Link
            href="/pilot"
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            I&apos;m a pilot
          </Link>
          <Link
            href="/help"
            className="hidden text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Help
          </Link>
          {user ? (
            <UserMenu
              initials={initialsFrom(
                profile?.first_name ?? null,
                profile?.last_name ?? null,
                user.email ?? "U"
              )}
            />
          ) : (
            <Link
              href="/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Login or Register
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
