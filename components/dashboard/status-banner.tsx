import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";

import type { UserStatus } from "@/lib/types/profile";
import { cn } from "@/lib/utils";

const config: Record<
  UserStatus,
  { icon: typeof Clock; title: string; description: string; variant: string }
> = {
  registered: {
    icon: Clock,
    title: "Complete verification",
    description: "Choose how you want to use Gallebo to get started.",
    variant: "border-primary/30 bg-primary/5 text-primary",
  },
  pending: {
    icon: Clock,
    title: "Under review",
    description: "We are reviewing your documents. We will notify you by email.",
    variant: "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100",
  },
  verified: {
    icon: CheckCircle2,
    title: "Verified",
    description: "Your account is verified. You can book and offer flights.",
    variant: "border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100",
  },
  suspended: {
    icon: ShieldAlert,
    title: "Account suspended",
    description:
      "Your pilot documents may have expired. Upload new documents to continue.",
    variant: "border-destructive/30 bg-destructive/5 text-destructive",
  },
};

export function StatusBanner({ status }: { status: UserStatus }) {
  const { icon: Icon, title, description, variant } = config[status];

  return (
    <div
      className={cn("flex gap-4 rounded-xl border p-4", variant)}
      role="status"
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm opacity-90">{description}</p>
      </div>
    </div>
  );
}
