import Link from "next/link";
import { Building2, Plane, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const roles = [
  {
    href: "/onboarding/passenger",
    icon: Users,
    title: "Passenger",
    description: "Book shared flights with verified pilots across Europe.",
  },
  {
    href: "/onboarding/pilot",
    icon: Plane,
    title: "Pilot",
    description: "Share flight costs and publish your available seats.",
  },
  {
    href: "/onboarding/airfield",
    icon: Building2,
    title: "Airfield operator",
    description: "Manage your airfield and operational approvals.",
  },
];

export function VerificationCta() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {roles.map((role) => (
        <Link key={role.href} href={role.href} className="group block">
          <Card className="h-full transition-shadow group-hover:shadow-md">
            <CardHeader>
              <role.icon className="size-8 text-primary" aria-hidden />
              <CardTitle className="text-lg">{role.title}</CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-sm font-medium text-primary">Get verified →</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
