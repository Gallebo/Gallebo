import { NextResponse } from "next/server";

import { getServerEnv, isCronConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export async function GET(request: Request) {
  if (!isCronConfigured()) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${getServerEnv().CRON_SECRET}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: pilots } = await admin
    .from("pilot_profiles")
    .select("user_id, license_expires_at, medical_expires_at")
    .not("license_expires_at", "is", null);

  let warnings = 0;
  let suspended = 0;

  for (const pilot of pilots ?? []) {
    const dates = [pilot.license_expires_at, pilot.medical_expires_at].filter(
      Boolean
    ) as string[];

    for (const expiresAt of dates) {
      const days = daysUntil(expiresAt);

      if (days < 0 || expiresAt <= today) {
        await admin
          .from("profiles")
          .update({ status: "suspended" })
          .eq("id", pilot.user_id);
        suspended += 1;
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
        await admin.from("notification_queue").insert({
          user_id: pilot.user_id,
          type: warningType,
          payload: { expiresAt, days },
        });
        warnings += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, warnings, suspended });
}
