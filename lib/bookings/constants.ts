export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "Request sent",
  accepted: "Awaiting payment",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
  expired: "Expired",
};

export type BookingStatus =
  | "pending"
  | "accepted"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected"
  | "expired";
