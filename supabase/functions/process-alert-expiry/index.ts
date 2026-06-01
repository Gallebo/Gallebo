import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createAdminClient } from "../_shared/supabase.ts";

serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  const auth = req.headers.get("Authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();

  let warned = 0;
  let deactivated = 0;

  const { data: expiringSoon, error: warnErr } = await supabase
    .from("flight_alerts")
    .select("id, passenger_user_id")
    .eq("is_active", true)
    .eq("expiry_notified", false)
    .lte("expires_at", in24h)
    .gt("expires_at", nowIso);

  if (warnErr) {
    console.error("[process-alert-expiry] warn fetch:", warnErr.message);
  } else {
    for (const alert of expiringSoon ?? []) {
      const { data: settings } = await supabase
        .from("user_notification_settings")
        .select("email_enabled, in_app_enabled")
        .eq("user_id", alert.passenger_user_id)
        .maybeSingle();

      const emailEnabled = settings?.email_enabled !== false;
      const inAppEnabled = settings?.in_app_enabled !== false;
      const bothDisabled = !emailEnabled && !inAppEnabled;

      let notificationSent = false;

      if (emailEnabled) {
        const { error: qErr } = await supabase.from("notification_queue").insert({
          user_id: alert.passenger_user_id,
          type: "flight_alert_expiry_warning",
          payload: { alertId: alert.id },
        });
        if (qErr) {
          console.error(
            `[process-alert-expiry] queue insert failed for ${alert.id}:`,
            qErr.message,
          );
        } else {
          notificationSent = true;
        }
      }

      if (inAppEnabled) {
        const { error: iaErr } = await supabase.from("in_app_notifications").insert({
          user_id: alert.passenger_user_id,
          type: "flight_alert_expiry_warning",
          title: "Alert expiring soon",
          body: "Your flight alert expires tomorrow. Extend it with one click.",
        });
        if (iaErr) {
          console.error(
            `[process-alert-expiry] in_app insert failed for ${alert.id}:`,
            iaErr.message,
          );
        } else {
          notificationSent = true;
        }
      }

      if (notificationSent) {
        const { error: flagErr } = await supabase
          .from("flight_alerts")
          .update({ expiry_notified: true })
          .eq("id", alert.id)
          .eq("is_active", true);

        if (!flagErr) warned += 1;
      } else if (bothDisabled) {
        // Retry when user re-enables notifications; do not set expiry_notified
        continue;
      }
    }
  }

  const { data: expired, error: expErr } = await supabase
    .from("flight_alerts")
    .select("id")
    .eq("is_active", true)
    .lte("expires_at", nowIso);

  if (expErr) {
    console.error("[process-alert-expiry] expired fetch:", expErr.message);
    return new Response(JSON.stringify({ ok: false, error: expErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const expiredIds = (expired ?? []).map((a) => a.id);
  if (expiredIds.length > 0) {
    const { error: deactivateErr } = await supabase
      .from("flight_alerts")
      .update({ is_active: false })
      .in("id", expiredIds)
      .eq("is_active", true);

    if (deactivateErr) {
      console.error("[process-alert-expiry] bulk deactivate:", deactivateErr.message);
      return new Response(
        JSON.stringify({ ok: false, error: deactivateErr.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    deactivated = expiredIds.length;
  }

  console.log(`[process-alert-expiry] warned=${warned} deactivated=${deactivated}`);

  return new Response(
    JSON.stringify({ ok: true, warned, deactivated }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
