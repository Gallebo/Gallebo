import Link from "next/link";

import { requirePilot } from "@/lib/auth/rbac";

const links = [
  { href: "/pilot", label: "Overview" },
  { href: "/pilot/edit", label: "Personal info" },
  { href: "/pilot/documents", label: "Documents" },
  { href: "/pilot/iban", label: "IBAN" },
  { href: "/pilot/aircraft", label: "Aircraft" },
];

export default async function PilotDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePilot();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pilot hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your public profile, payout details, and aircraft.
        </p>
      </div>
      <nav className="flex flex-wrap gap-4 border-b pb-4 text-sm">
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
      {children}
    </div>
  );
}
