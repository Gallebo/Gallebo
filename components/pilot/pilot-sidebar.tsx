"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { PilotSidebarContext } from "@/lib/pilot/queries";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    href: "/pilot",
    label: "Overview",
    exact: true,
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/pilot/flights",
    label: "My Flights",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M21 11l-9.5 5.5L9 19l-1.5-1.5L9.5 13 4 13l-1.5-1.5L4 10l5 .5L11.5 6 13 4.5 14.5 6 13 11l8-1z" />
      </svg>
    ),
  },
  {
    href: "/pilot/bookings",
    label: "Requests",
    badge: true,
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2 20c.8-3 3.8-5 7-5s6.2 2 7 5" />
        <circle cx="17" cy="7" r="3" />
        <path d="M22 17c-.5-2-2-3.2-4-3.7" />
      </svg>
    ),
  },
  {
    href: "/pilot/reviews",
    label: "Reviews",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    href: "/pilot/earnings",
    label: "Earnings",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    href: "/pilot/stripe",
    label: "Payouts",
    payoutAttention: true,
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    href: "/pilot/transactions",
    label: "Transactions",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </svg>
    ),
  },
  {
    href: "/pilot/documents",
    label: "Documents",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
];

function getCurrentLabel(pathname: string): string {
  const match = NAV.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href),
  );
  return match?.label ?? "Pilot";
}

function PilotSidebarContent({
  context,
  onNavigate,
}: {
  context: PilotSidebarContext;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const fullName = `${context.firstName} ${context.lastName}`.trim();

  return (
    <>
      <div className="border-b px-5 py-6" style={{ borderColor: "var(--line)" }}>
        <div
          className="mb-4 flex size-14 items-center justify-center rounded-full text-[15px] font-bold text-white"
          style={{ background: "var(--primary-v2)" }}
        >
          {context.initials}
        </div>
        <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
          {fullName}
        </p>
        <p
          className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--ink-3)" }}
        >
          Pilot · {context.licenseLabel}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-[0.08em]">
          {context.kycVerified ? (
            <span className="flex items-center gap-1.5" style={{ color: "var(--success)" }}>
              <span className="size-1.5 rounded-full bg-current" />
              KYC verified
            </span>
          ) : null}
          <span className="flex items-center gap-1.5" style={{ color: "var(--success)" }}>
            <span className="size-1.5 rounded-full bg-current" />
            {context.status === "verified" ? "Active" : context.status}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const showPayoutAttention =
              "payoutAttention" in item &&
              item.payoutAttention &&
              !context.stripeOnboardingComplete;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors"
                  style={{
                    color: active ? "var(--primary-v2)" : "var(--ink-2)",
                    background: active ? "var(--primary-soft)" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  {active ? (
                    <span
                      className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full"
                      style={{ background: "var(--primary-v2)" }}
                    />
                  ) : null}
                  <span style={{ opacity: active ? 1 : 0.65 }}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && context.pendingRequests > 0 ? (
                    <span
                      className="flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: "var(--coral)" }}
                    >
                      {context.pendingRequests}
                    </span>
                  ) : null}
                  {showPayoutAttention ? (
                    <span
                      className="flex size-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: "var(--sun)" }}
                      title="Payout setup required"
                      aria-label="Payout setup required"
                    >
                      !
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-2 border-t px-3 py-4" style={{ borderColor: "var(--line)" }}>
        <Link
          href="/pilot/flights/new"
          onClick={onNavigate}
          className="btn-v2-coral flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px] font-semibold no-underline"
        >
          <span aria-hidden="true">+</span>
          Post a flight
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--surface-alt)]"
          style={{ color: "var(--ink-3)", background: "transparent", border: "none", cursor: "pointer" }}
          onClick={async () => {
            onNavigate?.();
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push("/login");
            router.refresh();
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Log out
        </button>
      </div>
    </>
  );
}

export function PilotSidebar({ context }: { context: PilotSidebarContext }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const currentLabel = getCurrentLabel(pathname);

  return (
    <>
      <div
        className="sticky top-0 z-40 flex items-center gap-3 border-b px-4 py-3 lg:hidden"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Open pilot menu" />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-[248px] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[248px]"
            style={{ background: "var(--surface)" }}
          >
            <PilotSidebarContent context={context} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          {currentLabel}
        </span>
      </div>

      <aside
        className="hidden w-[248px] shrink-0 flex-col self-stretch border-r lg:flex"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <PilotSidebarContent context={context} />
      </aside>
    </>
  );
}
