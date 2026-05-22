import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/lib/bookings/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  accepted: "bg-blue-500/15 text-blue-800 dark:text-blue-200",
  confirmed: "bg-green-500/15 text-green-800 dark:text-green-200",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-red-500/15 text-red-800 dark:text-red-200",
  expired: "bg-muted text-muted-foreground",
};

export function BookingStatusBadge({ status }: { status: BookingStatus | string }) {
  const label = BOOKING_STATUS_LABELS[status] ?? status;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-muted",
      )}
    >
      {label}
    </span>
  );
}
