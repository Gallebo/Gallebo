"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
});

export type NotificationSettings = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
};

export async function getNotificationSettings(): Promise<{
  settings?: NotificationSettings;
  error?: string;
}> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_notification_settings")
      .select("email_enabled, push_enabled, in_app_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return { error: error.message };

    if (!data) {
      return {
        settings: {
          emailEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
        },
      };
    }

    return {
      settings: {
        emailEnabled: data.email_enabled,
        pushEnabled: data.push_enabled,
        inAppEnabled: data.in_app_enabled,
      },
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to load settings",
    };
  }
}

export async function updateNotificationSettings(
  input: NotificationSettings,
): Promise<{ error?: string; success?: string }> {
  try {
    const user = await requireUser();
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) {
      return { error: "Invalid settings" };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("user_notification_settings").upsert({
      user_id: user.id,
      email_enabled: parsed.data.emailEnabled,
      push_enabled: parsed.data.pushEnabled,
      in_app_enabled: parsed.data.inAppEnabled,
      updated_at: new Date().toISOString(),
    });

    if (error) return { error: error.message };

    revalidatePath("/passenger/profile");
    return { success: "Settings saved" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to save settings",
    };
  }
}
