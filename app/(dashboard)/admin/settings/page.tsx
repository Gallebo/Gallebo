import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAdminPlatformSettings } from "@/lib/admin/platform-settings";

export const metadata = { title: "Settings — Admin — Gallebo" };

export default function AdminSettingsPage() {
  const settings = getAdminPlatformSettings();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Platform configuration and operational parameters."
      />

      <div className="space-y-3">
        {settings.map((item) => (
          <div
            key={item.key}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                {item.label}
              </p>
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
                {item.description}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium"
                style={{
                  background: "var(--primary-soft)",
                  color: "var(--primary-v2)",
                }}
              >
                {item.value}
              </span>
              <span
                className="text-[13px] font-medium"
                style={{ color: "var(--ink-3)" }}
              >
                Edit
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
