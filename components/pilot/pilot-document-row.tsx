import type { PilotDocumentRow } from "@/lib/pilot/queries";

const BADGE: Record<
  PilotDocumentRow["status"],
  { label: string; bg: string; color: string }
> = {
  verified: {
    label: "Verified",
    bg: "color-mix(in srgb, var(--success) 14%, transparent)",
    color: "var(--success)",
  },
  expiring: {
    label: "Expiring",
    bg: "color-mix(in srgb, var(--coral) 18%, transparent)",
    color: "var(--coral)",
  },
  pending: {
    label: "Pending",
    bg: "var(--surface-alt)",
    color: "var(--ink-3)",
  },
  rejected: {
    label: "Rejected",
    bg: "color-mix(in srgb, var(--danger) 12%, transparent)",
    color: "var(--danger)",
  },
};

export function PilotDocumentRowCard({ doc }: { doc: PilotDocumentRow }) {
  const badge = BADGE[doc.status];

  return (
    <article
      className="flex items-center gap-4 rounded-xl border p-4"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: "var(--surface-alt)" }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: "var(--ink-3)" }} aria-hidden="true">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
          {doc.title}
        </p>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--ink-3)" }}>
          {doc.subtext}
        </p>
      </div>
      <span
        className="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
        style={{ background: badge.bg, color: badge.color }}
      >
        {badge.label}
      </span>
    </article>
  );
}
