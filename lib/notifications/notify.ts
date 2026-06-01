import type { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type InAppNotificationInput = {
  title: string;
  body: string;
  bookingId?: string;
  flightId?: string;
};

export async function queueUserNotification(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  type: string,
  payload: Json,
  inApp?: InAppNotificationInput,
): Promise<void> {
  const { data: settings } = await admin
    .from("user_notification_settings")
    .select("email_enabled, push_enabled, in_app_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  const emailEnabled = settings?.email_enabled ?? true;
  const pushEnabled = settings?.push_enabled ?? true;
  const inAppEnabled = settings?.in_app_enabled ?? true;

  if (emailEnabled || pushEnabled) {
    await admin.from("notification_queue").insert({
      user_id: userId,
      type,
      payload,
    });
  }

  if (inApp && inAppEnabled) {
    await admin.from("in_app_notifications").insert({
      user_id: userId,
      type,
      title: inApp.title,
      body: inApp.body,
      booking_id: inApp.bookingId ?? null,
      flight_id: inApp.flightId ?? null,
    });
  }
}
