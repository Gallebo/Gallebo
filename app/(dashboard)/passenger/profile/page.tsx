import Link from "next/link";

import { NotificationSettingsForm } from "@/components/notifications/NotificationSettingsForm";
import { PushPermissionButton } from "@/components/notifications/PushPermissionButton";
import { PilotPageHeader } from "@/components/pilot/pilot-page-header";
import { requireVerifiedPassenger } from "@/lib/auth/rbac";
import { getNotificationSettings } from "@/lib/notifications/settings";
import { getPassengerProfileData } from "@/lib/passenger/queries";

export const metadata = { title: "My profile — Gallebo" };

function VerifiedRow({ label, verified }: { label: string; verified: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b py-3 last:border-0"
      style={{ borderColor: "var(--line)" }}
    >
      <span className="text-[14px]" style={{ color: "var(--ink)" }}>
        {label}
      </span>
      <span
        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
        style={{
          color: verified ? "var(--success)" : "var(--ink-3)",
          border: `1px solid ${verified ? "var(--success)" : "var(--line)"}`,
        }}
      >
        {verified ? "Verified" : "Pending"}
      </span>
    </div>
  );
}

export default async function PassengerProfilePage() {
  const { user } = await requireVerifiedPassenger();
  const profile = await getPassengerProfileData(user.id);
  const { settings, error } = await getNotificationSettings();
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div>
      <PilotPageHeader
        eyebrow="Profile"
        title="My profile"
        description="Your identity, verification status, and preferences."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
          >
            <p
              className="mb-4 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--ink-3)" }}
            >
              Identity
            </p>
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex size-11 items-center justify-center rounded-full text-[13px] font-bold text-white"
                style={{ background: "var(--primary-v2)" }}
              >
                {(profile.firstName[0] ?? "") + (profile.lastName[0] ?? "") || "P"}
              </span>
              <div>
                <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  {fullName || "Passenger"}
                </p>
                <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                  {profile.email}
                </p>
              </div>
            </div>
            <VerifiedRow label="Government ID" verified={profile.idVerified} />
            <VerifiedRow label="Email address" verified={profile.emailVerified} />
            <VerifiedRow label="Phone number" verified={profile.phoneVerified} />
          </div>
          <Link
            href="/onboarding/passenger"
            className="mt-4 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[14px] font-semibold no-underline transition-colors hover:bg-[var(--surface-alt)]"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            Edit profile
          </Link>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          <p
            className="mb-4 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--ink-3)" }}
          >
            Preferences
          </p>
          <div className="space-y-0">
            {[
              ["Language", "English"],
              ["Currency", "EUR (€)"],
              ["Notifications", profile.notificationsLabel],
              ["Seat preference", "No preference"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 border-b py-3 last:border-0"
                style={{ borderColor: "var(--line)" }}
              >
                <span className="text-[14px]" style={{ color: "var(--ink-3)" }}>
                  {label}
                </span>
                <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section
        className="mt-8 rounded-xl border p-6"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <h2 className="mb-1 text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
          Notification settings
        </h2>
        <p className="mb-4 text-[13px]" style={{ color: "var(--ink-3)" }}>
          Control email, browser push, and in-app notifications.
        </p>
        {error ? (
          <p className="text-[13px]" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        ) : settings ? (
          <NotificationSettingsForm initial={settings} />
        ) : null}
        <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          <p className="mb-2 text-[13px] font-medium" style={{ color: "var(--ink)" }}>
            Browser push
          </p>
          <PushPermissionButton />
        </div>
      </section>
    </div>
  );
}
