import Link from "next/link";

export function PilotPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--ink-3)" }}
        >
          {eyebrow}
        </p>
        <h1
          className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.03em]"
          style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--ink-2)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="btn-v2-coral inline-flex items-center gap-2 whitespace-nowrap px-5 py-3 text-[14px] font-semibold no-underline"
        >
          <span aria-hidden="true">+</span>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
