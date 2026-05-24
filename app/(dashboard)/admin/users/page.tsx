import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { getAdminUsers } from "@/lib/admin/queries";

export const metadata = { title: "Users — Admin — Gallebo" };

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="User management"
        title="Users"
        description={`${users.length.toLocaleString()} registered users — pilots, passengers, and pending KYC.`}
      />

      <AdminUsersTable users={users} />
    </div>
  );
}
