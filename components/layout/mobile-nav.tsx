"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { logoutAction } from "@/lib/auth/actions";

function buildNavLinks(becomePilotHref: string) {
  return [
    { href: "/flights", label: "Find a flight" },
    { href: "/airfields", label: "Airfields" },
    { href: becomePilotHref, label: "Become a pilot" },
    { href: "/#how", label: "How it works" },
    { href: "/#faq", label: "FAQ" },
  ] as const;
}

export function MobileNav({
  user,
  isAdmin,
  becomePilotHref = "/login",
}: {
  user: { email: string } | null;
  isAdmin: boolean;
  becomePilotHref?: string;
}) {
  const navLinks = buildNavLinks(becomePilotHref);
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(() => {
      void logoutAction();
    });
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[min(100vw-2rem,20rem)] flex-col p-0 sm:max-w-xs">
        <SheetHeader className="border-b px-5 py-4" style={{ borderColor: "var(--line)" }}>
          <SheetTitle className="text-left text-base font-semibold">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-3 py-4">
          {navLinks.map(({ href, label }) => (
            <SheetClose
              key={href}
              render={
                <Link
                  href={href}
                  className="rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface-alt)]"
                  style={{ color: "var(--ink-2)", textDecoration: "none" }}
                />
              }
            >
              {label}
            </SheetClose>
          ))}
        </nav>
        <div
          className="mt-auto space-y-2 border-t px-3 py-4"
          style={{ borderColor: "var(--line)" }}
        >
          {!user ? (
            <>
              <SheetClose
                render={
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface-alt)]"
                    style={{ color: "var(--ink-2)", textDecoration: "none" }}
                  />
                }
              >
                Log in
              </SheetClose>
              <SheetClose
                render={
                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "var(--primary-v2)", textDecoration: "none" }}
                  />
                }
              >
                Sign up
              </SheetClose>
              <div className="flex justify-center pt-2">
                <ThemeToggle />
              </div>
            </>
          ) : (
            <>
              <SheetClose
                render={
                  <Link
                    href="/dashboard"
                    className="flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface-alt)]"
                    style={{ color: "var(--ink-2)", textDecoration: "none" }}
                  />
                }
              >
                Dashboard
              </SheetClose>
              {isAdmin ? (
                <SheetClose
                  render={
                    <Link
                      href="/admin"
                      className="flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface-alt)]"
                      style={{ color: "var(--ink-2)", textDecoration: "none" }}
                    />
                  }
                >
                  Admin panel
                </SheetClose>
              ) : null}
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface-alt)] disabled:opacity-50"
                style={{
                  color: "var(--destructive, #dc2626)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={handleLogout}
                disabled={pending}
              >
                {pending ? "Logging out…" : "Log out"}
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
