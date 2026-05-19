import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileCard } from "@/components/dashboard/profile-card";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { VerificationCta } from "@/components/dashboard/verification-cta";
import { requireUser, getProfile } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard — Gallebo" };

export default async function DashboardPage() {
  await requireUser();
  const profile = await getProfile();
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!profile) {
    return <p className="text-muted-foreground">Loading profile…</p>;
  }

  if (profile.status === "verified" && profile.role === "admin") {
    redirect("/admin");
  }

  if (profile.status === "verified" && profile.role === "passenger") {
    return (
      <div className="space-y-6">
        <StatusBanner status="verified" />
        <ProfileCard profile={profile} email={authUser?.email ?? ""} />
        <p className="text-muted-foreground">
          Flight search — coming in Phase 4.{" "}
          <Link href="/" className="text-primary hover:underline">
            Browse destinations
          </Link>
        </p>
      </div>
    );
  }

  if (profile.status === "verified" && profile.role === "pilot") {
    return (
      <div className="space-y-6">
        <StatusBanner status="verified" />
        <ProfileCard profile={profile} email={authUser?.email ?? ""} />
        <p className="text-muted-foreground">
          Pilot home — coming in a later phase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <StatusBanner status={profile.status} />
      <ProfileCard profile={profile} email={authUser?.email ?? ""} />

      {profile.status === "registered" ? <VerificationCta /> : null}

      {profile.status === "pending" ? (
        <p className="text-sm text-muted-foreground">
          Your verification is in progress. No action needed right now.
        </p>
      ) : null}

      {profile.status === "suspended" ? (
        <Link
          href="/onboarding/pilot"
          className={cn(buttonVariants({ variant: "default" }), "inline-flex")}
        >
          Upload new pilot documents
        </Link>
      ) : null}
    </div>
  );
}
