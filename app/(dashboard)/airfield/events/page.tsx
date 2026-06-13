import { AirfieldEventsManager } from "@/components/airfield/airfield-events-manager";
import {
  getOperatorAirfieldForUser,
  requireAirfieldOperator,
} from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Airfield events — Gallebo" };

export default async function AirfieldEventsPage() {
  const { user } = await requireAirfieldOperator();
  const airfield = await getOperatorAirfieldForUser(user.id);

  if (!airfield) {
    return (
      <p className="text-muted-foreground">
        No airfield is linked to your account.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("airfield_events")
    .select("id, title, description, event_date, link")
    .eq("airfield_id", airfield.id)
    .order("event_date", { ascending: true });

  return <AirfieldEventsManager events={events ?? []} />;
}
