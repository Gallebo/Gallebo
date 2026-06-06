"use client";

import Link from "next/link";
import { Building2, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV = [
  {
    href: "/admin",
    label: "Overview",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/kyc",
    label: "KYC Queue",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 4v6c0 4.2-3 7.8-7 9-4-1.2-7-4.8-7-9V7l7-4z" />
      </svg>
    ),
    badge: "kyc" as const,
  },
  {
    href: "/admin/airfield-requests",
    label: "Airfield Requests",
    icon: <Building2 width={16} height={16} strokeWidth={1.7} aria-hidden="true" />,
    badge: "airfield" as const,
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/admin/flights",
    label: "Flights",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11l-9.5 5.5L9 19l-1.5-1.5L9.5 13 4 13l-1.5-1.5L4 10l5 .5L11.5 6 13 4.5 14.5 6 13 11l8-1z" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2 20c.8-3 3.8-5 7-5s6.2 2 7 5" />
        <circle cx="17" cy="7" r="3" />
        <path d="M22 17c-.5-2-2-3.2-4-3.7" />
      </svg>
    ),
  },
  {
    href: "/admin/revenue",
    label: "Revenue",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h12" />
        <path d="M6 8c0 3.3 2.7 6 6 6s6-2.7 6-6" />
        <path d="M6 21h12" />
        <path d="M6 16c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 17V9" />
        <path d="M12 17V7" />
        <path d="M16 17v-4" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83l-.06.06a2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

function getCurrentLabel(pathname: string): string {
  const match = NAV.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href),
  );
  return match?.label ?? "Admin";
}

function AdminSidebarContent({
  kycCount,
  airfieldRequestsCount,
  onNavigate,
}: {
  kycCount: number;
  airfieldRequestsCount: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="border-b px-5 py-6" style={{ borderColor: "var(--admin-sidebar-border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ background: "var(--coral)" }}
            aria-hidden
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 18l4-9 4 5 4-11 4 15" />
            </svg>
          </div>
          <div>
            <div
              className="text-[14px] font-semibold"
              style={{ color: "var(--admin-sidebar-fg)" }}
            >
              Admin Panel
            </div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--admin-sidebar-muted)" }}
            >
              Super admin
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="size-2 shrink-0 rounded-full" style={{ background: "var(--success)" }} aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--success)" }}>
            All systems operational
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {NAV.map((item) => {
            const active = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            const badgeCount =
              item.badge === "kyc"
                ? kycCount
                : item.badge === "airfield"
                  ? airfieldRequestsCount
                  : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className="relative flex items-center gap-3 rounded-xl py-2.5 pl-3 pr-3 text-[13.5px] font-medium transition-colors"
                  style={{
                    color: active
                      ? "var(--admin-sidebar-link-active)"
                      : "var(--admin-sidebar-link)",
                    background: active ? "var(--admin-sidebar-active-bg)" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  {active ? (
                    <span
                      className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full"
                      style={{ background: "var(--coral)" }}
                      aria-hidden
                    />
                  ) : null}
                  <span style={{ opacity: active ? 1 : 0.75 }}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && badgeCount > 0 ? (
                    <span
                      className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                      style={{ background: "var(--coral)" }}
                    >
                      {badgeCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t px-4 py-4" style={{ borderColor: "var(--admin-sidebar-border)" }}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="admin-sidebar-exit-link flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] transition-colors"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Exit admin
        </Link>
      </div>
    </>
  );
}

interface AdminSidebarProps {
  kycCount?: number;
  airfieldRequestsCount?: number;
}

export function AdminSidebar({
  kycCount = 0,
  airfieldRequestsCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const currentLabel = getCurrentLabel(pathname);

  return (
    <>
      <div
        className="sticky top-0 z-40 flex items-center gap-3 border-b px-4 py-3 lg:hidden"
        style={{
          borderColor: "var(--admin-sidebar-border)",
          background: "var(--admin-sidebar-bg)",
          color: "var(--admin-sidebar-fg)",
        }}
      >
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--admin-sidebar-fg)] hover:bg-[color-mix(in_srgb,var(--admin-sidebar-fg)_10%,transparent)]"
                aria-label="Open admin menu"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="admin-sidebar flex w-[248px] flex-col gap-0 overflow-y-auto border-r-0 p-0 sm:max-w-[248px]"
          >
            <AdminSidebarContent
              kycCount={kycCount}
              airfieldRequestsCount={airfieldRequestsCount}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--admin-sidebar-fg)" }}
        >
          {currentLabel}
        </span>
      </div>

      <aside className="admin-sidebar hidden w-[248px] shrink-0 flex-col self-stretch lg:flex">
        <AdminSidebarContent
          kycCount={kycCount}
          airfieldRequestsCount={airfieldRequestsCount}
        />
      </aside>
    </>
  );
}
