"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import {
  personalInfoSchema,
  pilotDocumentSchema,
  pilotIbanUpdateSchema,
} from "@/lib/auth/schemas";
import { requirePilot } from "@/lib/auth/rbac";
import { phoneToDbValue } from "@/lib/crypto/phone";
import { weightToDbValue } from "@/lib/crypto/weight";
import { uploadDocumentAction } from "@/lib/documents/upload";
import { storePilotIban } from "@/lib/pilot/iban";
import { createClient } from "@/lib/supabase/server";

export type PilotActionState = { error?: string; success?: string };

export async function updatePilotPersonalDataAction(
  _prev: PilotActionState,
  formData: FormData,
): Promise<PilotActionState> {
  try {
    const { user } = await requirePilot();
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

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/pilot");
    revalidatePath("/pilot/edit");
    revalidatePath(`/pilots/${user.id}`);
    return { success: "Profile saved" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to save profile",
    };
  }
}

const PROFILE_BUCKET = "profile-photos";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function uploadPilotAvatarAction(
  _prev: PilotActionState,
  formData: FormData,
): Promise<PilotActionState> {
  try {
    const { user } = await requirePilot();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return { error: "No image provided" };
    }

    if (!ALLOWED_AVATAR_MIME.has(file.type)) {
      return { error: "Use JPEG, PNG, or WebP" };
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return { error: "Image must be under 5MB" };
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const storagePath = `${user.id}/avatar-${randomUUID()}.${ext}`;

    const supabase = await createClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_path: storagePath })
      .eq("id", user.id);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath("/pilot");
    revalidatePath("/pilot/edit");
    revalidatePath(`/pilots/${user.id}`);
    return { success: "Profile photo updated" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Upload failed",
    };
  }
}

export async function getPilotIbanLastFour(): Promise<{
  lastFour: string | null;
  error?: string;
}> {
  try {
    await requirePilot();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_pilot_iban_last_four");

    if (error) {
      return { lastFour: null, error: error.message };
    }

    return { lastFour: data as string | null };
  } catch (e) {
    return {
      lastFour: null,
      error: e instanceof Error ? e.message : "Failed to read IBAN",
    };
  }
}

export async function updatePilotIbanAction(
  _prev: PilotActionState,
  formData: FormData,
): Promise<PilotActionState> {
  try {
    const { user } = await requirePilot();

    const ibanParsed = pilotIbanUpdateSchema.safeParse({
      iban: formData.get("iban"),
      accountHolderName:
        typeof formData.get("accountHolderName") === "string" &&
        String(formData.get("accountHolderName")).trim().length > 0
          ? formData.get("accountHolderName")
          : undefined,
    });

    if (!ibanParsed.success) {
      return {
        error: ibanParsed.error.issues[0]?.message ?? "Invalid IBAN",
      };
    }

    const supabase = await createClient();
    let holderName = ibanParsed.data.accountHolderName?.trim();
    if (!holderName) {
      const { data: pilotRow } = await supabase
        .from("pilot_profiles")
        .select("account_holder_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const existing = pilotRow?.account_holder_name?.trim();
      if (!existing || existing.length < 2) {
        return { error: "Account holder name is required" };
      }
      holderName = existing;
    }

    const ibanResult = await storePilotIban(user.id, ibanParsed.data.iban);
    if (ibanResult.error) {
      return { error: ibanResult.error };
    }

    const { error: ppError } = await supabase
      .from("pilot_profiles")
      .upsert({
        user_id: user.id,
        account_holder_name: holderName,
      });

    if (ppError) {
      return { error: ppError.message };
    }

    revalidatePath("/pilot");
    revalidatePath("/pilot/iban");
    return { success: "IBAN updated" };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to update IBAN",
    };
  }
}

function buildUploadFormData(
  source: FormData,
  fileKey: string,
  type: string,
  expiresKey: string,
): FormData {
  const fd = new FormData();
  const file = source.get(fileKey);
  if (file) fd.set("file", file);
  fd.set("type", type);
  const expires = source.get(expiresKey);
  if (expires) fd.set("expiresAt", String(expires));
  return fd;
}

export async function renewPilotDocumentsAction(
  _prev: PilotActionState,
  formData: FormData,
): Promise<PilotActionState> {
  try {
    const { user } = await requirePilot();

    const docDatesParsed = pilotDocumentSchema.safeParse({
      licenseExpiresAt: formData.get("licenseExpiresAt"),
      medicalExpiresAt: formData.get("medicalExpiresAt"),
    });
    if (!docDatesParsed.success) {
      return {
        error: docDatesParsed.error.issues[0]?.message ?? "Invalid document dates",
      };
    }

    const licenseType =
      formData.get("licenseType") === "lapl_license"
        ? "lapl_license"
        : "ppl_license";

    const licenseUpload = await uploadDocumentAction(
      buildUploadFormData(formData, "licenseFile", licenseType, "licenseExpiresAt"),
    );
    if (licenseUpload.error) return { error: licenseUpload.error };

    const medicalUpload = await uploadDocumentAction(
      buildUploadFormData(
        formData,
        "medicalFile",
        "medical_certificate",
        "medicalExpiresAt",
      ),
    );
    if (medicalUpload.error) return { error: medicalUpload.error };

    const supabase = await createClient();
    const { error: ppError } = await supabase.from("pilot_profiles").upsert({
      user_id: user.id,
      license_expires_at: docDatesParsed.data.licenseExpiresAt,
      medical_expires_at: docDatesParsed.data.medicalExpiresAt,
    });

    if (ppError) {
      return { error: ppError.message };
    }

    revalidatePath("/pilot");
    revalidatePath("/pilot/documents");
    return {
      success:
        "Documents uploaded for review. New expiry dates have been saved.",
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to upload documents",
    };
  }
}
