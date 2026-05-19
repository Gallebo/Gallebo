import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StepCardProps = {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/** Wrapper for a single onboarding step (plan: StepCard). */
export function StepCard({
  step,
  title,
  description,
  children,
  className,
}: StepCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">
          Step {step} — {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
