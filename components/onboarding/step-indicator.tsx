import { cn } from "@/lib/utils";

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <>
      <p className="mb-4 text-sm font-medium text-muted-foreground sm:hidden">
        Step {current} of {steps.length} — {steps[current - 1]}
      </p>
      <ol className="mb-8 hidden flex-wrap gap-2 sm:flex">
        {steps.map((label, i) => (
          <li
            key={label}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              i + 1 === current
                ? "bg-primary text-primary-foreground"
                : i + 1 < current
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>
    </>
  );
}
