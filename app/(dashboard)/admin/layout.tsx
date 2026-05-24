import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  const admin = createAdminClient();
  const { count: kycCount } = await admin
    .from("verification_requests")
    .select("id", { count: "exact", head: true })
    .is("reviewed_at", null);

  return (
    <div className="admin-shell">
      <AdminSidebar kycCount={kycCount ?? 0} />
      <main className="admin-main">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
