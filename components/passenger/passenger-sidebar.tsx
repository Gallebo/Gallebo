"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type { PassengerSidebarContext } from "@/lib/passenger/queries";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    href: "/passenger",
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
    href: "/passenger/bookings",
    label: "My Bookings",
    badge: true,
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/flights",
    label: "Explore flights",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    href: "/passenger/reviews",
    label: "My Reviews",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    href: "/passenger/profile",
    label: "Profile",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function PassengerSidebar({ context }: { context: PassengerSidebarContext }) {
  const pathname = usePathname();
  const router = useRouter();
  const fullName = `${context.firstName} ${context.lastName}`.trim();

  return (
    <aside
      className="flex w-[248px] shrink-0 flex-col self-stretch border-r"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
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
          Passenger
        </p>
        {context.idVerified ? (
          <p
            className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--success)" }}
          >
            <span className="size-1.5 rounded-full bg-current" />
            ID verified · Didit
          </p>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors no-underline"
                  style={{
                    color: active ? "var(--primary-v2)" : "var(--ink-2)",
                    background: active ? "var(--primary-soft)" : "transparent",
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
                  {item.badge && context.activeBookings > 0 ? (
                    <span
                      className="flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: "var(--coral)" }}
                    >
                      {context.activeBookings}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t px-3 py-4" style={{ borderColor: "var(--line)" }}>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--surface-alt)]"
          style={{ color: "var(--ink-3)", background: "transparent", border: "none", cursor: "pointer" }}
          onClick={async () => {
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
    </aside>
  );
}
