import type { InAppNotificationRow } from "@/lib/notifications/actions";

export function notificationHref(
  n: Pick<InAppNotificationRow, "booking_id" | "flight_id" | "type">,
  role: "pilot" | "passenger" | "admin" | "airfield_operator",
): string {
  if (n.booking_id) {
    if (role === "pilot") {
      return `/pilot/bookings#booking-${n.booking_id}`;
    }
    return `/passenger/bookings#booking-${n.booking_id}`;
  }
  if (n.flight_id) {
    return `/flights/${n.flight_id}`;
  }
  if (n.type === "flight_alert_expiry_warning") {
    return "/passenger/alerts";
  }
  return role === "pilot" ? "/pilot/bookings" : "/passenger/bookings";
}
