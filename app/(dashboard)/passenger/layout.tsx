import { PassengerSidebar } from "@/components/passenger/passenger-sidebar";
import { requireVerifiedPassenger } from "@/lib/auth/rbac";
import { getPassengerSidebarContext } from "@/lib/passenger/queries";

export default async function PassengerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireVerifiedPassenger();
  const sidebar = await getPassengerSidebarContext(user.id);

  return (
    <div
      className="flex min-h-0 w-full flex-1"
      style={{ background: "var(--bg)" }}
    >
      <PassengerSidebar context={sidebar} />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
