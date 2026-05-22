"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  updateNotificationSettings,
  type NotificationSettings,
} from "@/lib/notifications/settings";

export function NotificationSettingsForm({
  initial,
}: {
  initial: NotificationSettings;
}) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 rounded-lg border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await updateNotificationSettings(settings);
          setMessage(res.success ?? res.error ?? null);
        });
      }}
    >
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Email notifications</span>
        <input
          type="checkbox"
          checked={settings.emailEnabled}
          onChange={(e) =>
            setSettings((s) => ({ ...s, emailEnabled: e.target.checked }))
          }
        />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Push notifications</span>
        <input
          type="checkbox"
          checked={settings.pushEnabled}
          onChange={(e) =>
            setSettings((s) => ({ ...s, pushEnabled: e.target.checked }))
          }
        />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>In-app notifications</span>
        <input
          type="checkbox"
          checked={settings.inAppEnabled}
          onChange={(e) =>
            setSettings((s) => ({ ...s, inAppEnabled: e.target.checked }))
          }
        />
      </label>
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
