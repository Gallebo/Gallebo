import { PushPermissionButton } from "@/components/notifications/PushPermissionButton";
import { NotificationSettingsForm } from "@/components/notifications/NotificationSettingsForm";
import { getNotificationSettings } from "@/lib/notifications/settings";
import { requireUser } from "@/lib/auth/rbac";

export const metadata = { title: "Notification settings — Gallebo" };

export default async function NotificationSettingsPage() {
  await requireUser();
  const { settings, error } = await getNotificationSettings();

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Notification settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control email, browser push, and in-app notifications.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <NotificationSettingsForm initial={settings!} />
      )}

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Browser push</h2>
        <p className="text-sm text-muted-foreground">
          Enable push on this device. You must allow notifications in your browser.
        </p>
        <PushPermissionButton />
      </section>
    </div>
  );
}
