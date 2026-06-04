import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getProfile, requireUser } from "@/lib/auth/rbac";

export async function RoleDashboardHeader() {
  const user = await requireUser();
  const profile = await getProfile();
  const role = profile?.role;

  if (
    role !== "pilot" &&
    role !== "passenger" &&
    role !== "admin" &&
    role !== "airfield_operator"
  ) {
    return null;
  }

  return (
    <div className="mb-6 flex justify-end">
      <NotificationBell userId={user.id} role={role} />
    </div>
  );
}
