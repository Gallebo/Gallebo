import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  getOperatorAirfieldForUser,
  requireAirfieldOperator,
} from "@/lib/auth/rbac";
import { formatServiceLabels } from "@/lib/airfield/utils";
import { cn } from "@/lib/utils";

export const metadata = { title: "Airfield — Gallebo" };

export default async function AirfieldDashboardPage() {
  const { user } = await requireAirfieldOperator();
  const airfield = await getOperatorAirfieldForUser(user.id);

  if (!airfield) {
    return (
      <p className="text-muted-foreground">
        No airfield is linked to your account yet. Contact an administrator.
      </p>
    );
  }

  const services = formatServiceLabels(airfield);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {airfield.name}
            <Badge variant="secondary">{airfield.icao_code}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{airfield.country}</p>
          {services.length > 0 ? <p>{services.join(" · ")}</p> : null}
          <p>
            Coordinates: {airfield.latitude}, {airfield.longitude}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/airfields/${airfield.icao_code}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          View public profile
        </Link>
        <Link
          href="/airfield/edit"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Edit profile
        </Link>
      </div>
    </div>
  );
}
