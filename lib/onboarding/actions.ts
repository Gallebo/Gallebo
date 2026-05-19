"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/rbac";
import { airfieldRequestSchema, personalInfoSchema, pilotDocumentSchema, pilotIbanSchema } from "@/lib/auth/schemas";
import { phoneToDbValue } from "@/lib/crypto/phone";
import { weightToDbValue } from "@/lib/crypto/weight";
import { uploadDocumentAction } from "@/lib/documents/upload";
import { storePilotIban } from "@/lib/pilot/iban";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type ActionState = { error?: string; success?: string };

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
  return { success: "Draft saved" };
}

export async function submitPilotVerificationAction(
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const profileResult = await savePassengerProfileAction({}, formData);
  if (profileResult.error) return profileResult;

  const docDatesParsed = pilotDocumentSchema.safeParse({
    licenseExpiresAt: formData.get("licenseExpiresAt"),
    medicalExpiresAt: formData.get("medicalExpiresAt"),
  });
  if (!docDatesParsed.success) {
    return { error: docDatesParsed.error.issues[0]?.message ?? "Invalid document dates" };
  }

  const licenseType = formData.get("licenseType") === "lapl_license" ? "lapl_license" : "ppl_license";
  const licenseUpload = await uploadDocumentAction(
    buildUploadFormData(formData, "licenseFile", licenseType, "licenseExpiresAt")
  );
  if (licenseUpload.error) return { error: licenseUpload.error };

  const medicalUpload = await uploadDocumentAction(
    buildUploadFormData(formData, "medicalFile", "medical_certificate", "medicalExpiresAt")
  );
  if (medicalUpload.error) return { error: medicalUpload.error };

  const ibanParsed = pilotIbanSchema.safeParse({
    iban: formData.get("iban"),
    accountHolderName: formData.get("accountHolderName"),
  });
  if (!ibanParsed.success) {
    return { error: ibanParsed.error.issues[0]?.message ?? "Invalid IBAN" };
  }

  const taxAccepted = formData.get("taxDeclaration") === "on";
  if (!taxAccepted) {
    return { error: "You must accept the tax declaration" };
  }

  const ibanResult = await storePilotIban(user.id, ibanParsed.data.iban);
  if (ibanResult.error) return { error: ibanResult.error };

  const supabase = await createClient();
  await supabase.from("pilot_profiles").upsert({
    user_id: user.id,
    license_expires_at: docDatesParsed.data.licenseExpiresAt,
    medical_expires_at: docDatesParsed.data.medicalExpiresAt,
    account_holder_name: ibanParsed.data.accountHolderName,
    tax_declaration_accepted_at: new Date().toISOString(),
    onboarding_step: 5,
  });

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

  const { error: statusError } = await supabase
    .from("profiles")
    .update({ status: "pending" })
    .eq("id", user.id);

  if (statusError) return { error: statusError.message };

  redirect("/dashboard");
}

export async function submitAirfieldRequestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
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

  const supabase = await createClient();
  const { error } = await supabase.from("airfield_operator_requests").insert({
    user_id: user.id,
    airfield_name: parsed.data.airfieldName,
    icao_code: parsed.data.icaoCode,
    location: parsed.data.location,
    contact_email: parsed.data.contactEmail,
    contact_phone: parsed.data.contactPhone,
  });

  if (error) return { error: error.message };

  await supabase
    .from("profiles")
    .update({ status: "pending" })
    .eq("id", user.id);

  redirect("/dashboard");
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
