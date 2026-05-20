import Link from "next/link";

const links = [
  { href: "/airfield", label: "Overview" },
  { href: "/airfield/edit", label: "Edit profile" },
  { href: "/airfield/photos", label: "Photos" },
  { href: "/airfield/notices", label: "Notices" },
  { href: "/airfield/events", label: "Events" },
];

export default function AirfieldDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Airfield management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your airfield profile, photos, notices, and events.
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
