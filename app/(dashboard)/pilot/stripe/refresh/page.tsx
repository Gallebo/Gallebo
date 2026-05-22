import { redirect } from "next/navigation";

import { requirePilot } from "@/lib/auth/rbac";
import { createPilotConnectAccount, createOnboardingLink } from "@/lib/stripe/connect";
import { createClient } from "@/lib/supabase/server";

export default async function StripeRefreshPage() {
  const { user } = await requirePilot();
  const supabase = await createClient();

  const { data: pilot } = await supabase
    .from("pilot_profiles")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .single();

  let stripeAccountId = pilot?.stripe_account_id ?? null;

  if (!stripeAccountId) {
    const account = await createPilotConnectAccount(user.id, user.email ?? "");
    stripeAccountId = account.id;
  }

  const link = await createOnboardingLink(stripeAccountId);
  redirect(link.url);
}
