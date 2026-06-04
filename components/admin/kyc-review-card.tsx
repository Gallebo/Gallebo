"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  approveVerificationAction,
  rejectVerificationAction,
} from "@/lib/admin/actions";
import { AdminStatusPill } from "@/components/admin/admin-status-pill";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function KycReviewCard({
  id,
  name,
  roleLabel,
  requestedRole,
  submittedLabel,
  risk,
  diditStatusLabel,
  autoApproved,
  documents,
}: {
  id: string;
  name: string;
  roleLabel: string;
  requestedRole: string;
  submittedLabel: string;
  risk: "low" | "medium";
  diditStatusLabel: string;
  autoApproved: boolean;
  documents: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isPassenger = requestedRole === "passenger";
  const isPilot = requestedRole === "pilot";

  return (
    <article
      className="rounded-2xl px-6 py-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-[14px] font-bold"
            style={{
              background: "var(--surface-alt)",
              color: "var(--ink-2)",
              border: "1px solid var(--line)",
            }}
            aria-hidden
          >
            {initials(name)}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
              {name}
            </h3>
            <p className="mt-0.5 text-[13px]" style={{ color: "var(--ink-3)" }}>
              {roleLabel} • Submitted {submittedLabel}
            </p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--ink-2)" }}>
              Didit KYC: {diditStatusLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminStatusPill variant={risk === "low" ? "risk-low" : "risk-medium"}>
            {risk === "low" ? "LOW RISK" : "MEDIUM RISK"}
          </AdminStatusPill>
          {isPassenger && autoApproved ? (
            <AdminStatusPill variant="completed">Auto-approved (Didit)</AdminStatusPill>
          ) : null}
          {isPilot && autoApproved ? (
            <AdminStatusPill variant="completed">Didit identity OK</AdminStatusPill>
          ) : null}
        </div>
      </div>

      {isPilot ? (
        <p
          className="mt-3 text-[13px]"
          style={{ color: "var(--ink-2)" }}
        >
          Identity verified via Didit KYC — review licence and medical only.
        </p>
      ) : (
        <p className="mt-3 text-[13px]" style={{ color: "var(--ink-3)" }}>
          No documents to review. Identity is verified through Didit only.
        </p>
      )}

      {isPilot && documents.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {documents.map((doc) => (
            <span
              key={doc}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: "var(--primary-soft)",
                color: "var(--primary-v2)",
              }}
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {doc}
            </span>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-[13px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const reason = window.prompt("Rejection reason (required):");
            if (!reason?.trim()) return;
            setError(null);
            startTransition(async () => {
              const res = await rejectVerificationAction(id, reason.trim());
              if (res.error) setError(res.error);
              else router.refresh();
            });
          }}
          className="rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-opacity disabled:opacity-50"
          style={{
            background: "color-mix(in srgb, var(--danger) 10%, transparent)",
            color: "var(--danger)",
            border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)",
          }}
        >
          Reject
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await approveVerificationAction(id);
              if (res.error) setError(res.error);
              else router.refresh();
            });
          }}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: "var(--primary-v2)" }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Approve
        </button>
        <Link
          href={`/admin/verifications/${id}`}
          className="ml-auto text-[13px] font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--ink-2)", textDecoration: "none" }}
        >
          {isPassenger ? "View Didit status" : "Review documents"}
        </Link>
      </div>
    </article>
  );
}
