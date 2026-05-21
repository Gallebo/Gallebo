import { PublishFlightWizard } from "@/components/flights/publish-wizard";
import { requirePilot } from "@/lib/auth/rbac";
import type { FlightDraft } from "@/lib/flights/schemas";
import { createClient } from "@/lib/supabase/server";
export const metadata = { title: "Publish flight — Gallebo" };

export default async function PublishFlightPage() {
  const { user } = await requirePilot();
  const supabase = await createClient();

  const { data: draftRow } = await supabase
    .from("flight_publish_drafts")
    .select("step, draft")
    .eq("pilot_user_id", user.id)
    .maybeSingle();

  const { data: aircraftList } = await supabase
    .from("aircraft")
    .select("id, model, registration, seats")
    .eq("pilot_user_id", user.id)
    .order("model");

  const initialDraft = (draftRow?.draft as FlightDraft | null) ?? {};
  const initialStep = draftRow?.step ?? 1;

  return (
    <PublishFlightWizard
      initialStep={initialStep}
      initialDraft={initialDraft}
      aircraftList={aircraftList ?? []}
    />
  );
}
