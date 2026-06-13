"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${request.user_id}`);
  return { success: "Approved" };
}

export async function rejectVerificationAction(
  requestId: string,
  reason: string
): Promise<AdminActionState> {
  const reasonSchema = z.string().min(10).max(500);
  const parsedReason = reasonSchema.safeParse(reason.trim());
  if (!parsedReason.success) {
    return { error: "Rejection reason must be between 10 and 500 characters." };
  }
  const safeReason = parsedReason.data;

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
      rejection_reason: safeReason,
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
    payload: { requestId, reason: safeReason },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${request.user_id}`);
  return { success: "Rejected" };
}

export async function approveAirfieldRequestAction(
  requestId: string,
  formData: FormData
): Promise<AdminActionState> {
  const { user: adminUser } = await requireAdmin();
  const admin = createAdminClient();

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
    .select("id, operator_user_id")
    .eq("icao_code", request.icao_code)
    .maybeSingle();

  if (
    existingAirfield?.operator_user_id &&
    existingAirfield.operator_user_id !== request.user_id
  ) {
    return {
      error: "An airfield with this ICAO code already has an assigned operator.",
    };
  }

  if (existingAirfield) {
    const { error: linkError } = await admin
      .from("airfields")
      .update({
        operator_user_id: request.user_id,
        contact_email: request.contact_email,
        contact_phone: request.contact_phone,
      })
      .eq("id", existingAirfield.id);

    if (linkError) return { error: linkError.message };
  } else {
    const parsed = approveAirfieldSchema.safeParse({
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
      country: formData.get("country"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid coordinates" };
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
  }

  const adminNotes = String(formData.get("adminNotes") ?? "").trim();

  await admin
    .from("airfield_operator_requests")
    .update({
      status: "approved",
      admin_notes: adminNotes.length > 0 ? adminNotes : null,
    })
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
  revalidatePath("/admin/airfield-requests");
  revalidatePath(`/admin/airfield/${requestId}`);
  revalidatePath("/map");
  return {
    success: existingAirfield
      ? "Airfield operator linked to existing airfield"
      : "Airfield operator approved",
  };
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
  revalidatePath("/admin/airfield-requests");
  revalidatePath(`/admin/airfield/${requestId}`);
  return { success: "Rejected" };
}

export async function suspendUserAction(userId: string): Promise<AdminActionState> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return { error: "User not found" };
  if (profile.role === "admin") {
    return { error: "Cannot suspend admin accounts" };
  }

  const { error } = await admin
    .from("profiles")
    .update({ status: "suspended" })
    .eq("id", userId);

  if (error) return { error: error.message };

  if (profile.role === "pilot") {
    await admin.from("notification_queue").insert({
      user_id: userId,
      type: "pilot_suspended",
      payload: {},
    });
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: "Account suspended" };
}

/** @deprecated Use suspendUserAction */
export async function suspendPilotAction(userId: string): Promise<AdminActionState> {
  return suspendUserAction(userId);
}

export async function unsuspendUserAction(userId: string): Promise<AdminActionState> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role, status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return { error: "User not found" };
  if (profile.role === "admin") {
    return { error: "Cannot modify admin accounts" };
  }
  if (profile.status !== "suspended") {
    return { error: "User is not suspended" };
  }

  const nextStatus = profile.role ? "verified" : "registered";

  const { error } = await admin
    .from("profiles")
    .update({ status: nextStatus })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: "Account unsuspended" };
}

export async function assignRoleAndVerifyUserAction(
  userId: string,
  role: "passenger" | "pilot",
): Promise<AdminActionState> {
  const { user: adminUser } = await requireAdmin();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return { error: "User not found" };
  if (profile.role === "admin") {
    return { error: "Cannot modify admin accounts" };
  }
  if (profile.role) {
    return { error: "User already has a role assigned" };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role, status: "verified" })
    .eq("id", userId);

  if (profileError) return { error: profileError.message };

  await admin
    .from("verification_requests")
    .update({
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .is("reviewed_at", null);

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: `Assigned ${role} and verified account` };
}

export async function adminDeleteUserAction(
  userId: string,
): Promise<AdminActionState> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return { error: "User not found" };
  if (profile.role === "admin") {
    return { error: "Cannot delete admin accounts" };
  }

  const { assertCanDeleteAccount, DeleteAccountBlockedError } = await import(
    "@/lib/auth/delete-account-guards"
  );

  try {
    await assertCanDeleteAccount(userId);
  } catch (e) {
    if (e instanceof DeleteAccountBlockedError) {
      return { error: e.message };
    }
    throw e;
  }

  const { data: pilotProfile } = await admin
    .from("pilot_profiles")
    .select("stripe_account_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (pilotProfile?.stripe_account_id) {
    const { deletePilotStripeAccount } = await import("@/lib/stripe/connect");
    try {
      await deletePilotStripeAccount(pilotProfile.stripe_account_id);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Stripe account could not be removed";
      return { error: `Account deletion failed: ${message}` };
    }
  }

  await admin.from("user_notification_settings").delete().eq("user_id", userId);

  const { error: profileDeleteError } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileDeleteError) {
    return { error: profileDeleteError.message };
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) return { error: authError.message };

  revalidatePath("/admin/users");
  return { success: "Account deleted" };
}
