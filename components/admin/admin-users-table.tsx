"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminStatusPill } from "@/components/admin/admin-status-pill";
import type { AdminUserRow } from "@/lib/admin/queries";

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <div className="space-y-4">
      <label className="relative block">
        <span className="sr-only">Search users</span>
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--ink-3)"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-2xl py-3.5 pl-11 pr-4 text-[14px] outline-none transition-shadow focus:ring-2"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
          }}
        />
      </label>

      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: "1px solid var(--line)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--line)",
                  background: "var(--surface-alt)",
                }}
              >
                {["USER", "ROLE", "FLIGHTS", "JOINED", "STATUS", ""].map((label) => (
                  <th
                    key={label || "actions"}
                    className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "var(--ink-3)" }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: "var(--surface)" }}>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-[14px]"
                    style={{ color: "var(--ink-3)" }}
                  >
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom:
                        i < filtered.length - 1 ? "1px solid var(--line)" : "none",
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                        {row.name}
                      </div>
                      <div className="text-[12px]" style={{ color: "var(--ink-3)" }}>
                        {row.email}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <AdminStatusPill variant={row.roleVariant}>
                        {row.role}
                      </AdminStatusPill>
                    </td>
                    <td className="px-5 py-4 text-[14px]" style={{ color: "var(--ink)" }}>
                      {row.flightsCount}
                    </td>
                    <td
                      className="px-5 py-4 text-[13px]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      {row.joinedLabel}
                    </td>
                    <td className="px-5 py-4">
                      <AdminStatusPill
                        variant={
                          row.statusVariant === "kyc"
                            ? "kyc"
                            : row.statusVariant === "scheduled"
                              ? "scheduled"
                              : "completed"
                        }
                      >
                        {row.status}
                      </AdminStatusPill>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/users/${row.id}`}
                        className="text-[13px] font-medium hover:underline"
                        style={{ color: "var(--ink-2)", textDecoration: "none" }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
