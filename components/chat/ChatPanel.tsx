"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMessagesAction,
  sendMessageAction,
  type ChatMessageRow,
} from "@/lib/chat/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ChatPanel({
  bookingId,
  currentUserId,
  chatLocked,
}: {
  bookingId: string;
  currentUserId: string;
  chatLocked: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await getMessagesAction(bookingId);
    if (res.error) {
      setError(res.error);
      return;
    }
    setMessages(res.messages ?? []);
    setError(null);
  }, [bookingId]);

  useEffect(() => {
    if (chatLocked) return;
    void load();
  }, [chatLocked, load]);

  useEffect(() => {
    if (chatLocked) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId, chatLocked]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (chatLocked) {
    return (
      <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
        Chat opens after the pilot accepts your booking.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <h4 className="text-sm font-medium">Messages</h4>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((m) =>
            m.is_system ? (
              <p
                key={m.id}
                className="text-center text-xs text-muted-foreground py-1"
              >
                {m.content}
              </p>
            ) : (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.sender_user_id === currentUserId
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {m.content}
              </div>
            ),
          )
        )}
        <div ref={bottomRef} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          startTransition(async () => {
            const res = await sendMessageAction(bookingId, text);
            if (res.error) {
              setError(res.error);
            } else {
              setDraft("");
              setError(null);
              await load();
            }
          });
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          maxLength={4000}
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
