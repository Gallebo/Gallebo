import { DashboardShellGate } from "@/components/layout/dashboard-shell-gate";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";

const PASSENGER_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShellGate topBar={<DashboardTopBar links={PASSENGER_LINKS} />}>
      {children}
    </DashboardShellGate>
  );
}
