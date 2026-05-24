"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    badge: true,
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

interface AdminSidebarProps {
  kycCount?: number;
}

export function AdminSidebar({ kycCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
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
            <div className="text-[14px] font-semibold text-white">Admin Panel</div>
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
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="relative flex items-center gap-3 rounded-xl py-2.5 pl-3 pr-3 text-[13.5px] font-medium transition-colors"
                  style={{
                    color: active ? "#fff" : "rgba(255,255,255,.58)",
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
                  {item.badge && kycCount > 0 ? (
                    <span
                      className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                      style={{ background: "var(--coral)" }}
                    >
                      {kycCount}
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
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] transition-colors hover:text-white"
          style={{ color: "var(--admin-sidebar-muted)", textDecoration: "none" }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Exit admin
        </Link>
      </div>
    </aside>
  );
}
