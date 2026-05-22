"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export type InAppNotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  booking_id: string | null;
  flight_id: string | null;
  read_at: string | null;
  created_at: string;
};

export async function getNotificationsAction(): Promise<{
  notifications?: InAppNotificationRow[];
  unreadCount?: number;
  error?: string;
}> {
  try {
    await requireUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("in_app_notifications")
      .select(
        "id, type, title, body, booking_id, flight_id, read_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) return { error: error.message };

    const unreadCount = (data ?? []).filter((n) => !n.read_at).length;
    return { notifications: data ?? [], unreadCount };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to load notifications",
    };
  }
}

export async function markReadAction(
  notificationId: string,
): Promise<{ error?: string }> {
  try {
    await requireUser();
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("in_app_notifications")
      .update({ read_at: now })
      .eq("id", notificationId)
      .is("read_at", null);

    if (error) return { error: error.message };
    revalidatePath("/", "layout");
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to mark notification",
    };
  }
}

export async function markAllReadAction(): Promise<{ error?: string }> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("in_app_notifications")
      .update({ read_at: now })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) return { error: error.message };
    revalidatePath("/", "layout");
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to mark notifications",
    };
  }
}
