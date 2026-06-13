"use server";

import { phoneFromDbValue } from "@/lib/crypto/phone";
import { requireUser } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const CHAT_STATUSES = ["confirmed", "completed"] as const;

export type ChatMessageRow = {
  id: string;
  booking_id: string;
  sender_user_id: string | null;
  content: string;
  is_system: boolean;
  created_at: string;
};

export type ContactDetails = {
  pilot: { name: string; phone: string | null };
  passenger: { name: string; phone: string | null };
};

async function assertBookingParticipant(bookingId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("flight_booking_requests")
    .select("id, status, passenger_user_id, flight_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    throw new Error("Booking not found");
  }

  const { data: flight } = await supabase
    .from("flights")
    .select("pilot_user_id")
    .eq("id", booking.flight_id)
    .maybeSingle();

  const isPassenger = booking.passenger_user_id === user.id;
  const isPilot = flight?.pilot_user_id === user.id;

  if (!isPassenger && !isPilot) {
    throw new Error("Not authorized");
  }

  return { user, booking, isPassenger, isPilot };
}

export async function getMessagesAction(
  bookingId: string,
): Promise<{ messages?: ChatMessageRow[]; error?: string; chatLocked?: boolean }> {
  try {
    const { booking } = await assertBookingParticipant(bookingId);

    const chatLocked = !CHAT_STATUSES.includes(
      booking.status as (typeof CHAT_STATUSES)[number],
    );

    // Uvijek dohvati poruke (RLS SELECT policy ne provjerava lock status).
    // Za expired/rejected/cancelled bookinge korisnik može čitati povijest
    // (uključujući sistemske poruke), ali chatLocked: true sprječava novi unos.
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, booking_id, sender_user_id, content, is_system, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (error) return { error: "Failed to load messages" };
    return { messages: data ?? [], chatLocked };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to load messages",
    };
  }
}

export async function sendMessageAction(
  bookingId: string,
  content: string,
): Promise<{ error?: string }> {
  try {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 4000) {
      return { error: "Message must be between 1 and 4000 characters" };
    }

    const { user, booking } = await assertBookingParticipant(bookingId);

    if (
      !CHAT_STATUSES.includes(
        booking.status as (typeof CHAT_STATUSES)[number],
      )
    ) {
      return { error: "Chat is not available for this booking yet" };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("chat_messages").insert({
      booking_id: bookingId,
      sender_user_id: user.id,
      content: trimmed,
      is_system: false,
    });

    if (error) return { error: "Failed to send message" };
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to send message",
    };
  }
}

export async function getContactDetailsAction(
  bookingId: string,
): Promise<{ contacts?: ContactDetails; error?: string }> {
  try {
    const { booking } = await assertBookingParticipant(bookingId);

    if (!["confirmed", "completed"].includes(booking.status)) {
      return { error: "Contact details are available after payment is confirmed" };
    }

    const admin = createAdminClient();
    const { data: full } = await admin
      .from("flight_booking_requests")
      .select("passenger_user_id, flight_id")
      .eq("id", bookingId)
      .single();

    if (!full) return { error: "Booking not found" };

    const { data: flightRow } = await admin
      .from("flights")
      .select("pilot_user_id")
      .eq("id", full.flight_id)
      .single();

    if (!flightRow) return { error: "Flight not found" };

    const userIds = [full.passenger_user_id, flightRow.pilot_user_id];

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, first_name, last_name, phone_encrypted")
      .in("id", userIds);

    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

    const format = (id: string) => {
      const p = byId.get(id);
      const name = p
        ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "User"
        : "User";
      const phone = p?.phone_encrypted
        ? phoneFromDbValue(p.phone_encrypted)
        : null;
      return { name, phone };
    };

    return {
      contacts: {
        pilot: format(flightRow.pilot_user_id),
        passenger: format(full.passenger_user_id),
      },
    };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Failed to load contact details",
    };
  }
}
