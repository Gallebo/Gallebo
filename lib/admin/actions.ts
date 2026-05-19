"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types/profile";

export type AdminActionState = { error?: string; success?: string };

export async function approveVerificationAction(
  requestId: string,
  role: UserRole
): Promise<AdminActionState> {
  const { user: adminUser } = await requireAdmin();
  const admin = createAdminClient();

  const { data: request, error: fetchError } = await admin
    .from("verification_requests")
    .select("user_id, requested_role")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { error: fetchError?.message ?? "Request not found" };
  }

  const assignRole = role === "admin" ? request.requested_role : role;

  const { error: profileError } = await admin
    .from("profiles")
    .update({ status: "verified", role: assignRole })
    .eq("id", request.user_id);

  if (profileError) return { error: profileError.message };

  const { error: vrError } = await admin
    .from("verification_requests")
    .update({
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (vrError) return { error: vrError.message };

  await admin.from("notification_queue").insert({
    user_id: request.user_id,
    type: "verification_approved",
    payload: { requestId, role: assignRole },
  });

  revalidatePath("/admin");
  return { success: "Approved" };
}

export async function rejectVerificationAction(
  requestId: string,
  reason: string
): Promise<AdminActionState> {
  const { user: adminUser } = await requireAdmin();
  const admin = createAdminClient();

  const { data: request, error: fetchError } = await admin
    .from("verification_requests")
    .select("user_id")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { error: fetchError?.message ?? "Request not found" };
  }

  const { error: vrError } = await admin
    .from("verification_requests")
    .update({
      rejection_reason: reason,
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (vrError) return { error: vrError.message };

  await admin
    .from("profiles")
    .update({ status: "registered" })
    .eq("id", request.user_id);

  await admin.from("notification_queue").insert({
    user_id: request.user_id,
    type: "verification_rejected",
    payload: { requestId, reason },
  });

  revalidatePath("/admin");
  return { success: "Rejected" };
}

export async function approveAirfieldRequestAction(
  requestId: string
): Promise<AdminActionState> {
  const { user: adminUser } = await requireAdmin();
  const admin = createAdminClient();

  const { data: request, error: fetchError } = await admin
    .from("airfield_operator_requests")
    .select("user_id")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { error: fetchError?.message ?? "Request not found" };
  }

  await admin
    .from("airfield_operator_requests")
    .update({ status: "approved" })
    .eq("id", requestId);

  await admin
    .from("profiles")
    .update({ status: "verified", role: "airfield_operator" })
    .eq("id", request.user_id);

  await admin.from("notification_queue").insert({
    user_id: request.user_id,
    type: "airfield_approved",
    payload: { requestId, reviewedBy: adminUser.id },
  });

  revalidatePath("/admin");
  return { success: "Airfield operator approved" };
}

export async function rejectAirfieldRequestAction(
  requestId: string,
  reason: string
): Promise<AdminActionState> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("airfield_operator_requests")
    .select("user_id")
    .eq("id", requestId)
    .single();

  if (!request) return { error: "Request not found" };

  await admin
    .from("airfield_operator_requests")
    .update({ status: "rejected", admin_notes: reason })
    .eq("id", requestId);

  await admin
    .from("profiles")
    .update({ status: "registered" })
    .eq("id", request.user_id);

  revalidatePath("/admin");
  return { success: "Rejected" };
}

export async function suspendPilotAction(userId: string): Promise<AdminActionState> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ status: "suspended" })
    .eq("id", userId);

  if (error) return { error: error.message };

  await admin.from("notification_queue").insert({
    user_id: userId,
    type: "pilot_suspended",
    payload: {},
  });

  revalidatePath("/admin/pilots");
  return { success: "Pilot suspended" };
}
