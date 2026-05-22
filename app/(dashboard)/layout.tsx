import { DashboardTopBar } from "@/components/layout/DashboardTopBar";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardTopBar
        links={[
          { href: "/dashboard", label: "Overview" },
          { href: "/onboarding", label: "Onboarding" },
          { href: "/dashboard/settings", label: "Settings" },
        ]}
      />
      {children}
    </div>
  );
}
