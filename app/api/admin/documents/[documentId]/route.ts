import { NextResponse } from "next/server";

import { getProfile, getSessionUser } from "@/lib/auth/rbac";
import { BUCKET_BY_TYPE } from "@/lib/documents/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DocumentType } from "@/lib/types/profile";

function contentTypeFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

function filenameFromPath(path: string): string {
  const segment = path.split("/").pop();
  return segment && segment.length > 0 ? segment : "document";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await getProfile();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { documentId } = await context.params;
  const admin = createAdminClient();

  const { data: document, error: documentError } = await admin
    .from("documents")
    .select("id, type, storage_path")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError || !document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bucket = BUCKET_BY_TYPE[document.type as DocumentType];
  if (!bucket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: file, error: downloadError } = await admin.storage
    .from(bucket)
    .download(document.storage_path);

  if (downloadError || !file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filename = filenameFromPath(document.storage_path);
  const contentType = contentTypeFromPath(document.storage_path);

  return new NextResponse(await file.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
