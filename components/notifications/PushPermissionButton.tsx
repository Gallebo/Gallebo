"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function PushPermissionButton() {
  const [status, setStatus] = useState<string>("Checking…");
  const [loading, setLoading] = useState(false);

  const refreshStatus = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatus("Push not supported in this browser");
      return;
    }
    setStatus(Notification.permission);
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  async function subscribe() {
    setLoading(true);
    try {
      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublic) {
        setStatus("VAPID public key not configured");
        return;
      }

      const permission = await Notification.requestPermission();
      refreshStatus();
      if (permission !== "granted") {
        setStatus("Permission denied");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setStatus(data.error ?? "Subscribe failed");
        return;
      }

      setStatus("Subscribed on this device");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Subscribe failed");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("Unsubscribed");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Unsubscribe failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Status: {status}</span>
      <Button type="button" disabled={loading} onClick={() => void subscribe()}>
        Enable push
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={() => void unsubscribe()}
      >
        Disable on this device
      </Button>
    </div>
  );
}
