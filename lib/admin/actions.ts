"use server";

import { revalidatePath } from "next/cache";

import { approveAirfieldSchema } from "@/lib/airfield/schemas";
import { requireAdmin } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminActionState = { error?: string; success?: string };

export async function approveVerificationAction(
  requestId: string
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

  const assignRole = request.requested_role;

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
  requestId: string,
  formData: FormData
): Promise<AdminActionState> {
  const { user: adminUser } = await requireAdmin();
  const admin = createAdminClient();

  const parsed = approveAirfieldSchema.safeParse({
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    country: formData.get("country"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid coordinates" };
  }

  const { data: request, error: fetchError } = await admin
    .from("airfield_operator_requests")
    .select("user_id, airfield_name, icao_code, contact_email, contact_phone")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { error: fetchError?.message ?? "Request not found" };
  }

  const { data: existingAirfield } = await admin
    .from("airfields")
    .select("id")
    .eq("icao_code", request.icao_code)
    .maybeSingle();

  if (existingAirfield) {
    return { error: "An airfield with this ICAO code already exists" };
  }

  const { error: airfieldError } = await admin.from("airfields").insert({
    name: request.airfield_name,
    icao_code: request.icao_code,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    country: parsed.data.country,
    contact_email: request.contact_email,
    contact_phone: request.contact_phone,
    operator_user_id: request.user_id,
    status: "active",
  });

  if (airfieldError) {
    return { error: airfieldError.message };
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
  revalidatePath("/map");
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

  await admin.from("notification_queue").insert({
    user_id: request.user_id,
    type: "airfield_rejected",
    payload: { requestId, reason },
  });

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
