import Link from "next/link";

import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { GalleboWordmark } from "@/components/marketing/seagull-wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
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

type SiteHeaderProps = {
  className?: string;
  user: { email: string } | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    role: string | null;
    status: string;
  } | null;
  pilotLink: string;
};

export function SiteHeader({
  className,
  user,
  profile,
  pilotLink,
}: SiteHeaderProps) {
  const isAdmin = profile?.role === "admin";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b",
        className
      )}
      style={{
        borderColor: "var(--line)",
        background: "color-mix(in srgb, var(--bg) 84%, transparent)",
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
      }}
    >
      <div
        className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        style={{ height: "var(--header-height)" }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="transition-opacity hover:opacity-80"
          style={{ color: "var(--ink)" }}
        >
          <GalleboWordmark size={16} />
        </Link>

        {/* Centre nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {[
            { href: "/flights", label: "Find a flight" },
            { href: "/airfields", label: "Airfields" },
            { href: pilotLink, label: "Become a pilot" },
            { href: "/safety", label: "Safety" },
            { href: "/#how", label: "How it works" },
            { href: "/#faq", label: "FAQ" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-normal transition-colors hover:opacity-100"
              style={{
                color: "var(--ink-2)",
                letterSpacing: "-0.005em",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <MobileNav
            user={user ? { email: user.email ?? "" } : null}
            isAdmin={isAdmin}
            becomePilotHref={pilotLink}
          />
          {!user ? <ThemeToggle className="hidden lg:inline-flex" /> : null}
          {user ? (
            <UserMenu
              initials={initialsFrom(
                profile?.first_name ?? null,
                profile?.last_name ?? null,
                user.email ?? "U"
              )}
              isAdmin={isAdmin}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium transition-colors"
                style={{ color: "var(--ink-2)" }}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: "var(--primary-v2)" }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
