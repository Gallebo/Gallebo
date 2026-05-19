import Link from "next/link";
import { Building2, Plane, Users } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const roles = [
  { href: "/onboarding/passenger", icon: Users, title: "Passenger", description: "Verify with Didit KYC and ID upload." },
  { href: "/onboarding/pilot", icon: Plane, title: "Pilot", description: "PPL, medical certificate, and payout details." },
  { href: "/onboarding/airfield", icon: Building2, title: "Airfield operator", description: "Operating license and airfield details." },
];

export function RolePicker() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {roles.map((r) => (
        <Link key={r.href} href={r.href}>
          <Card className="h-full hover:border-primary/50">
            <CardHeader>
              <r.icon className="size-7 text-primary" />
              <CardTitle>{r.title}</CardTitle>
              <CardDescription>{r.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
