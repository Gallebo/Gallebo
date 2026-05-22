import webpush from "npm:web-push@3.6.7";

import type { createAdminClient } from "./supabase.ts";

export function configureWebPush(): boolean {
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@gallebo.app";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushToUser(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!configureWebPush()) return;

  const { data: settings } = await supabase
    .from("user_notification_settings")
    .select("push_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (settings?.push_enabled === false) return;

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
  });

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushPayload,
      );
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
      console.warn("[push] send failed:", sub.endpoint, e);
    }
  }
}
