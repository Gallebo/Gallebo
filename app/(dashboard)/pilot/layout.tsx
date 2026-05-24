import { PilotSidebar } from "@/components/pilot/pilot-sidebar";
import { requirePilot } from "@/lib/auth/rbac";
import { getPilotSidebarContext } from "@/lib/pilot/queries";

export default async function PilotDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requirePilot();
  const sidebar = await getPilotSidebarContext(user.id);

  return (
    <div
      className="flex min-h-0 w-full flex-1"
      style={{ background: "var(--bg)" }}
    >
      <PilotSidebar context={sidebar} />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
