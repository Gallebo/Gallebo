"use server";

import { randomUUID } from "crypto";

import { requireUser } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_BY_TYPE } from "@/lib/documents/constants";
import type { DocumentType } from "@/lib/types/profile";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

export type UploadResult = { documentId?: string; error?: string };

export async function uploadDocumentAction(
  formData: FormData
): Promise<UploadResult> {
  const user = await requireUser();
  const file = formData.get("file");
  const type = formData.get("type") as DocumentType | null;
  const expiresAt = formData.get("expiresAt");

  if (!(file instanceof File) || !type || !BUCKET_BY_TYPE[type]) {
    return { error: "Invalid upload" };
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return { error: "File must be JPEG, PNG, or PDF" };
  }

  if (file.size > MAX_BYTES) {
    return { error: "File must be under 10MB" };
  }

  const bucket = BUCKET_BY_TYPE[type];
  const objectId = randomUUID();
  const storagePath = `${user.id}/${type}/${objectId}`;

  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      type,
      storage_path: storagePath,
      expires_at:
        typeof expiresAt === "string" && expiresAt.length > 0
          ? expiresAt
          : null,
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  return { documentId: doc.id };
}
