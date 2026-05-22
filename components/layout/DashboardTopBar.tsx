import Link from "next/link";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { requireUser, getProfile } from "@/lib/auth/rbac";

export async function DashboardTopBar({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const user = await requireUser();
  const profile = await getProfile();
  const role = profile?.role ?? "passenger";

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
      <nav className="flex flex-wrap gap-4 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-muted-foreground hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <NotificationBell userId={user.id} role={role} />
    </div>
  );
}
