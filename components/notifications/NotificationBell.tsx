"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  getNotificationsAction,
  markAllReadAction,
  markReadAction,
  type InAppNotificationRow,
} from "@/lib/notifications/actions";
import { notificationHref } from "@/lib/notifications/href";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell({
  userId,
  role,
}: {
  userId: string;
  role: "pilot" | "passenger" | "admin" | "airfield_operator";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const res = await getNotificationsAction();
    if (res.notifications) {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount ?? 0);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`in-app-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "in_app_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as InAppNotificationRow;
          setNotifications((prev) => [incoming, ...prev].slice(0, 30));
          setUnreadCount((c) => c + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "in_app_notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-xs text-primary hover:underline disabled:opacity-50"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await markAllReadAction();
                    await refresh();
                    router.refresh();
                  });
                }}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-3 py-4 text-sm text-muted-foreground">
                No notifications yet.
              </li>
            ) : (
              notifications.map((n) => (
                <li key={n.id} className="border-b last:border-b-0">
                  <Link
                    href={notificationHref(n, role)}
                    className="block px-3 py-2 hover:bg-muted/50"
                    onClick={() => {
                      setOpen(false);
                      if (!n.read_at) {
                        void markReadAction(n.id);
                        setNotifications((prev) =>
                          prev.map((item) =>
                            item.id === n.id
                              ? {
                                  ...item,
                                  read_at: new Date().toISOString(),
                                }
                              : item,
                          ),
                        );
                        setUnreadCount((c) => Math.max(0, c - 1));
                      }
                    }}
                  >
                    <p
                      className={
                        n.read_at
                          ? "text-sm text-muted-foreground"
                          : "text-sm font-medium"
                      }
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {n.body}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
