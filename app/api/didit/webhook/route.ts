import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { getDiditConfig } from "@/lib/didit/config";
import { createAdminClient } from "@/lib/supabase/admin";

function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return signature === expected;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-didit-signature") ??
    request.headers.get("x-signature");

  let secret: string;
  try {
    secret = getDiditConfig().DIDIT_WEBHOOK_SECRET;
  } catch {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as {
    session_id?: string;
    status?: string;
    vendor_data?: string;
    user_id?: string;
  };

  const sessionId = body.session_id;
  const userId = body.vendor_data ?? body.user_id;
  const status = (body.status ?? "").toLowerCase();

  if (!sessionId || !userId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const admin = createAdminClient();

  await admin
    .from("verification_requests")
    .update({ didit_status: status })
    .eq("didit_session_id", sessionId);

  const approved =
    status === "approved" || status === "verified" || status === "passed";

  if (approved) {
    await admin
      .from("verification_requests")
      .update({ auto_approved: true })
      .eq("didit_session_id", sessionId);

    await admin
      .from("profiles")
      .update({ status: "verified", role: "passenger" })
      .eq("id", userId);
  }

  await admin.from("notification_queue").insert({
    user_id: userId,
    type: "kyc_result",
    payload: { sessionId, status, approved },
  });

  return NextResponse.json({ ok: true });
}
