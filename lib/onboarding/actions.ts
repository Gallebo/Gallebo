"use server";

import { redirect } from "next/navigation";

import { getProfile, requireUser } from "@/lib/auth/rbac";
import {
  assertPassengerIdentityVerified,
  hasPendingUpgradeRequest,
  isDiditApprovedStatus,
} from "@/lib/onboarding/guards";
import { airfieldRequestSchema, personalInfoSchema, pilotDocumentSchema } from "@/lib/auth/schemas";
import { phoneToDbValue } from "@/lib/crypto/phone";
import { weightToDbValue } from "@/lib/crypto/weight";
import { uploadDocumentAction } from "@/lib/documents/upload";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type ActionState = {
  error?: string;
  success?: string;
  draft?: Record<string, unknown>;
};

export async function savePassengerProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = personalInfoSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
    phone: formData.get("phone"),
    weightKg: formData.get("weightKg"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      date_of_birth: parsed.data.dateOfBirth,
      phone_encrypted: phoneToDbValue(parsed.data.phone),
      weight_encrypted: weightToDbValue(parsed.data.weightKg),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: "Profile saved" };
}

function isDiditApproved(status: string | null | undefined): boolean {
  return isDiditApprovedStatus(status);
}

export async function checkPilotUpgradeIdentityAction(): Promise<ActionState> {
  const user = await requireUser();
  const profile = await getProfile();
  if (profile?.role !== "passenger" || profile.status !== "verified") {
    return { error: "Only verified passengers can upgrade to pilot." };
  }
  const supabase = await createClient();
  const identity = await assertPassengerIdentityVerified(supabase, user.id);
  if (identity.error) return { error: identity.error };
  return { success: "ok" };
}

export async function prepareDiditVerificationAction(
  requestedRole: "passenger" | "pilot" = "passenger"
): Promise<ActionState> {
  const user = await requireUser();
  const profile = await getProfile();
  const supabase = await createClient();

  if (requestedRole === "pilot") {
    if (profile?.role !== "pilot") {
      return {
        error:
          "Pilot identity verification is only available for suspended pilots re-onboarding.",
      };
    }

    const { data: existingPilot } = await supabase
      .from("verification_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("requested_role", "pilot")
      .is("reviewed_at", null)
      .maybeSingle();

    if (!existingPilot) {
      const { error: vrError } = await supabase.from("verification_requests").insert({
        user_id: user.id,
        requested_role: "pilot",
      });
      if (vrError) {
        if (vrError.code === "23505") {
          return { error: "Zahtjev za verifikaciju već postoji." };
        }
        return { error: vrError.message };
      }
    }

    const { data: pilotRow } = await supabase
      .from("pilot_profiles")
      .select("onboarding_step, onboarding_draft")
      .eq("user_id", user.id)
      .maybeSingle();

    const storedDraft = pilotDraftFromJson(pilotRow?.onboarding_draft);
    const step = Math.max(pilotRow?.onboarding_step ?? 2, 2);
    const { error: pilotError } = await supabase.from("pilot_profiles").upsert({
      user_id: user.id,
      onboarding_step: step,
      onboarding_draft: storedDraft as Json,
    });
    if (pilotError) return { error: pilotError.message };

    return { success: "Ready for Didit" };
  }

  const { data: existing } = await supabase
    .from("verification_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("requested_role", "passenger")
    .is("reviewed_at", null)
    .maybeSingle();

  if (!existing) {
    const { error: vrError } = await supabase.from("verification_requests").insert({
      user_id: user.id,
      requested_role: "passenger",
    });
    if (vrError) {
      if (vrError.code === "23505") {
        return { error: "Zahtjev za verifikaciju već postoji." };
      }
      return { error: vrError.message };
    }
  }

  const { error: statusError } = await supabase
    .from("profiles")
    .update({ status: "pending", role: "passenger" })
    .eq("id", user.id);
  if (statusError) return { error: statusError.message };

  return { success: "Ready for Didit" };
}

export async function getDiditVerificationStatusAction(): Promise<
  ActionState & { diditStatus?: string | null; approved?: boolean }
> {
  const user = await requireUser();
  const supabase = await createClient();

  const profile = await getProfile();
  const roleFilter = profile?.role === "pilot" ? "pilot" : "passenger";

  const { data: vr, error } = await supabase
    .from("verification_requests")
    .select("didit_status, requested_role")
    .eq("user_id", user.id)
    .eq("requested_role", roleFilter)
    .is("reviewed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { error: error.message };

  const approved = isDiditApproved(vr?.didit_status);

  if (vr?.requested_role === "pilot" && approved) {
    const { data: pilotProfile } = await supabase
      .from("pilot_profiles")
      .select("onboarding_draft")
      .eq("user_id", user.id)
      .maybeSingle();
    const draft = pilotDraftFromJson(pilotProfile?.onboarding_draft);
    if (!draft.diditKycApproved) {
      await supabase.from("pilot_profiles").upsert({
        user_id: user.id,
        onboarding_step: 3,
        onboarding_draft: { ...draft, diditKycApproved: true } as Json,
      });
    }
  }

  return {
    diditStatus: vr?.didit_status ?? null,
    approved,
  };
}

export async function submitPassengerVerificationAction(
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const profileResult = await savePassengerProfileAction({}, formData);
  if (profileResult.error) return profileResult;

  const upload = await uploadDocumentAction(formData);
  if (upload.error) return { error: upload.error };

  const supabase = await createClient();

  const { error: vrError } = await supabase.from("verification_requests").insert({
    user_id: user.id,
    requested_role: "passenger",
  });

  if (vrError) {
    if (vrError.code === "23505") {
      return { error: "Zahtjev za verifikaciju već postoji. Pričekaj admin odobrenje." };
    }
    return { error: vrError.message };
  }

  const { error: statusError } = await supabase
    .from("profiles")
    .update({ status: "pending" })
    .eq("id", user.id);

  if (statusError) return { error: statusError.message };

  return { success: "Submitted" };
}

export async function savePilotDraftAction(
  step: number,
  draft: Record<string, unknown>
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("pilot_profiles").upsert({
    user_id: user.id,
    onboarding_step: step,
    onboarding_draft: draft as Json,
  });

  if (error) return { error: error.message };
  return { success: "Draft saved", draft };
}

const PILOT_DOC_TYPES = ["ppl_license", "lapl_license", "medical_certificate"] as const;

async function mergePilotDraftWithStored(
  userId: string,
  incoming: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pilot_profiles")
    .select("onboarding_draft")
    .eq("user_id", userId)
    .maybeSingle();
  const stored = pilotDraftFromJson(data?.onboarding_draft);
  return { ...stored, ...incoming };
}

export async function savePilotLicenseDraftStepAction(
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const profile = await getProfile();
  const supabase = await createClient();

  if (profile?.role === "passenger" && profile.status === "verified") {
    const identity = await assertPassengerIdentityVerified(supabase, user.id);
    if (identity.error) return { error: identity.error };
  }

  const draft = pilotDraftFromFormData(formData);
  const licenseExpiresAt = String(
    formData.get("licenseExpiresAt") ?? draft.licenseExpiresAt ?? ""
  );
  const licenseType =
    formData.get("licenseType") === "lapl_license" ? "lapl_license" : "ppl_license";

  const dateParsed = pilotDocumentSchema.shape.licenseExpiresAt.safeParse(
    licenseExpiresAt
  );
  if (!dateParsed.success) {
    return { error: dateParsed.error.issues[0]?.message ?? "Invalid licence expiry date" };
  }

  const file = formData.get("file");
  let licenseStoragePath = String(draft.licenseStoragePath ?? "");
  let licenseDocumentId = String(draft.licenseDocumentId ?? "");

  if (file instanceof File && file.size > 0) {
    const uploadFd = new FormData();
    uploadFd.set("file", file);
    uploadFd.set("type", licenseType);
    uploadFd.set("expiresAt", licenseExpiresAt);
    const upload = await uploadDocumentAction(uploadFd);
    if (upload.error) return { error: upload.error };
    licenseStoragePath = upload.storagePath ?? "";
    licenseDocumentId = upload.documentId ?? "";
  }

  if (!licenseStoragePath) {
    return { error: "Please select your licence file." };
  }

  const owned = await userOwnsDocumentStoragePath(user.id, licenseStoragePath);
  if (!owned) return { error: "Licence document not found." };

  const nextDraft = await mergePilotDraftWithStored(user.id, {
    ...draft,
    licenseExpiresAt,
    licenseType,
    licenseStoragePath,
    licenseDocumentId,
  });

  return savePilotDraftAction(4, nextDraft);
}

export async function savePilotMedicalDraftStepAction(
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const profile = await getProfile();
  const supabase = await createClient();

  if (profile?.role === "passenger" && profile.status === "verified") {
    const identity = await assertPassengerIdentityVerified(supabase, user.id);
    if (identity.error) return { error: identity.error };
  }

  const draft = pilotDraftFromFormData(formData);
  const medicalExpiresAt = String(
    formData.get("medicalExpiresAt") ?? draft.medicalExpiresAt ?? ""
  );

  const dateParsed = pilotDocumentSchema.shape.medicalExpiresAt.safeParse(
    medicalExpiresAt
  );
  if (!dateParsed.success) {
    return {
      error: dateParsed.error.issues[0]?.message ?? "Invalid medical expiry date",
    };
  }

  const file = formData.get("file");
  let medicalStoragePath = String(draft.medicalStoragePath ?? "");
  let medicalDocumentId = String(draft.medicalDocumentId ?? "");

  if (file instanceof File && file.size > 0) {
    const uploadFd = new FormData();
    uploadFd.set("file", file);
    uploadFd.set("type", "medical_certificate");
    uploadFd.set("expiresAt", medicalExpiresAt);
    const upload = await uploadDocumentAction(uploadFd);
    if (upload.error) return { error: upload.error };
    medicalStoragePath = upload.storagePath ?? "";
    medicalDocumentId = upload.documentId ?? "";
  }

  if (!medicalStoragePath) {
    return { error: "Please select your medical certificate file." };
  }

  const owned = await userOwnsDocumentStoragePath(user.id, medicalStoragePath);
  if (!owned) return { error: "Medical document not found." };

  const nextDraft = await mergePilotDraftWithStored(user.id, {
    ...draft,
    medicalExpiresAt,
    medicalStoragePath,
    medicalDocumentId,
  });

  return savePilotDraftAction(5, nextDraft);
}

export async function submitPilotVerificationAction(
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const profileResult = await savePassengerProfileAction({}, formData);
  if (profileResult.error) return profileResult;

  const docDatesParsed = pilotDocumentSchema.safeParse({
    licenseExpiresAt: formData.get("licenseExpiresAt"),
    medicalExpiresAt: formData.get("medicalExpiresAt"),
  });
  if (!docDatesParsed.success) {
    return { error: docDatesParsed.error.issues[0]?.message ?? "Invalid document dates" };
  }

  const licenseType =
    formData.get("licenseType") === "lapl_license" ? "lapl_license" : "ppl_license";
  let licenseStoragePath = String(formData.get("licenseStoragePath") ?? "");
  let medicalStoragePath = String(formData.get("medicalStoragePath") ?? "");

  const licenseFile = formData.get("licenseFile");
  if (licenseFile instanceof File && licenseFile.size > 0) {
    const upload = await uploadDocumentAction(
      buildUploadFormData(formData, "licenseFile", licenseType, "licenseExpiresAt")
    );
    if (upload.error) return { error: upload.error };
    licenseStoragePath = upload.storagePath ?? "";
  }

  const medicalFile = formData.get("medicalFile");
  if (medicalFile instanceof File && medicalFile.size > 0) {
    const upload = await uploadDocumentAction(
      buildUploadFormData(
        formData,
        "medicalFile",
        "medical_certificate",
        "medicalExpiresAt"
      )
    );
    if (upload.error) return { error: upload.error };
    medicalStoragePath = upload.storagePath ?? "";
  }

  if (!licenseStoragePath || !medicalStoragePath) {
    const { data: pilotProfile } = await supabase
      .from("pilot_profiles")
      .select("onboarding_draft")
      .eq("user_id", user.id)
      .maybeSingle();
    const dbDraft = pilotDraftFromJson(pilotProfile?.onboarding_draft);
    if (!licenseStoragePath) {
      licenseStoragePath = String(dbDraft.licenseStoragePath ?? "");
    }
    if (!medicalStoragePath) {
      medicalStoragePath = String(dbDraft.medicalStoragePath ?? "");
    }
  }

  if (!licenseStoragePath || !medicalStoragePath) {
    return {
      error:
        "Please go back to steps 3–4 and upload your licence and medical certificate.",
    };
  }

  const { data: pilotRow } = await supabase
    .from("pilot_profiles")
    .select("onboarding_draft")
    .eq("user_id", user.id)
    .maybeSingle();
  const kycDraft = pilotDraftFromJson(pilotRow?.onboarding_draft);
  if (!kycDraft.diditKycApproved) {
    const { data: openVr } = await supabase
      .from("verification_requests")
      .select("didit_status")
      .eq("user_id", user.id)
      .eq("requested_role", "pilot")
      .is("reviewed_at", null)
      .maybeSingle();
    if (!isDiditApproved(openVr?.didit_status)) {
      return {
        error:
          "Complete Didit identity verification (step 2) before submitting documents.",
      };
    }
  }

  const licenseOwned = await userOwnsDocumentStoragePath(user.id, licenseStoragePath);
  const medicalOwned = await userOwnsDocumentStoragePath(user.id, medicalStoragePath);
  if (!licenseOwned || !medicalOwned) {
    return { error: "Uploaded documents could not be verified. Please re-upload." };
  }

  const taxAccepted = formData.get("taxDeclaration") === "on";
  if (!taxAccepted) {
    return { error: "You must accept the tax declaration" };
  }

  await supabase.from("pilot_profiles").upsert({
    user_id: user.id,
    license_expires_at: docDatesParsed.data.licenseExpiresAt,
    medical_expires_at: docDatesParsed.data.medicalExpiresAt,
    tax_declaration_accepted_at: new Date().toISOString(),
    onboarding_step: 5,
    onboarding_draft: {
      ...pilotDraftFromFormData(formData),
      licenseStoragePath,
      medicalStoragePath,
      licenseType,
      diditKycApproved: true,
    } as Json,
  });

  const { data: existingVr } = await supabase
    .from("verification_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("requested_role", "pilot")
    .is("reviewed_at", null)
    .maybeSingle();

  if (!existingVr) {
    const { error: vrError } = await supabase.from("verification_requests").insert({
      user_id: user.id,
      requested_role: "pilot",
    });
    if (vrError) {
      if (vrError.code === "23505") {
        return { error: "Zahtjev za verifikaciju već postoji. Pričekaj admin odobrenje." };
      }
      return { error: vrError.message };
    }
  }

  const { error: statusError } = await supabase
    .from("profiles")
    .update({ status: "pending" })
    .eq("id", user.id);

  if (statusError) return { error: statusError.message };

  redirect("/dashboard");
}

export async function submitPilotUpgradeAction(
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const profile = await getProfile();
  if (profile?.role !== "passenger" || profile.status !== "verified") {
    return { error: "Only verified passengers can upgrade to pilot." };
  }

  const supabase = await createClient();

  const identity = await assertPassengerIdentityVerified(supabase, user.id);
  if (identity.error) return { error: identity.error };

  if (await hasPendingUpgradeRequest(supabase, user.id)) {
    return {
      error:
        "You already have a pending upgrade request. Contact support@gallebo.app to make changes.",
    };
  }

  const profileResult = await savePassengerProfileAction({}, formData);
  if (profileResult.error) return profileResult;

  const docDatesParsed = pilotDocumentSchema.safeParse({
    licenseExpiresAt: formData.get("licenseExpiresAt"),
    medicalExpiresAt: formData.get("medicalExpiresAt"),
  });
  if (!docDatesParsed.success) {
    return { error: docDatesParsed.error.issues[0]?.message ?? "Invalid document dates" };
  }

  const licenseType =
    formData.get("licenseType") === "lapl_license" ? "lapl_license" : "ppl_license";
  let licenseStoragePath = String(formData.get("licenseStoragePath") ?? "");
  let medicalStoragePath = String(formData.get("medicalStoragePath") ?? "");

  const licenseFile = formData.get("licenseFile");
  if (licenseFile instanceof File && licenseFile.size > 0) {
    const upload = await uploadDocumentAction(
      buildUploadFormData(formData, "licenseFile", licenseType, "licenseExpiresAt")
    );
    if (upload.error) return { error: upload.error };
    licenseStoragePath = upload.storagePath ?? "";
  }

  const medicalFile = formData.get("medicalFile");
  if (medicalFile instanceof File && medicalFile.size > 0) {
    const upload = await uploadDocumentAction(
      buildUploadFormData(
        formData,
        "medicalFile",
        "medical_certificate",
        "medicalExpiresAt"
      )
    );
    if (upload.error) return { error: upload.error };
    medicalStoragePath = upload.storagePath ?? "";
  }

  if (!licenseStoragePath || !medicalStoragePath) {
    const { data: pilotProfile } = await supabase
      .from("pilot_profiles")
      .select("onboarding_draft")
      .eq("user_id", user.id)
      .maybeSingle();
    const dbDraft = pilotDraftFromJson(pilotProfile?.onboarding_draft);
    if (!licenseStoragePath) {
      licenseStoragePath = String(dbDraft.licenseStoragePath ?? "");
    }
    if (!medicalStoragePath) {
      medicalStoragePath = String(dbDraft.medicalStoragePath ?? "");
    }
  }

  if (!licenseStoragePath || !medicalStoragePath) {
    return {
      error: "Please upload your licence and medical certificate before submitting.",
    };
  }

  const licenseOwned = await userOwnsDocumentStoragePath(user.id, licenseStoragePath);
  const medicalOwned = await userOwnsDocumentStoragePath(user.id, medicalStoragePath);
  if (!licenseOwned || !medicalOwned) {
    return { error: "Uploaded documents could not be verified. Please re-upload." };
  }

  const taxAccepted = formData.get("taxDeclaration") === "on";
  if (!taxAccepted) {
    return { error: "You must accept the tax declaration" };
  }

  await supabase.from("pilot_profiles").upsert({
    user_id: user.id,
    license_expires_at: docDatesParsed.data.licenseExpiresAt,
    medical_expires_at: docDatesParsed.data.medicalExpiresAt,
    tax_declaration_accepted_at: new Date().toISOString(),
    onboarding_step: 5,
    onboarding_draft: {
      ...pilotDraftFromFormData(formData),
      licenseStoragePath,
      medicalStoragePath,
      licenseType,
    } as Json,
  });

  const { data: existingPilotVr } = await supabase
    .from("verification_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("requested_role", "pilot")
    .is("reviewed_at", null)
    .maybeSingle();

  if (!existingPilotVr) {
    const { error: vrError } = await supabase.from("verification_requests").insert({
      user_id: user.id,
      requested_role: "pilot",
    });
    if (vrError) {
      if (vrError.code === "23505") {
        return {
          error:
            "You already have a pending upgrade request. Contact support@gallebo.app to make changes.",
        };
      }
      return { error: vrError.message };
    }
  }

  const { error: statusError } = await supabase
    .from("profiles")
    .update({ status: "pending" })
    .eq("id", user.id);

  if (statusError) return { error: statusError.message };

  redirect("/passenger?upgradeSubmitted=pilot");
}

export async function submitAirfieldRequestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const profile = await getProfile();
  const supabase = await createClient();

  if (profile?.role === "passenger" && profile.status === "verified") {
    const identity = await assertPassengerIdentityVerified(supabase, user.id);
    if (identity.error) return { error: identity.error };

    if (await hasPendingUpgradeRequest(supabase, user.id)) {
      return {
        error:
          "You already have a pending upgrade request. Contact support@gallebo.app to make changes.",
      };
    }
  } else if (profile?.role !== null && profile?.role !== "passenger") {
    return { error: "Airfield operator requests are only available during onboarding." };
  }

  const parsed = airfieldRequestSchema.safeParse({
    airfieldName: formData.get("airfieldName"),
    icaoCode: formData.get("icaoCode"),
    location: formData.get("location"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const upload = await uploadDocumentAction(formData);
  if (upload.error) return { error: upload.error };

  const { error } = await supabase.from("airfield_operator_requests").insert({
    user_id: user.id,
    airfield_name: parsed.data.airfieldName,
    icao_code: parsed.data.icaoCode,
    location: parsed.data.location,
    contact_email: parsed.data.contactEmail,
    contact_phone: parsed.data.contactPhone,
  });

  if (error) return { error: error.message };

  if (profile?.status !== "verified") {
    await supabase.from("profiles").update({ status: "pending" }).eq("id", user.id);
    redirect("/dashboard");
  }

  redirect("/passenger?upgradeSubmitted=airfield");
}

function buildUploadFormData(
  source: FormData,
  fileKey: string,
  type: string,
  expiresKey: string
): FormData {
  const fd = new FormData();
  const file = source.get(fileKey);
  if (file) fd.set("file", file);
  fd.set("type", type);
  const expires = source.get(expiresKey);
  if (expires) fd.set("expiresAt", String(expires));
  return fd;
}

function pilotDraftFromJson(raw: Json | null | undefined): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return { ...(raw as Record<string, unknown>) };
}

function pilotDraftFromFormData(formData: FormData): Record<string, unknown> {
  return {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    weightKg: String(formData.get("weightKg") ?? ""),
    licenseExpiresAt: String(formData.get("licenseExpiresAt") ?? ""),
    medicalExpiresAt: String(formData.get("medicalExpiresAt") ?? ""),
    licenseType: String(formData.get("licenseType") ?? "ppl_license"),
    licenseStoragePath: String(formData.get("licenseStoragePath") ?? ""),
    licenseDocumentId: String(formData.get("licenseDocumentId") ?? ""),
    medicalStoragePath: String(formData.get("medicalStoragePath") ?? ""),
    medicalDocumentId: String(formData.get("medicalDocumentId") ?? ""),
  };
}

async function userOwnsDocumentStoragePath(
  userId: string,
  storagePath: string
): Promise<boolean> {
  if (!storagePath) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", userId)
    .eq("storage_path", storagePath)
    .in("type", [...PILOT_DOC_TYPES])
    .maybeSingle();
  return Boolean(data?.id);
}
