import { RoleDashboardHeader } from "@/components/layout/role-dashboard-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getKycPendingCount } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  const admin = createAdminClient();
  const [kycCount, { count: airfieldRequestsCount }] = await Promise.all([
    getKycPendingCount(),
    admin
      .from("airfield_operator_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return (
    <div className="admin-shell">
      <AdminSidebar
        kycCount={kycCount}
        airfieldRequestsCount={airfieldRequestsCount ?? 0}
      />
      <main className="admin-main">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
          <RoleDashboardHeader />
          {children}
        </div>
      </main>
    </div>
  );
}
