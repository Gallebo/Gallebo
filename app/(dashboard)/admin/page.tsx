import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Admin — Gallebo" };

export default async function AdminPage() {
  const admin = createAdminClient();

  const { data: passengerQueue } = await admin
    .from("verification_requests")
    .select("id, didit_status, created_at")
    .eq("requested_role", "passenger")
    .is("reviewed_at", null)
    .order("created_at", { ascending: false });

  const { data: pilotQueue } = await admin
    .from("verification_requests")
    .select("id, created_at")
    .eq("requested_role", "pilot")
    .is("reviewed_at", null)
    .order("created_at", { ascending: false });

  const { data: airfieldQueue } = await admin
    .from("airfield_operator_requests")
    .select("id, airfield_name, icao_code, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Verification queue</h1>

      <QueueSection
        title="Passengers"
        count={passengerQueue?.length ?? 0}
        items={passengerQueue?.map((item) => ({
          id: item.id,
          label: `Request ${item.id.slice(0, 8)}…`,
          meta: `Didit: ${item.didit_status ?? "pending"}`,
          href: `/admin/verifications/${item.id}`,
        }))}
      />

      <QueueSection
        title="Pilots"
        count={pilotQueue?.length ?? 0}
        items={pilotQueue?.map((item) => ({
          id: item.id,
          label: `Pilot ${item.id.slice(0, 8)}…`,
          href: `/admin/verifications/${item.id}`,
        }))}
      />

      <QueueSection
        title="Airfields"
        count={airfieldQueue?.length ?? 0}
        items={airfieldQueue?.map((item) => ({
          id: item.id,
          label: `${item.airfield_name} (${item.icao_code})`,
          href: `/admin/airfield/${item.id}`,
        }))}
      />
    </div>
  );
}

function QueueSection({
  title,
  count,
  items,
}: {
  title: string;
  count: number;
  items?: { id: string; label: string; meta?: string; href: string }[];
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">
        {title} <Badge variant="secondary">{count}</Badge>
      </h2>
      <div className="grid gap-3">
        {items?.length ? (
          items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="py-3">
                <CardTitle className="text-base">
                  <Link href={item.href} className="hover:underline">
                    {item.label}
                  </Link>
                </CardTitle>
              </CardHeader>
              {item.meta ? (
                <CardContent className="pb-3 text-sm text-muted-foreground">
                  {item.meta}
                </CardContent>
              ) : null}
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No pending items</p>
        )}
      </div>
    </section>
  );
}
