import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileCard } from "@/components/dashboard/profile-card";
import { RegisteredWelcome } from "@/components/dashboard/registered-welcome";
import { StatusBanner } from "@/components/dashboard/status-banner";
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
    return <DashboardProfileSkeleton />;
  }

  if (profile.status === "suspended") {
    if (profile.role === "pilot") redirect("/onboarding/pilot");
    if (profile.role === "passenger") redirect("/onboarding/passenger");
    if (profile.role === "airfield_operator") redirect("/suspended");
  }

  if (profile.status === "verified" && profile.role === "admin") {
    redirect("/admin");
  }

  if (profile.status === "verified" && profile.role === "pilot") {
    redirect("/pilot");
  }

  if (profile.status === "verified" && profile.role === "passenger") {
    redirect("/passenger");
  }

  if (profile.status === "verified" && profile.role === "airfield_operator") {
    return (
      <div className="space-y-6">
        <StatusBanner status="verified" />
        <ProfileCard profile={profile} email={authUser?.email ?? ""} />
        <p className="text-muted-foreground">
          Manage your airfield profile, photos, notices, and events.
        </p>
        <Link
          href="/airfield"
          className={cn(buttonVariants({ variant: "default" }), "inline-flex")}
        >
          Open airfield dashboard
        </Link>
      </div>
    );
  }

  if (profile.status === "registered") {
    return (
      <RegisteredWelcome profile={profile} email={authUser?.email ?? ""} />
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <StatusBanner status={profile.status} />
      <ProfileCard profile={profile} email={authUser?.email ?? ""} />

      {profile.status === "pending" ? (
        <p className="text-sm text-muted-foreground">
          Your verification is in progress. No action needed right now.
        </p>
      ) : null}

    </div>
  );
}

function DashboardProfileSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading profile">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-24 animate-pulse rounded-xl border bg-muted/60" />
      <div className="h-36 animate-pulse rounded-xl border bg-muted/40" />
    </div>
  );
}
