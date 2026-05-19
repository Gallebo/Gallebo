import Link from "next/link";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8 flex flex-wrap gap-4 border-b pb-4 text-sm">
        <Link href="/dashboard" className="font-medium text-primary">
          Overview
        </Link>
        <Link
          href="/onboarding"
          className="text-muted-foreground hover:text-foreground"
        >
          Onboarding
        </Link>
        <Link
          href="/dashboard/settings"
          className="text-muted-foreground hover:text-foreground"
        >
          Settings
        </Link>
      </nav>
      {children}
    </div>
  );
}
