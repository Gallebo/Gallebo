import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePilot } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";
import { averageRating } from "@/lib/pilot/review-stats";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pilot dashboard — Gallebo" };

export default async function PilotOverviewPage() {
  const { user } = await requirePilot();
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("pilot_reviews_public")
    .select("rating")
    .eq("pilot_user_id", user.id);

  const ratings =
    reviews
      ?.map((r) => r.rating)
      .filter((r): r is number => typeof r === "number") ?? [];

  const avgRating = averageRating(ratings);

  const { count: aircraftCount } = await supabase
    .from("aircraft")
    .select("id", { count: "exact", head: true })
    .eq("pilot_user_id", user.id);

  const { count: publishedFlights } = await supabase
    .from("flights")
    .select("id", { count: "exact", head: true })
    .eq("pilot_user_id", user.id)
    .eq("status", "published");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>
            Published flights and passenger bookings (earnings in a later phase).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Published flights</span>
            <span className="font-medium">{publishedFlights ?? 0}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Lifetime earnings</span>
            <span className="font-medium">—</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Average rating</span>
            <span className="font-medium">
              {avgRating !== null ? `${avgRating} / 5` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reviews</span>
            <span className="font-medium">{ratings.length}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
          <CardDescription>Keep your profile ready for passengers.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link
            href={`/pilots/${user.id}`}
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-fit")}
          >
            View public profile
          </Link>
          <Link
            href="/pilot/aircraft"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-fit")}
          >
            Manage aircraft ({aircraftCount ?? 0})
          </Link>
          <Link
            href="/pilot/flights"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-fit")}
          >
            My flights
          </Link>
          <Link
            href="/pilot/documents"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-fit")}
          >
            Documents &amp; renewals
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
