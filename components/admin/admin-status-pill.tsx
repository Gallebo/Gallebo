type AdminStatusVariant = "completed" | "active" | "scheduled" | "pilot" | "passenger" | "kyc" | "risk-low" | "risk-medium";

const VARIANTS: Record<
  AdminStatusVariant,
  { bg: string; color: string; label?: string }
> = {
  completed: {
    bg: "color-mix(in srgb, var(--success) 14%, transparent)",
    color: "var(--success)",
  },
  active: {
    bg: "color-mix(in srgb, var(--primary-v2) 12%, transparent)",
    color: "var(--primary-v2)",
  },
  scheduled: {
    bg: "var(--surface-alt)",
    color: "var(--ink-3)",
  },
  pilot: {
    bg: "var(--primary-soft)",
    color: "var(--primary-v2)",
  },
  passenger: {
    bg: "var(--surface-alt)",
    color: "var(--ink-2)",
  },
  kyc: {
    bg: "color-mix(in srgb, var(--sun) 18%, transparent)",
    color: "#9A6B12",
  },
  "risk-low": {
    bg: "color-mix(in srgb, var(--success) 14%, transparent)",
    color: "var(--success)",
  },
  "risk-medium": {
    bg: "color-mix(in srgb, var(--coral) 14%, transparent)",
    color: "var(--coral)",
  },
};

export function AdminStatusPill({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: AdminStatusVariant;
}) {
  const v = VARIANTS[variant];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
      style={{ background: v.bg, color: v.color }}
    >
      {children}
    </span>
  );
}
