import { PilotIbanForm } from "@/components/pilot/pilot-iban-form";
import { getPilotIbanLastFour } from "@/lib/pilot/actions";
import { requirePilot } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pilot IBAN — Gallebo" };

export default async function PilotIbanPage() {
  await requirePilot();

  const { lastFour, error } = await getPilotIbanLastFour();

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let accountHolder = "";
  if (authUser) {
    const { data: pilot } = await supabase
      .from("pilot_profiles")
      .select("account_holder_name")
      .eq("user_id", authUser.id)
      .maybeSingle();
    accountHolder = pilot?.account_holder_name ?? "";
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">IBAN</h2>
        <p className="text-sm text-muted-foreground">
          Stored encrypted in Supabase Vault. Only the last four characters are displayed.
        </p>
      </div>

      <div className="rounded-lg border p-4 text-sm">
        <p className="text-muted-foreground">Current IBAN suffix</p>
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : lastFour ? (
          <p className="font-mono text-lg tracking-widest">
            **** **** **** {lastFour}
          </p>
        ) : (
          <p>No IBAN saved yet.</p>
        )}
      </div>

      <PilotIbanForm defaultHolderName={accountHolder} />
    </div>
  );
}
