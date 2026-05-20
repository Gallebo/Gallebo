import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createAdminClient } from "../_shared/supabase.ts";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  target.setUTCHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

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
  const today = new Date().toISOString().slice(0, 10);

  const { data: pilots, error } = await supabase
    .from("pilot_profiles")
    .select("user_id, license_expires_at, medical_expires_at")
    .or(
      "license_expires_at.not.is.null,medical_expires_at.not.is.null",
    );

  if (error) {
    console.error("[pilot-expiry] fetch error:", error.message);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let warnings = 0;
  let suspended = 0;

  for (const pilot of pilots ?? []) {
    const dates = [pilot.license_expires_at, pilot.medical_expires_at].filter(
      Boolean
    ) as string[];

    let pilotSuspended = false;

    for (const expiresAt of dates) {
      const days = daysUntil(expiresAt);

      if (days < 0 || expiresAt <= today) {
        if (!pilotSuspended) {
          const suspendedSinceIso = new Date(Date.now() - 7 * 86_400_000).toISOString();
          const { count: alreadyNotified } = await supabase
            .from("notification_queue")
            .select("id", { count: "exact", head: true })
            .eq("user_id", pilot.user_id)
            .eq("type", "pilot_suspended")
            .gte("created_at", suspendedSinceIso);

          if ((alreadyNotified ?? 0) === 0) {
            await supabase
              .from("profiles")
              .update({ status: "suspended" })
              .eq("id", pilot.user_id);

            await supabase.from("notification_queue").insert({
              user_id: pilot.user_id,
              type: "pilot_suspended",
              payload: { expiresAt },
            });

            suspended += 1;
          }
          pilotSuspended = true;
        }
        continue;
      }

      const warningType =
        days <= 3
          ? "expiry_warning_3d"
          : days <= 14
            ? "expiry_warning_14d"
            : days <= 30
              ? "expiry_warning_30d"
              : null;

      if (warningType) {
        const sinceIso = new Date(Date.now() - 28 * 86_400_000).toISOString();
        const { count } = await supabase
          .from("notification_queue")
          .select("id", { count: "exact", head: true })
          .eq("user_id", pilot.user_id)
          .eq("type", warningType)
          .gte("created_at", sinceIso);

        if ((count ?? 0) > 0) {
          continue;
        }

        const documentLabel =
          expiresAt === pilot.license_expires_at ? "pilot license" : "medical certificate";

        await supabase.from("notification_queue").insert({
          user_id: pilot.user_id,
          type: warningType,
          payload: { expiresAt, days, documentLabel },
        });
        warnings += 1;
      }
    }
  }

  console.log(`[pilot-expiry] done: suspended=${suspended} warnings=${warnings}`);
  return new Response(JSON.stringify({ ok: true, warnings, suspended }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
