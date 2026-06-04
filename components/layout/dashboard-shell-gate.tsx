"use client";

import { usePathname } from "next/navigation";

export function DashboardShellGate({
  children,
  topBar,
}: {
  children: React.ReactNode;
  topBar: React.ReactNode;
}) {
  const pathname = usePathname();
  // Role dashboards use their own sidebar layouts; notifications live in
  // RoleDashboardHeader inside pilot/passenger/admin layouts (not this top bar).
  const fullBleed =
    pathname?.startsWith("/pilot") ||
    pathname?.startsWith("/passenger") ||
    pathname?.startsWith("/admin");

  if (fullBleed) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {topBar}
      {children}
    </div>
  );
}
