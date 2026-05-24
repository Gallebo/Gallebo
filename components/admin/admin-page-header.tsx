interface AdminPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  trailing,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p
          className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--ink-3)" }}
        >
          {eyebrow}
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.2vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[14px]" style={{ color: "var(--ink-2)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}
