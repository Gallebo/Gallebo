"use client";

import Link from "next/link";

import { logoutAction } from "@/lib/auth/actions";

export function UserMenu({
  initials,
  roleLabel,
  isAdmin = false,
}: {
  initials: string;
  roleLabel?: string;
  isAdmin?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="hidden items-center gap-1.5 text-sm sm:inline-flex"
        style={{ color: "var(--ink-2)" }}
        aria-hidden
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
        </svg>
        EN
      </span>

      <div className="flex items-center gap-2">
        <span
          className="flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: isAdmin ? "var(--coral)" : "var(--primary-v2)" }}
          aria-hidden
        >
          {initials}
        </span>
        {roleLabel ? (
          <span className="hidden text-sm font-medium sm:inline" style={{ color: "var(--ink)" }}>
            {roleLabel}
          </span>
        ) : null}
      </div>

      <Link
        href={isAdmin ? "/admin" : "/dashboard"}
        className="hidden text-sm font-medium transition-opacity hover:opacity-80 sm:inline"
        style={{ color: "var(--ink-2)", textDecoration: "none" }}
      >
        Dashboard
      </Link>

      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
          style={{
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--line-strong)",
          }}
        >
          Log out
        </button>
      </form>
    </div>
  );
}
