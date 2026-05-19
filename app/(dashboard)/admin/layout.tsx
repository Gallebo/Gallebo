import Link from "next/link";

import { requireAdmin } from "@/lib/auth/rbac";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-8 flex gap-4 border-b pb-4 text-sm">
        <Link href="/admin" className="font-medium text-primary">
          Queue
        </Link>
        <Link
          href="/admin/pilots"
          className="text-muted-foreground hover:text-foreground"
        >
          Pilots
        </Link>
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground"
        >
          Dashboard
        </Link>
      </nav>
      {children}
    </div>
  );
}
