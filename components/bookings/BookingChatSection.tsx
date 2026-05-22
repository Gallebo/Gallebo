"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { ContactDetailsPanel } from "@/components/chat/ContactDetailsPanel";
import type { BookingStatus } from "@/lib/bookings/constants";

const CHAT_STATUSES: BookingStatus[] = ["accepted", "confirmed", "completed"];
const CONTACT_STATUSES: BookingStatus[] = ["confirmed", "completed"];

export function BookingChatSection({
  bookingId,
  status,
  currentUserId,
  viewerRole,
}: {
  bookingId: string;
  status: BookingStatus;
  currentUserId: string;
  viewerRole: "pilot" | "passenger";
}) {
  const chatLocked = !CHAT_STATUSES.includes(status);
  const showContacts = CONTACT_STATUSES.includes(status);

  return (
    <div className="space-y-3 border-t pt-3">
      <ChatPanel
        bookingId={bookingId}
        currentUserId={currentUserId}
        chatLocked={chatLocked}
      />
      {showContacts ? (
        <ContactDetailsPanel bookingId={bookingId} viewerRole={viewerRole} />
      ) : null}
    </div>
  );
}
