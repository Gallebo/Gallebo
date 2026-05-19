import { cn } from "@/lib/utils";

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="mb-8 flex flex-wrap gap-2">
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
  );
}
