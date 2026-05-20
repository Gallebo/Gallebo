import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { UserRole, UserStatus } from "@/lib/types/profile";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const profile = await getProfile();
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }
  return { user, profile };
}

export async function requireStatus(status: UserStatus) {
  const user = await requireUser();
  const profile = await getProfile();
  if (profile?.status !== status) {
    redirect("/dashboard");
  }
  return { user, profile };
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();
  const profile = await getProfile();
  if (profile?.role !== role) {
    redirect("/dashboard");
  }
  return { user, profile };
}

export async function requireAirfieldOperator() {
  const user = await requireUser();
  const profile = await getProfile();
  if (
    profile?.role !== "airfield_operator" ||
    profile?.status !== "verified"
  ) {
    redirect("/dashboard");
  }
  return { user, profile };
}

export async function requirePilot() {
  const user = await requireUser();
  const profile = await getProfile();
  if (profile?.role !== "pilot" || profile?.status !== "verified") {
    redirect("/dashboard");
  }
  return { user, profile };
}

export async function getOperatorAirfieldForUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("airfields")
    .select("*")
    .eq("operator_user_id", userId)
    .maybeSingle();
  return data;
}
