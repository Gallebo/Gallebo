"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function storePilotIban(
  userId: string,
  iban: string
): Promise<{ secretId?: string; error?: string }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("store_pilot_iban", {
      p_user_id: userId,
      p_iban: iban,
    });

    if (error) {
      return { error: error.message };
    }

    return { secretId: data as string };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to store IBAN",
    };
  }
}

export async function deletePilotIban(secretId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("delete_pilot_iban", { p_secret_id: secretId });
}
