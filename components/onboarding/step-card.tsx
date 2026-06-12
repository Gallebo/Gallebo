import { cn } from "@/lib/utils";

type StepCardProps = {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/** Open step section — no bordered card chrome. */
export function StepCard({
  step,
  title,
  description,
  children,
  className,
}: StepCardProps) {
  return (
    <section className={cn("space-y-5", className)}>
      <header
        className="border-b pb-4"
        style={{ borderColor: "var(--line)" }}
      >
        <span className="badge-v2 badge-v2-primary mb-3 inline-flex">
          Step {step}
        </span>
        <h2
          className="text-[1.15rem] font-semibold tracking-[-0.02em]"
          style={{ color: "var(--ink)" }}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            {description}
          </p>
        ) : null}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
