import { createAdminClient } from "@/lib/supabase/admin";

/** Persists a system message for legal retention (visible in chat once unlocked). */
export async function insertSystemMessage(
  bookingId: string,
  content: string,
): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from("chat_messages").insert({
    booking_id: bookingId,
    sender_user_id: null,
    content,
    is_system: true,
  });

  if (error) {
    console.error("[chat/system]", error.message);
  }
}
